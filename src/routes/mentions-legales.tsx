import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/victorious/Section";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Victorious | ICC Rouen" },
      { name: "description", content: "Mentions légales du site Victorious — ICC Rouen." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="bg-obsidian pt-40 pb-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-10">
          <h1 className="font-display text-5xl text-ivory sm:text-6xl">Mentions légales</h1>
        </div>
      </section>
      <Section>
        <div className="prose prose-invert max-w-3xl space-y-8 text-ivory/75">
          <div>
            <h2 className="font-display text-2xl text-ivory">Éditeur</h2>
            <p className="mt-3 text-base">
              Le site Victorious est édité par ICC Rouen — association culturelle et cultuelle dont
              le siège est situé à Isneauville (Seine-Maritime).
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ivory">Hébergement</h2>
            <p className="mt-3 text-base">
              Ce site est hébergé sur l'infrastructure Lovable Cloud.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ivory">Données personnelles</h2>
            <p className="mt-3 text-base">
              Les données collectées via les formulaires de candidature et de contact sont utilisées
              uniquement pour traiter votre demande. Elles ne sont pas cédées à des tiers et sont
              supprimées lorsque leur conservation n'est plus nécessaire, conformément au RGPD.
            </p>
            <p className="mt-3 text-base">
              Pour exercer vos droits d'accès, de rectification ou de suppression : écrivez-nous à
              rouen.secretariat@gmail.com.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ivory">Propriété intellectuelle</h2>
            <p className="mt-3 text-base">
              L'ensemble des contenus (textes, photographies, vidéos, identité graphique) sont la
              propriété d'ICC Rouen, sauf mention contraire. Toute reproduction est soumise à
              autorisation.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
