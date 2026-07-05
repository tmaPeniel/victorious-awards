import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Section } from "@/components/victorious/Section";
import { VLink } from "@/components/victorious/VButton";
import { pillars } from "@/content/pillars";
import { team } from "@/content/team";
import { ArrowRight } from "lucide-react";
import portrait from "@/assets/home/hero-portrait-violet.jpg";
import aboutHero from "@/assets/pages/about-hero.jpg";
import visionnairesCouple from "@/assets/team/visionnaires-couple.jpg";

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
      <section className="relative isolate min-h-[70svh] overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 z-0">
          <img src={aboutHero} alt="" aria-hidden="true" className="size-full object-cover opacity-40" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 0% 50%, oklch(0.10 0.05 290 / 0.92) 0%, oklch(0.10 0.05 290 / 0.55) 55%, transparent 80%), linear-gradient(180deg, oklch(0.12 0.06 290 / 0.75) 0%, oklch(0.10 0.05 290 / 0.97) 100%)",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-20 lg:px-10">
          <div>
            <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
              <span className="h-px w-12 bg-champagne/50" />À propos
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl"
            >
              Une célébration de
              <br />
              <span className="font-display-italic text-champagne">la fidélité de Dieu.</span>
            </motion.h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/70">
              Victorious est née d'une conviction profonde : derrière chaque victoire se cache la fidélité de Dieu.
              Chaque parcours, chaque accomplissement et chaque étape franchie témoignent de Son œuvre dans la vie de
              celles et ceux qui Lui font confiance. Parce qu'un témoignage peut fortifier une foi, inspirer une
              vocation et encourager une nouvelle génération à croire que tout est possible avec Dieu, Victorious
              célèbre ces histoires qui méritent d'être entendues et transmises.
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
        title={<span className="font-display-italic text-champagne">D'une vision, à une célébration.</span>}
      >
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16">
          <figure className="relative">
            <div className="absolute -inset-3 border border-gold/30" aria-hidden="true" />
            <img
              src={visionnairesCouple}
              alt="Pasteurs Luka et Marie-Ange ANKOU, visionnaires de Victorious."
              loading="lazy"
              className="relative aspect-[4/5] w-full object-cover shadow-frame"
            />
            <figcaption className="mt-6 text-center">
              <p className="font-display text-xl text-ivory">Pasteurs Luka & Marie-Ange ANKOU</p>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.3em] text-champagne/70">
                Visionnaires de Victorious
              </p>
            </figcaption>
          </figure>
          <div className="space-y-6 text-lg leading-relaxed text-ivory/75">
            <p>
              Tout a commencé par une conviction : les témoignages de la fidélité de Dieu méritent d'être célébrés.
              Chaque jour, des femmes et des hommes vivent des percées, surmontent des épreuves et accomplissent des
              choses extraordinaires, souvent dans la discrétion.
            </p>
            <p>
              C'est de cette vision qu'est née Victorious. Plus qu'un gala, une soirée d'honneur et de reconnaissance
              où nous prenons le temps de rendre grâce à Dieu pour Son œuvre dans la vie de Son peuple.
            </p>
            <p>
              Au fil des éditions, Victorious est devenue bien plus qu'une cérémonie. C'est un rendez-vous attendu, où
              les histoires individuelles deviennent une source d'inspiration collective, où les victoires sont
              célébrées et où la fidélité de Dieu est mise en lumière.
            </p>
          </div>
        </div>
      </Section>

      {/* Notre vision — reprise piliers */}
      <Section numeral="II" eyebrow="Notre vision" title="Rendre grâce, inspirer, connecter." className="bg-velvet/20">
        <div className="grid gap-px bg-champagne/15 lg:grid-cols-3">
          {pillars.map((p) => (
            <article key={p.title} className="flex flex-col gap-5 bg-obsidian p-10">
              <span className="font-display text-5xl text-gold">{p.numeral}</span>
              <h3 className="font-display text-2xl text-ivory">{p.title}</h3>
              <p className="font-display-italic text-sm text-champagne/70">{p.subtitle}</p>
              <p className="text-sm leading-relaxed text-ivory/65">{p.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Visionnaires */}
      <Section
        numeral="III"
        eyebrow="Les visionnaires"
        title="Pasteurs Luka & Marie-Ange ANKOU."
        className="bg-velvet/20"
      >
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <figure className="relative">
            <div className="absolute -inset-3 border border-gold/30" aria-hidden="true" />
            <img
              src={visionnairesCouple}
              alt="Pasteurs Luka et Marie-Ange ANKOU, visionnaires de Victorious."
              loading="lazy"
              className="relative aspect-[4/5] w-full object-cover shadow-frame"
            />
          </figure>
          <div className="space-y-8">
            {team
              .filter((m) => m.visionary)
              .map((m) => (
                <div key={m.name} className="border-l border-gold/60 pl-6">
                  <h3 className="font-display text-2xl text-ivory">{m.name}</h3>
                  <p className="mt-1 text-[0.7rem] uppercase tracking-[0.25em] text-champagne/70">{m.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ivory/70">{m.bio}</p>
                </div>
              ))}
          </div>
        </div>
      </Section>

      <section className="border-t border-champagne/15 py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-4xl text-ivory sm:text-5xl">Prêt à écrire la suite ?</h2>
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
