import { X } from "lucide-react";
import { useEffect } from "react";
import { parseVideoUrl } from "@/lib/parse-video-url";

type Props = {
  url: string | null;
  onClose: () => void;
};

export function VideoLightbox({ url, onClose }: Props) {
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [url, onClose]);

  if (!url) return null;
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-obsidian/95 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Lecture vidéo"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la vidéo"
        className="absolute right-6 top-6 grid size-11 place-items-center border border-champagne/40 text-champagne hover:bg-champagne hover:text-obsidian"
      >
        <X className="size-5" />
      </button>
      <div
        className="relative w-full max-w-5xl aspect-video shadow-frame"
        onClick={(e) => e.stopPropagation()}
      >
        {parsed.kind === "file" ? (
          <video
            src={parsed.url}
            controls
            autoPlay
            className="size-full bg-black"
          />
        ) : (
          <iframe
            src={parsed.embedUrl}
            title="Témoignage vidéo"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="size-full border-0"
          />
        )}
      </div>
    </div>
  );
}
