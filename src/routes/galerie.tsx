import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Play } from "lucide-react";
import { Section } from "@/components/victorious/Section";
import { useGallery, type GalleryDBItem } from "@/lib/use-gallery";
import { cn } from "@/lib/utils";
import galerieHero from "@/assets/pages/galerie-hero.jpg";

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

const PAGE_SIZE = 10;

function extractYear(g: GalleryDBItem): string {
  const fromCaption = g.caption?.match(/\b(19|20)\d{2}\b/)?.[0];
  if (fromCaption) return fromCaption;
  const fromPath = g.imagePath.match(/\b(19|20)\d{2}\b/)?.[0];
  if (fromPath) return fromPath;
  return "Autres";
}

function GaleriePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<GalleryDBItem | null>(null);
  const [visible, setVisible] = useState<Record<string, number>>({});
  const { items: gallery, isLoading } = useGallery();

  const items = gallery.filter((g) => filter === "all" || g.type === filter);

  // Group by year, sort desc (numeric years first, "Autres" last)
  const groupsMap = new Map<string, GalleryDBItem[]>();
  for (const g of items) {
    const y = extractYear(g);
    const arr = groupsMap.get(y) ?? [];
    arr.push(g);
    groupsMap.set(y, arr);
  }
  const groups = Array.from(groupsMap.entries()).sort((a, b) => {
    const na = Number(a[0]);
    const nb = Number(b[0]);
    if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
    if (Number.isNaN(na)) return 1;
    if (Number.isNaN(nb)) return -1;
    return nb - na;
  });

  const showMore = (year: string) =>
    setVisible((v) => ({ ...v, [year]: (v[year] ?? PAGE_SIZE) + PAGE_SIZE }));

  // Reset pagination when filter changes
  const handleFilter = (f: Filter) => {
    setFilter(f);
    setVisible({});
  };

  return (
    <>
      <section className="relative isolate overflow-hidden pt-40 pb-12">
        <div className="absolute inset-0 z-0">
          <img
            src={galerieHero}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-20"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 0% 50%, oklch(0.10 0.05 290 / 0.92) 0%, oklch(0.10 0.05 290 / 0.55) 55%, transparent 80%), linear-gradient(180deg, oklch(0.10 0.05 290 / 0.80) 0%, oklch(0.10 0.05 290 / 0.97) 100%)",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
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
                onClick={() => handleFilter(f.value)}
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
        <div className="space-y-20">
          {groups.map(([year, groupItems]) => {
            const count = visible[year] ?? PAGE_SIZE;
            const shown = groupItems.slice(0, count);
            const remaining = groupItems.length - shown.length;
            const isYear = !Number.isNaN(Number(year));
            return (
              <div key={year}>
                <div className="mb-8 flex items-end justify-between gap-6 border-b border-champagne/20 pb-4">
                  <div>
                    <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
                      <span className="h-px w-8 bg-champagne/50" />
                      {isYear ? "Édition" : "Archives"}
                    </div>
                    <h2 className="mt-3 font-display text-4xl text-ivory sm:text-5xl">
                      {isYear ? year : year}
                    </h2>
                  </div>
                  <div className="hidden text-[0.7rem] uppercase tracking-[0.25em] text-champagne/60 sm:block">
                    {groupItems.length} {groupItems.length > 1 ? "souvenirs" : "souvenir"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {shown.map((g, i) => (
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

                {remaining > 0 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => showMore(year)}
                      className="h-11 border border-champagne/40 px-8 text-[0.7rem] uppercase tracking-[0.3em] text-champagne transition-colors hover:bg-champagne hover:text-obsidian"
                    >
                      Voir plus ({remaining} restantes)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isLoading && items.length === 0 && (
          <p className="py-24 text-center text-ivory/50">
            Aucun contenu publié pour le moment.
          </p>
        )}
        {isLoading && (
          <p className="py-24 text-center text-ivory/50">Chargement…</p>
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
