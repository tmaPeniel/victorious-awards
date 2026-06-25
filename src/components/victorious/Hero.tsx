import { motion } from "motion/react";
import { ArrowRight, MapPin } from "lucide-react";
import { VLink } from "./VButton";
import { Countdown } from "./Countdown";
import { event } from "@/content/event";
import heroBg from "@/assets/home/hero-bg-violet.jpg";
import heroPortrait from "@/assets/home/hero-portrait-violet.jpg";

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-obsidian-deep">
      {/* Background — violet ceremonial stage */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="size-full object-cover opacity-[0.55]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.55 0.18 295 / 0.35) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, oklch(0.10 0.05 290 / 0.85) 0%, transparent 60%), linear-gradient(180deg, oklch(0.13 0.06 290 / 0.55) 0%, oklch(0.11 0.055 290 / 0.85) 70%, oklch(0.10 0.05 290) 100%)",
          }}
        />
      </div>


      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-32 pb-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:px-10">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/80"
          >
            <span className="h-px w-12 bg-champagne/50" />
            <span>{event.edition}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 font-display text-[clamp(3.5rem,11vw,9rem)] leading-[0.92] tracking-[-0.03em] text-ivory"
          >
            Victori
            <span className="font-display-italic text-champagne">ous</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl font-display-italic text-2xl text-champagne/90 sm:text-3xl"
          >
            La Nuit de l'Excellence.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-ivory/70 sm:text-lg"
          >
            Une cérémonie de gala pour célébrer les parcours marqués par
            la fidélité de Dieu. Chaque trophée, une histoire. Chaque histoire,
            un témoignage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-ivory/80"
          >
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/60">
                Date
              </div>
              <div className="mt-1 font-display text-xl text-ivory">
                {event.dateLabel}
              </div>
            </div>
            <div className="hidden h-10 w-px bg-champagne/20 sm:block" />
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/60">
                Lieu
              </div>
              <div className="mt-1 flex items-center gap-2 font-display text-xl text-ivory">
                <MapPin className="size-4 text-gold" />
                {event.venue} — {event.city}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.65 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <VLink to="/candidater" size="lg">
              Je candidate
              <ArrowRight className="size-4" />
            </VLink>
            <VLink to="/a-propos" size="lg" variant="secondary">
              Découvrir Victorious
            </VLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.9 }}
            className="mt-16 hidden lg:block"
          >
            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/50 mb-5">
              Le rideau se lève dans
            </div>
            <Countdown target={event.date} />
          </motion.div>
        </div>

        {/* Portrait — chiaroscuro */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <div className="relative aspect-[4/5] overflow-hidden shadow-frame">
            <img
              src={heroPortrait}
              alt="Portrait de soirée — invitée Victorious"
              fetchPriority="high"
              className="size-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 60%, oklch(0.14 0.012 60 / 0.5) 100%)",
              }}
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 border border-champagne/40 sm:block" />
          <div className="absolute -right-6 -top-6 hidden h-32 w-32 border border-gold/40 sm:block" />
        </motion.div>
      </div>

      {/* Mobile countdown */}
      <div className="relative mx-auto max-w-7xl px-6 pb-16 lg:hidden">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/50 mb-5 text-center">
          Le rideau se lève dans
        </div>
        <Countdown target={event.date} />
      </div>
    </section>
  );
}
