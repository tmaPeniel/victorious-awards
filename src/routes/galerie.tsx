import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Play } from "lucide-react";
import { Section } from "@/components/victorious/Section";
import { gallery, type GalleryItem } from "@/content/gallery";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: "Galerie — Victorious | ICC Rouen" },
      {
        name: "description",
        content:
          "Photos, vidéos et replay des éditions de Victorious — la cérémonie de gala d'ICC Rouen.",
      },
      { property: "og:title", content: "Galerie — Victorious" },
      {
        property: "og:description",
        content: "Quelques fragments des nuits passées.",
      },
    ],
  }),
  component: GaleriePage,
});

type Filter = "all" | "photo" | "video" | "replay";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Vidéos" },
  { value: "replay", label: "Replay" },
];

function GaleriePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<GalleryItem | null>(null);

  const items = gallery.filter((g) => filter === "all" || g.type === filter);

  return (
    <>
      <section className="bg-obsidian pt-40 pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
            <span className="h-px w-12 bg-champagne/50" />
            Galerie
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl">
            Fragments
            <br />
            <span className="font-display-italic text-champagne">
              de nuits passées.
            </span>
          </h1>

          <div
            role="tablist"
            aria-label="Filtres de la galerie"
            className="mt-14 flex flex-wrap gap-2"
          >
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "h-11 px-6 text-[0.7rem] uppercase tracking-[0.25em] transition-all",
                  filter === f.value
                    ? "bg-champagne text-obsidian"
                    : "border border-champagne/30 text-champagne hover:border-champagne",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Section className="pt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g, i) => (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => setOpen(g)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: (i % 8) * 0.05 }}
              className={cn(
                "group relative overflow-hidden bg-velvet",
                g.aspect === "portrait" && "aspect-[3/4]",
                g.aspect === "landscape" && "aspect-[4/3]",
                g.aspect === "square" && "aspect-square",
              )}
            >
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                className="size-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-obsidian/0 transition-colors group-hover:bg-obsidian/30" />
              {g.type !== "photo" && (
                <div className="absolute left-3 top-3 grid size-10 place-items-center rounded-full bg-obsidian/70 text-champagne backdrop-blur">
                  <Play className="size-4" fill="currentColor" />
                </div>
              )}
              {g.caption && (
                <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-obsidian to-transparent p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="text-[0.65rem] uppercase tracking-[0.25em] text-champagne">
                    {g.caption}
                  </div>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {items.length === 0 && (
          <p className="py-24 text-center text-ivory/50">
            Aucun contenu dans cette catégorie.
          </p>
        )}
      </Section>

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-obsidian/95 backdrop-blur-md p-4"
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={open.caption ?? open.alt}
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOpen(null)}
              className="absolute right-6 top-6 grid size-12 place-items-center border border-champagne/40 text-champagne hover:bg-champagne hover:text-obsidian transition-colors"
            >
              <X className="size-5" />
            </button>
            <motion.figure
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[88vh] max-w-5xl"
            >
              <img
                src={open.src}
                alt={open.alt}
                className="max-h-[80vh] w-auto object-contain shadow-frame"
              />
              {open.caption && (
                <figcaption className="mt-4 text-center text-sm uppercase tracking-[0.25em] text-champagne/80">
                  {open.caption}
                </figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
