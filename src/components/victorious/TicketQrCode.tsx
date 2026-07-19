import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function TicketQrCode({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(value, {
      width: 320,
      margin: 2,
      color: { dark: "#171020", light: "#fffdf7" },
      errorCorrectionLevel: "H",
    }).then((result) => active && setSrc(result));
    return () => {
      active = false;
    };
  }, [value]);

  return src ? (
    <img src={src} alt={label} width={320} height={320} className="size-full" />
  ) : (
    <div className="grid aspect-square place-items-center bg-ivory text-sm text-obsidian">
      Création du QR…
    </div>
  );
}
