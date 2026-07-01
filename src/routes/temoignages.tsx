import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Play, ArrowRight, Quote } from "lucide-react";
import { Section } from "@/components/victorious/Section";
import { VLink } from "@/components/victorious/VButton";
import { VideoLightbox } from "@/components/victorious/VideoLightbox";
import { useTestimonials, type TestimonialRow } from "@/lib/use-testimonials";
import { parseVideoUrl } from "@/lib/parse-video-url";
import { cn } from "@/lib/utils";
import hero from "@/assets/pages/temoignages-hero.jpg";

export const Route = createFileRoute("/temoignages")({
  head: () => ({
    meta: [
      { title: "Témoignages — Victorious | ICC Rouen" },
      {
        name: "description",
        content:
          "Les paroles et les récits des précédents lauréats de Victorious — la cérémonie de gala d'ICC Rouen qui célèbre les victoires du peuple de Dieu.",
      },
      { property: "og:title", content: "Témoignages — Victorious" },
      {
        property: "og:description",
        content: "Ceux qui ont reçu un trophée racontent ce que Dieu a fait.",
      },
    ],
  }),
  component: TemoignagesPage,
});

type TypeFilter = "all" | "written" | "video";

function TemoignagesPage() {
  const { items, isLoading } = useTestimonials();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [videoOpen, setVideoOpen] = useState<string | null>(null);
  const [storyOpen, setStoryOpen] = useState<TestimonialRow | null>(null);

  const years = useMemo(() => {
    const s = new Set<number>();
    items.forEach((i) => s.add(i.edition_year));
    return Array.from(s).sort((a, b) => b - a);
  }, [items]);

  const filtered = items.filter(
    (i) =>
      (typeFilter === "all" || i.type === typeFilter) &&
      (yearFilter === "all" || String(i.edition_year) === yearFilter),
  );

  const videos = filtered.filter((i) => i.type === "video");
  const written = filtered.filter((i) => i.type === "written");

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-40 pb-16">
        <div className="absolute inset-0 z-0">
          <img
            src={hero}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-30"
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
            Témoignages
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-4xl font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl"
          >
            Ils ont reçu.
            <br />
            <span className="font-display-italic text-champagne">
              Ils racontent.
            </span>
          </motion.h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ivory/70">
            Derrière chaque trophée remis lors de Victorious, il y a une histoire.
            Voici quelques-unes des paroles et des visages des précédents lauréats.
          </p>

          {/* Filters */}
          <div className="mt-14 flex flex-wrap items-center gap-6">
            <div role="tablist" aria-label="Filtrer par type" className="flex flex-wrap gap-2">
              {(
                [
                  { v: "all", l: "Tous" },
                  { v: "written", l: "Écrits" },
                  { v: "video", l: "Vidéos" },
                ] as { v: TypeFilter; l: string }[]
              ).map((f) => (
                <button
                  key={f.v}
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === f.v}
                  onClick={() => setTypeFilter(f.v)}
                  className={cn(
                    "h-11 px-6 text-[0.7rem] uppercase tracking-[0.25em] transition-all",
                    typeFilter === f.v
                      ? "bg-champagne text-obsidian"
                      : "border border-champagne/30 text-champagne hover:border-champagne",
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
            {years.length > 1 && (
              <div className="flex items-center gap-3">
                <label
                  htmlFor="year"
                  className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/60"
                >
                  Édition
                </label>
                <select
                  id="year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="h-11 border border-champagne/30 bg-obsidian px-4 text-xs uppercase tracking-[0.2em] text-champagne"
                >
                  <option value="all">Toutes</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vidéos */}
      {videos.length > 0 && (
        <Section
          numeral="I"
          eyebrow="Témoignages vidéo"
          title="Les regarder en parler."
          className="pt-8"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => {
              const parsed = parseVideoUrl(v.video_url);
              const thumb =
                v.video_thumbnail_url ??
                (parsed?.kind === "youtube" ? parsed.thumbnailUrl : null) ??
                v.photo_url;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => v.video_url && setVideoOpen(v.video_url)}
                  className="group relative block overflow-hidden bg-velvet text-left"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`Miniature du témoignage de ${v.winner_name}`}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="size-full bg-velvet" />
                    )}
                    <div className="absolute inset-0 bg-obsidian/40 transition-colors group-hover:bg-obsidian/20" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="grid size-16 place-items-center rounded-full border border-champagne/60 bg-obsidian/60 text-champagne transition-transform group-hover:scale-110">
                        <Play className="size-6 translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
                      Édition {v.edition_year}
                    </div>
                    <h3 className="mt-2 font-display text-xl text-ivory">
                      {v.winner_name}
                    </h3>
                    {v.quote && (
                      <p className="mt-2 line-clamp-2 text-sm text-ivory/65">
                        « {v.quote} »
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Écrits */}
      {written.length > 0 && (
        <Section
          numeral={videos.length > 0 ? "II" : "I"}
          eyebrow="Témoignages écrits"
          title="Leurs mots, gardés."
          className={cn(videos.length > 0 && "bg-velvet/20")}
        >
          <div className="grid gap-6 md:grid-cols-2">
            {written.map((w) => (
              <article
                key={w.id}
                className="flex flex-col gap-6 bg-obsidian p-8 sm:flex-row"
              >
                <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-velvet sm:w-40">
                  {w.photo_url ? (
                    <img
                      src={w.photo_url}
                      alt={`Portrait de ${w.winner_name}`}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center font-display text-3xl text-champagne/40">
                      {w.winner_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <Quote
                    className="size-6 text-gold"
                    aria-hidden="true"
                  />
                  <p className="mt-3 font-display-italic text-lg leading-relaxed text-ivory/85">
                    {w.quote}
                  </p>
                  <div className="mt-auto pt-5">
                    <div className="font-display text-lg text-ivory">
                      {w.winner_name}
                    </div>
                    <div className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
                      Édition {w.edition_year}
                    </div>
                    {w.full_story && (
                      <button
                        type="button"
                        onClick={() => setStoryOpen(w)}
                        className="mt-4 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-champagne hover:text-gold"
                      >
                        Lire le témoignage complet
                        <ArrowRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <Section>
          <div className="border border-champagne/15 p-16 text-center">
            <p className="text-lg text-ivory/60">
              Aucun témoignage à afficher pour ces filtres.
            </p>
          </div>
        </Section>
      )}

      {/* CTA */}
      <section className="border-t border-champagne/15 py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-4xl text-ivory sm:text-5xl">
            Et si votre histoire était la prochaine ?
          </h2>
          <div className="mt-10">
            <VLink to="/candidater" size="lg">
              Candidater
              <ArrowRight className="size-4" />
            </VLink>
          </div>
        </div>
      </section>

      <VideoLightbox url={videoOpen} onClose={() => setVideoOpen(null)} />

      {/* Story drawer */}
      {storyOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-obsidian/95 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setStoryOpen(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-velvet p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setStoryOpen(null)}
              className="absolute right-4 top-4 text-champagne hover:text-gold"
              aria-label="Fermer"
            >
              ✕
            </button>
            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              Édition {storyOpen.edition_year}
            </div>
            <h3 className="mt-3 font-display text-3xl text-ivory">
              {storyOpen.winner_name}
            </h3>
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-ivory/80">
              {storyOpen.full_story}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
