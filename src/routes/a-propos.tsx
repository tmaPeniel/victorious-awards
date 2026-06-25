import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Section } from "@/components/victorious/Section";
import { VLink } from "@/components/victorious/VButton";
import { pillars } from "@/content/pillars";
import { team } from "@/content/team";
import { ArrowRight } from "lucide-react";
import portrait from "@/assets/hero-portrait.jpg";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Victorious | ICC Rouen" },
      {
        name: "description",
        content:
          "L'histoire, la vision et les valeurs de Victorious — la cérémonie de gala d'ICC Rouen qui célèbre les parcours marqués par la fidélité de Dieu.",
      },
      { property: "og:title", content: "À propos — Victorious" },
      {
        property: "og:description",
        content: "Notre histoire, notre vision, nos valeurs, notre équipe.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  { title: "Sincérité", text: "Aucun trophée ne vaut sans la vérité du témoignage qui le porte." },
  { title: "Excellence", text: "Faire les choses bien, parce que la fidélité de Dieu mérite notre meilleur." },
  { title: "Hospitalité", text: "Chaque invité doit se sentir attendu, vu, reconnu." },
  { title: "Espérance", text: "Tout est possible à celui qui croit. Cette nuit le rappelle." },
];

function AboutPage() {
  return (
    <>
      {/* Hero éditorial */}
      <section className="relative isolate min-h-[70svh] overflow-hidden bg-obsidian pt-32 pb-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-20 lg:px-10">
          <div>
            <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
              <span className="h-px w-12 bg-champagne/50" />
              À propos
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl"
            >
              Une nuit née
              <br />
              <span className="font-display-italic text-champagne">
                d'une conviction.
              </span>
            </motion.h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/70">
              Victorious est née d'une intuition simple : les victoires des
              uns peuvent devenir le souffle des autres. Et le silence sur ce
              que Dieu fait, dans la vie ordinaire de Son peuple, est une
              injustice à laquelle nous voulions répondre.
            </p>
          </div>
          <div className="relative hidden lg:block">
            <img src={portrait} alt="" className="aspect-[4/5] w-full object-cover shadow-frame" />
          </div>
        </div>
      </section>

      {/* Notre histoire */}
      <Section
        numeral="I"
        eyebrow="Notre histoire"
        title="D'une intuition, à une nuit attendue."
      >
        <div className="max-w-3xl space-y-6 text-lg leading-relaxed text-ivory/75">
          <p>
            Tout a commencé par une conversation. Un dimanche soir, autour
            d'une table : combien d'histoires extraordinaires se vivent dans
            notre communauté, et combien restent invisibles ?
          </p>
          <p>
            Quelques mois plus tard, l'idée d'une cérémonie annuelle
            prenait forme. Pas un service. Pas une conférence. Un gala. Une
            soirée où l'on s'habille, où l'on dresse de belles tables, où
            l'on prononce des discours — pour dire merci.
          </p>
          <p>
            La première édition a réuni cent cinquante personnes. La
            deuxième, trois cents. Aujourd'hui, Victorious est devenue
            l'événement d'ouverture de l'été pour la communauté ICC Rouen
            et bien au-delà.
          </p>
        </div>
      </Section>

      {/* Notre vision — reprise piliers */}
      <Section
        numeral="II"
        eyebrow="Notre vision"
        title="Rendre grâce, inspirer, connecter."
        className="bg-velvet/20"
      >
        <div className="grid gap-px bg-champagne/15 lg:grid-cols-3">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="flex flex-col gap-5 bg-obsidian p-10"
            >
              <span className="font-display text-5xl text-gold">
                {p.numeral}
              </span>
              <h3 className="font-display text-2xl text-ivory">{p.title}</h3>
              <p className="font-display-italic text-sm text-champagne/70">
                {p.subtitle}
              </p>
              <p className="text-sm leading-relaxed text-ivory/65">{p.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Valeurs */}
      <Section
        numeral="III"
        eyebrow="Nos valeurs"
        title="Quatre boussoles."
      >
        <div className="grid gap-8 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="border-l border-gold pl-6">
              <h3 className="font-display text-2xl text-ivory">{v.title}</h3>
              <p className="mt-3 text-base text-ivory/70">{v.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Équipe */}
      <Section
        numeral="IV"
        eyebrow="Notre équipe"
        title="Celles et ceux qui veillent."
        className="bg-velvet/20"
      >
        <div className="grid gap-px bg-champagne/15 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="bg-obsidian p-8">
              <div className="aspect-square bg-velvet/60" aria-hidden="true" />
              <h3 className="mt-6 font-display text-xl text-ivory">{m.name}</h3>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.25em] text-champagne/70">
                {m.role}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ivory/65">
                {m.bio}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <section className="border-t border-champagne/15 py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-4xl text-ivory sm:text-5xl">
            Prêt à écrire la suite ?
          </h2>
          <div className="mt-10">
            <VLink to="/candidater" size="lg">
              Candidater
              <ArrowRight className="size-4" />
            </VLink>
          </div>
        </div>
      </section>
    </>
  );
}
