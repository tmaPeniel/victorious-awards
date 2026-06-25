import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { VButton } from "@/components/victorious/VButton";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      void navigate({ to: "/admin" });
    }
  }, [loading, session, isAdmin, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const redirect =
          typeof window !== "undefined"
            ? `${window.location.origin}/admin`
            : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        setError(
          "Compte créé. Demandez à un administrateur existant de vous attribuer le rôle.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'authentification");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="font-display text-3xl text-champagne">Victorious</div>
          <div className="mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-ivory/50">
            Espace administrateur
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-6 border border-champagne/15 bg-ivory/[0.02] p-8"
        >
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border-b border-champagne/30 bg-transparent py-3 text-ivory outline-none focus:border-champagne"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border-b border-champagne/30 bg-transparent py-3 text-ivory outline-none focus:border-champagne"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <VButton type="submit" disabled={busy} className="w-full">
            {busy
              ? "…"
              : mode === "signin"
                ? "Connexion"
                : "Créer un compte"}
          </VButton>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="block w-full text-center text-xs uppercase tracking-[0.25em] text-ivory/50 hover:text-champagne"
          >
            {mode === "signin"
              ? "Créer un compte administrateur"
              : "J'ai déjà un compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
