import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/victorious/Section";
import { CategoryCard } from "@/components/victorious/CategoryCard";
import { categories } from "@/content/categories";
import categoriesHero from "@/assets/pages/categories-hero.jpg";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Catégories — Victorious | ICC Rouen" },
      {
        name: "description",
        content:
          "Découvrez les neuf catégories de Victorious : diplôme, premier CDI, achat immobilier, permis, création d'entreprise, plume, impact, musique, famille.",
      },
      { property: "og:title", content: "Les catégories — Victorious" },
      {
        property: "og:description",
        content: "Neuf catégories. Neuf victoires. Neuf histoires.",
      },
    ],
  }),
  component: CategoriesIndex,
});

function CategoriesIndex() {
  return (
    <>
      <section className="relative isolate overflow-hidden pt-40 pb-12">
        <div className="absolute inset-0 z-0">
          <img
            src={categoriesHero}
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
            Les catégories
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl">
            Neuf victoires.{" "}
            <span className="font-display-italic text-champagne">
              Neuf histoires.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-ivory/70">
            Chaque catégorie a son monde, ses critères, ses pièces justificatives.
            Prenez le temps de trouver la vôtre.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.slug} category={cat} index={i} />
          ))}
        </div>
      </Section>
    </>
  );
}
