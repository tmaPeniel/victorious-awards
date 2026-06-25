import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { Section } from "@/components/victorious/Section";
import { VLink } from "@/components/victorious/VButton";
import { useCategories, useCategory } from "@/lib/use-categories";

export const Route = createFileRoute("/categories/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Catégorie ${params.slug} — Victorious` },
      { name: "description", content: "Catégorie Victorious" },
    ],
  }),
  component: CategoryDetail,
});

function CategoryDetail() {
  const { slug } = Route.useParams();
  const { cat, isLoading } = useCategory(slug);
  const { items: all } = useCategories();

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-obsidian px-6 pt-32 text-ivory/60">
        Chargement…
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-obsidian px-6 pt-32">
        <div className="text-center">
          <p className="font-display text-3xl text-ivory">Catégorie introuvable</p>
          <Link to="/categories" className="mt-6 inline-block text-champagne link-underline">
            Voir toutes les catégories
          </Link>
        </div>
      </div>
    );
  }

  const others = all.filter((c) => c.slug !== cat.slug).slice(0, 3);

  return (
    <>
      <section className="relative isolate min-h-[80svh] overflow-hidden bg-obsidian pt-20">
        <div className="absolute inset-0">
          {cat.image && (
            <img
              src={cat.image}
              alt=""
              aria-hidden="true"
              className="size-full object-cover opacity-40"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.14 0.012 60 / 0.5) 0%, oklch(0.14 0.012 60 / 0.6) 50%, oklch(0.14 0.012 60) 100%)",
            }}
          />
        </div>
        <div className="relative mx-auto flex min-h-[80svh] max-w-7xl flex-col justify-end px-6 pb-16 pt-32 lg:px-10 lg:pb-24">
          <Link
            to="/categories"
            className="mb-10 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-champagne/70 link-underline"
          >
            <ArrowLeft className="size-4" /> Toutes les catégories
          </Link>
          <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
            <span className="font-display text-base text-gold">Catégorie</span>
            <span className="h-px w-10 bg-champagne/40" />
            <span>{cat.tagline}</span>
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl">
            {cat.title}
          </h1>
        </div>
      </section>

      <Section>
        <div className="grid gap-16 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="gold-rule font-display text-3xl text-ivory">Description</h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-ivory/75">
              {cat.description}
            </p>

            <h2 className="gold-rule mt-16 font-display text-3xl text-ivory">Critères</h2>
            <ul className="mt-6 space-y-4">
              {cat.criteria.map((c) => (
                <li key={c} className="flex gap-4 text-base text-ivory/75">
                  <Check className="mt-1 size-5 shrink-0 text-gold" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>

            <h2 className="gold-rule mt-16 font-display text-3xl text-ivory">
              Pièces justificatives
            </h2>
            <ul className="mt-6 space-y-4">
              {cat.documents.map((d) => (
                <li key={d} className="flex gap-4 text-base text-ivory/75">
                  <FileText className="mt-1 size-5 shrink-0 text-gold" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <div className="mt-12">
              <VLink to="/candidater" size="lg">
                Je candidate dans cette catégorie
                <ArrowRight className="size-4" />
              </VLink>
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="aspect-[4/5] overflow-hidden shadow-frame bg-velvet">
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="size-full object-cover"
                />
              )}
            </div>
          </aside>
        </div>
      </Section>

      <Section eyebrow="Explorer" title="D'autres catégories" className="bg-velvet/20">
        <div className="grid gap-6 sm:grid-cols-3">
          {others.map((c) => (
            <Link
              key={c.slug}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group block"
            >
              <div className="aspect-[4/5] overflow-hidden shadow-frame bg-velvet">
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-sm text-gold">
                  {String(all.indexOf(c) + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl text-ivory group-hover:text-champagne transition-colors">
                  {c.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
