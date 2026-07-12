import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { Hero } from "@/components/victorious/Hero";
import { Section } from "@/components/victorious/Section";
import { CategoryCard } from "@/components/victorious/CategoryCard";
import { VLink } from "@/components/victorious/VButton";
import { event } from "@/content/event";
import { pillars } from "@/content/pillars";
import { categories } from "@/content/categories";
import { faq } from "@/content/faq";
import { gallery } from "@/content/gallery";
import introBand from "@/assets/home/categories-trophies.jpg";
import pillarGratitude from "@/assets/home/pillar-gratitude.jpg";
import pillarInspire from "@/assets/home/pillar-inspire.jpg";
import pillarConnect from "@/assets/home/pillar-connect.jpg";
import eventHall from "@/assets/home/event-hall.jpg";
import ctaStage from "@/assets/home/cta-stage.jpg";

const pillarImages = [pillarGratitude, pillarInspire, pillarConnect];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Victorious — La Nuit de l'Excellence | ICC Rouen" },
      {
        name: "description",
        content:
          "25 juillet 2026, ICC Rouen célèbre les parcours marqués par la fidélité de Dieu. Découvrez Victorious, candidatez aux 9 catégories.",
      },
      { property: "og:title", content: "Victorious — La Nuit de l'Excellence" },
      {
        property: "og:description",
        content: "Cérémonie de gala — 25 juillet 2026. Rendre grâce, inspirer, connecter.",
      },
    ],
  }),
  component: HomePage,
});

const steps = [
  {
    n: "01",
    title: "Choisir une catégorie",
    text: "Parcourez les 9 catégories et identifiez celle qui raconte votre victoire.",
  },
  {
    n: "02",
    title: "Remplir le formulaire",
    text: "Quelques informations, un témoignage sincère — quelques minutes suffisent.",
  },
  {
    n: "03",
    title: "Partager votre témoignage",
    text: "Racontez votre parcours avec vos mots, simplement et sincèrement.",
  },
  {
    n: "04",
    title: "Validation",
    text: "Notre comité examine chaque dossier. Vous serez recontacté avant la cérémonie.",
  },
];

