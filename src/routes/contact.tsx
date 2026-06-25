import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube, Send } from "lucide-react";
import { Section } from "@/components/victorious/Section";
import { VButton } from "@/components/victorious/VButton";
import { event } from "@/content/event";
import contactHero from "@/assets/pages/contact-hero.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Victorious | ICC Rouen" },
      {
        name: "description",
        content:
          "Une question, une demande de presse, un partenariat ? Contactez l'équipe Victorious — ICC Rouen, Isneauville.",
      },
      { property: "og:title", content: "Contact — Victorious" },
      {
        property: "og:description",
        content: "Une question, un message — nous lisons tout.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-obsidian pt-40 pb-12">
        <div className="absolute inset-0 -z-10">
          <img
            src={contactHero}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-35"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.10 0.05 290 / 0.92) 0%, oklch(0.10 0.05 290 / 0.55) 100%)",
            }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
            <span className="h-px w-12 bg-champagne/50" />
            Contact
          </div>
          <h1 className="mt-8 max-w-3xl font-display text-5xl leading-[0.95] text-ivory sm:text-7xl lg:text-8xl">
            Écrivez-nous,
            <br />
            <span className="font-display-italic text-champagne">
              nous lisons tout.
            </span>
          </h1>
        </div>
      </section>

      <Section className="pt-8">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            {sent ? (
              <div className="border border-champagne/20 bg-velvet/40 p-10">
                <h2 className="font-display text-3xl text-ivory">Message reçu.</h2>
                <p className="mt-4 text-base text-ivory/70">
                  Nous revenons vers vous dans les meilleurs délais. Merci pour
                  votre patience.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField label="Prénom" name="firstName" required />
                  <FormField label="Nom" name="lastName" required />
                  <FormField label="Email" name="email" type="email" required />
                  <FormField label="Sujet" name="subject" required />
                </div>
                <FormField label="Message" name="message" textarea required />
                <div>
                  <VButton type="submit">
                    Envoyer <Send className="size-4" />
                  </VButton>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-10">
            <div>
              <h3 className="gold-rule font-display text-2xl text-ivory">
                Coordonnées
              </h3>
              <ul className="mt-6 space-y-5 text-base text-ivory/75">
                <li className="flex gap-4">
                  <MapPin className="mt-1 size-5 shrink-0 text-gold" />
                  <span>{event.address}</span>
                </li>
                <li className="flex gap-4">
                  <Mail className="mt-1 size-5 shrink-0 text-gold" />
                  <a href={`mailto:${event.contact.email}`} className="link-underline">
                    {event.contact.email}
                  </a>
                </li>
                <li className="flex gap-4">
                  <Phone className="mt-1 size-5 shrink-0 text-gold" />
                  <a href={`tel:${event.contact.phone.replace(/\s/g, "")}`} className="link-underline">
                    {event.contact.phone}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="gold-rule font-display text-2xl text-ivory">
                Réseaux
              </h3>
              <div className="mt-6 flex gap-3">
                <a href={event.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-12 place-items-center border border-champagne/30 text-champagne transition-colors hover:bg-champagne hover:text-obsidian">
                  <Instagram className="size-5" />
                </a>
                <a href={event.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-12 place-items-center border border-champagne/30 text-champagne transition-colors hover:bg-champagne hover:text-obsidian">
                  <Facebook className="size-5" />
                </a>
                <a href={event.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="grid size-12 place-items-center border border-champagne/30 text-champagne transition-colors hover:bg-champagne hover:text-obsidian">
                  <Youtube className="size-5" />
                </a>
              </div>
            </div>

            <div className="aspect-[4/3] overflow-hidden border border-champagne/20">
              <iframe
                title="Carte — ICC Rouen Isneauville"
                src="https://www.openstreetmap.org/export/embed.html?bbox=1.1%2C49.45%2C1.18%2C49.49&layer=mapnik&marker=49.47%2C1.135"
                className="size-full grayscale-[40%] contrast-110"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

function FormField({
  label,
  name,
  type = "text",
  textarea,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const id = `c-${name}`;
  const cls =
    "mt-2 w-full bg-transparent border-b border-champagne/30 px-0 py-3 text-base text-ivory outline-none focus:border-champagne transition-colors";
  return (
    <div>
      <label htmlFor={id} className="block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
        {label}{required && <span className="text-gold"> *</span>}
      </label>
      {textarea ? (
        <textarea id={id} name={name} rows={6} required={required} className={`${cls} resize-y`} />
      ) : (
        <input id={id} name={name} type={type} required={required} className={cls} />
      )}
    </div>
  );
}
