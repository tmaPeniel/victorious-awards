import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Keyboard,
  RotateCcw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/billetterie/controle")({
  component: TicketCheckInPage,
});

type ScanResult = {
  result: string;
  attendee_id?: string;
  first_name?: string;
  last_name?: string;
  reference?: string;
  checked_in_at?: string;
};
type BarcodeDetectorShape = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
}
function extractToken(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("victorious-ticket:")) return trimmed.slice("victorious-ticket:".length);
  try {
    return new URL(trimmed).searchParams.get("token") ?? trimmed;
  } catch {
    return trimmed;
  }
}

function TicketCheckInPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorShape | null>(null);
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };
  useEffect(() => stopCamera, []);

  const validate = useCallback(
    async (rawValue: string) => {
      if (busy) return;
      const token = extractToken(rawValue);
      if (token.length < 32) {
        setError("Code incomplet. Scannez le QR ou collez le code complet.");
        return;
      }
      setBusy(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc("check_in_ticket", {
        p_ticket_token_hash: await hash(token),
      });
      setBusy(false);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setResult(data as ScanResult);
      if ((data as ScanResult).result === "checked_in") navigator.vibrate?.(120);
    },
    [busy],
  );

  const startCamera = async () => {
    setError(null);
    setResult(null);
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorShape;
      }
    ).BarcodeDetector;
    if (!Detector) {
      setError(
        "Ce navigateur ne prend pas en charge le scan intégré. Utilisez Chrome sur Android ou la saisie manuelle.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      detectorRef.current = new Detector({ formats: ["qr_code"] });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setError(
        "La caméra n’est pas accessible. Vérifiez son autorisation ou utilisez la saisie manuelle.",
      );
    }
  };

  useEffect(() => {
    if (!scanning) return;
    const interval = window.setInterval(async () => {
      if (
        !videoRef.current ||
        busy ||
        result ||
        !detectorRef.current ||
        videoRef.current.readyState < 2
      )
        return;
      try {
        const codes = await detectorRef.current.detect(videoRef.current);
        if (codes[0]?.rawValue) {
          stopCamera();
          await validate(codes[0].rawValue);
        }
      } catch {
        /* prochaine image */
      }
    }, 350);
    return () => window.clearInterval(interval);
  }, [scanning, busy, result, validate]);

  const submitManual = (event: FormEvent) => {
    event.preventDefault();
    void validate(manual);
  };
  const reset = () => {
    setResult(null);
    setError(null);
    setManual("");
  };
  const undo = async () => {
    if (!result?.attendee_id) return;
    const { error } = await supabase.rpc("undo_ticket_check_in", {
      p_attendee_id: result.attendee_id,
    });
    if (error) setError(error.message);
    else {
      setResult(null);
      setError("Contrôle annulé. Le billet peut être scanné à nouveau.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <Link
        to="/admin/billetterie"
        className="inline-flex items-center gap-2 text-sm text-ivory/55 hover:text-champagne"
      >
        <ArrowLeft className="size-4" />
        Retour à la billetterie
      </Link>
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-champagne/60">Contrôle d’entrée</p>
        <h1 className="mt-2 font-display text-4xl">Scanner un billet</h1>
        <p className="mt-3 text-sm text-ivory/55">
          Le premier scan enregistre l’entrée. Un billet déjà contrôlé est signalé sans créer de
          doublon.
        </p>
      </header>
      {result ? (
        <ResultCard result={result} onReset={reset} onUndo={undo} />
      ) : (
        <>
          <div className="relative aspect-[4/3] overflow-hidden border border-champagne/20 bg-black/40">
            <video ref={videoRef} muted playsInline className="size-full object-cover" />
            <div className="pointer-events-none absolute inset-[12%] border-2 border-gold shadow-[0_0_0_999px_rgb(0_0_0/0.24)]" />
            {!scanning && (
              <div className="absolute inset-0 grid place-items-center">
                <ScanLine className="size-16 text-champagne/35" />
              </div>
            )}
          </div>
          <button
            onClick={scanning ? stopCamera : startCamera}
            className="inline-flex h-14 w-full items-center justify-center gap-3 bg-champagne text-sm uppercase tracking-[0.15em] text-obsidian"
          >
            {scanning ? (
              <>
                <XCircle className="size-5" />
                Arrêter la caméra
              </>
            ) : (
              <>
                <Camera className="size-5" />
                Ouvrir la caméra
              </>
            )}
          </button>
          <form onSubmit={submitManual} className="border-t border-champagne/15 pt-7">
            <label className="text-xs uppercase tracking-[0.18em] text-champagne/65">
              <span className="flex items-center gap-2">
                <Keyboard className="size-4" />
                Saisie manuelle
              </span>
              <input
                value={manual}
                onChange={(event) => setManual(event.target.value)}
                placeholder="Collez le code du billet"
                className="mt-3 h-12 w-full border border-champagne/20 bg-transparent px-4 text-base placeholder:text-ivory/35"
              />
            </label>
            <button
              disabled={busy}
              className="mt-3 h-11 border border-champagne/35 px-5 text-sm text-champagne disabled:opacity-40"
            >
              {busy ? "Vérification…" : "Vérifier le billet"}
            </button>
          </form>
        </>
      )}
      {error && (
        <div role="alert" className="border border-brick/50 bg-brick/10 p-4 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  result,
  onReset,
  onUndo,
}: {
  result: ScanResult;
  onReset: () => void;
  onUndo: () => void;
}) {
  const valid = result.result === "checked_in";
  const already = result.result === "already_checked_in";
  return (
    <div
      className={`border p-8 text-center ${valid ? "border-champagne/40 bg-champagne/10" : "border-brick/50 bg-brick/10"}`}
      aria-live="assertive"
    >
      {valid ? (
        <CheckCircle2 className="mx-auto size-16 text-gold" />
      ) : (
        <XCircle className="mx-auto size-16 text-brick" />
      )}
      <h2 className="mt-5 font-display text-4xl">
        {valid ? "Entrée validée" : already ? "Billet déjà utilisé" : "Billet non valide"}
      </h2>
      {result.first_name && (
        <p className="mt-4 text-xl text-ivory">
          {result.first_name} {result.last_name}
        </p>
      )}
      {result.reference && (
        <p className="mt-2 font-mono text-sm text-champagne">{result.reference}</p>
      )}
      {already && result.checked_in_at && (
        <p className="mt-3 text-sm text-ivory/55">
          Premier contrôle : {new Date(result.checked_in_at).toLocaleString("fr-FR")}
        </p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          onClick={onReset}
          className="inline-flex h-12 items-center gap-2 bg-champagne px-6 text-sm text-obsidian"
        >
          <ScanLine className="size-4" />
          Scanner le suivant
        </button>
        {valid && (
          <button
            onClick={onUndo}
            className="inline-flex h-12 items-center gap-2 border border-champagne/30 px-5 text-sm text-champagne"
          >
            <RotateCcw className="size-4" />
            Annuler ce contrôle
          </button>
        )}
      </div>
    </div>
  );
}