function HomePage() {
  return (
    <>
      <Hero />

      {/* Présentation */}
      <Section
        numeral="—"
        eyebrow="Victorious"
        title={
          <>
            Une plateforme d’actions de grâce pour dire merci à Dieu
            <br />
            <span className="font-display-italic text-champagne">Et booster la foi de plusieurs. </span>
          </>
        }
        intro="Chaque trophée représente une histoire. Chaque histoire témoigne de la fidélité de Dieu. Notre objectif n'est pas simplement de remettre des récompenses — c'est de rendre grâce, d'inspirer et de connecter."
      />

      {/* Bandeau visuel éditorial */}
      <div className="relative -mt-8 mb-8 px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-[21/9] max-w-7xl overflow-hidden shadow-frame"
        >
          <img
            src={introBand}
            alt="Trophées Victorious dans une mise en scène cinématographique violet et or"
            loading="lazy"
            width={1920}
            height={800}
            className="size-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 50%, oklch(0.13 0.06 290 / 0.6) 100%)",
            }}
          />
        </motion.div>
      </div>

      {/* Infos événement */}
      <Section id="infos" numeral="II" eyebrow="L'événement" title="Une nuit. Un lieu. Une atmosphère.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calendar, label: "Date", value: event.dateLabel },
            { icon: Clock, label: "Heure", value: event.timeLabel },
            { icon: MapPin, label: "Lieu", value: `${event.venue} — ${event.city}` },
            { icon: Sparkles, label: "Dress code", value: event.dressCode },
          ].map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="border border-champagne/15 bg-velvet/40 p-8"
            >
              <it.icon className="size-6 text-gold" aria-hidden="true" />
              <div className="mt-6 text-[0.65rem] uppercase tracking-[0.3em] text-champagne/60">{it.label}</div>
              <div className="mt-2 font-display text-xl text-ivory">{it.value}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 border-l-2 border-gold pl-6">
          <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/60">Programme</div>
          <p className="mt-2 font-display-italic text-xl text-ivory/80">{event.program} — annoncé prochainement.</p>
        </div>
      </Section>

      {/* Aperçu visuel du lieu */}
      <div className="relative px-6 pb-8 lg:px-10">
        <motion.figure
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-[21/9] max-w-7xl overflow-hidden shadow-elegant"
        >
          <img
            src={eventHall}
            alt="Vue panoramique d'une salle de gala richement décorée — atmosphère ICC Rouen Isneauville"
            loading="lazy"
            width={1920}
            height={800}
            className="size-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.13 0.06 290 / 0.25) 0%, transparent 40%, oklch(0.13 0.06 290 / 0.7) 100%)",
            }}
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 lg:p-10">
            <span className="font-display-italic text-lg text-champagne/90 lg:text-2xl">ICC Rouen — Isneauville</span>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.3em] text-ivory/60 sm:block">
              Le théâtre d'une nuit pas comme les autres
            </span>
          </figcaption>
        </motion.figure>
      </div>

      {/* Catégories */}
      <Section
        id="categories"
        numeral="III"
        eyebrow="Les catégories"
        title={
          <>
            9 catégories,{" "}
            <span className="font-display-italic text-champagne">9 séries de témoignages de la fidélité de Dieu.</span>
          </>
        }
        intro="Chacune a sa lumière. Trouvez celle qui raconte votre parcours."
        className="bg-velvet/20"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.slug} category={cat} index={i} />
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <VLink to="/categories" variant="secondary">
            Voir toutes les catégories
            <ArrowRight className="size-4" />
          </VLink>
        </div>
      </Section>

      {/* Parcours candidature */}
      <Section
        id="candidater"
        numeral="IV"
        eyebrow="Candidater"
        title="Le chemin, en quatre temps."
        intro="Simple, sincère, soigné. Voici le parcours pour proposer votre histoire au comité Victorious."
      >
        <ol className="relative space-y-12 border-l border-champagne/20 pl-10 sm:space-y-16 sm:pl-14">
          {steps.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[3.45rem] top-1 grid size-12 place-items-center rounded-full border border-champagne/30 bg-obsidian font-display text-base text-gold sm:-left-[4.05rem]">
                {s.n}
              </div>
              <h3 className="font-display text-2xl text-ivory sm:text-3xl">{s.title}</h3>
              <p className="mt-3 max-w-xl text-base text-ivory/65">{s.text}</p>
            </motion.li>
          ))}
        </ol>
        <div className="mt-16">
          <VLink to="/candidater">
            Commencer ma candidature
            <ArrowRight className="size-4" />
          </VLink>
        </div>
      </Section>

      {/* Galerie aperçu */}
      <Section
        id="galerie"
        numeral="V"
        eyebrow="Galerie"
        title="Quelques fragments des éditions passées."
        className="bg-velvet/20"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.slice(0, 8).map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: (i % 4) * 0.06 }}
              className={
                "relative overflow-hidden bg-velvet " +
                (g.aspect === "portrait"
                  ? "aspect-[3/4]"
                  : g.aspect === "landscape"
                    ? "aspect-[4/3]"
                    : "aspect-square") +
                (i === 0 ? " sm:col-span-2 sm:row-span-2 sm:aspect-square" : "")
              }
            >
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                className="size-full object-cover transition-transform duration-[1500ms] hover:scale-105"
              />
            </motion.div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <VLink to="/galerie" variant="secondary">
            Voir toute la galerie
            <ArrowRight className="size-4" />
          </VLink>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" numeral="VI" eyebrow="Vos questions" title="Tout ce qu'on nous demande, doucement.">
        <Accordion type="single" collapsible className="mx-auto max-w-3xl">
          {faq.map((item, i) => (
            <AccordionItem key={item.q} value={`q-${i}`} className="border-champagne/15">
              <AccordionTrigger className="py-6 text-left font-display text-lg text-ivory hover:no-underline hover:text-champagne sm:text-xl">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-ivory/65">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* CTA final */}
      <section className="relative isolate overflow-hidden border-t border-champagne/15 bg-obsidian-deep py-32 lg:py-48">
        <img
          src={ctaStage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, oklch(0.80 0.135 85 / 0.18) 0%, transparent 55%), linear-gradient(180deg, oklch(0.11 0.055 290 / 0.7) 0%, oklch(0.11 0.055 290 / 0.95) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-8 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70"
          >
            — Et maintenant —
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl leading-[1.05] text-ivory text-balance sm:text-6xl lg:text-7xl"
          >
            Et si votre histoire
            <br />
            <span className="font-display-italic text-champagne">était la prochaine ?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mx-auto mt-8 max-w-xl text-lg text-ivory/70"
          >
            Le 25 juillet, neuf trophées trouveront un foyer. Le vôtre, peut-être.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.35 }}
            className="mt-12"
          >
            <VLink to="/candidater" size="lg">
              Je propose mon histoire
              <ArrowRight className="size-4" />
            </VLink>
          </motion.div>
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-champagne/40">
            <Link to="/categories" className="link-underline">
              ou explorer les catégories
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
