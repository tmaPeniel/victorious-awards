import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { event } from "@/content/event";

export function Footer() {
  return (
    <footer className="relative border-t border-champagne/15 bg-velvet/30 pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display text-2xl tracking-[0.2em] text-champagne">
              VICTORIOUS
            </div>
            <p className="mt-2 text-sm uppercase tracking-[0.25em] text-champagne/60">
              La Nuit de l'Excellence
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/65">
              Une cérémonie organisée par ICC Rouen pour célébrer les parcours
              de vie marqués par la fidélité de Dieu.
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-[0.7rem] uppercase tracking-[0.3em] text-champagne/80">
              Explorer
            </h3>
            <ul className="space-y-3 text-sm text-ivory/70">
              <li><Link to="/a-propos" className="link-underline">À propos</Link></li>
              <li><Link to="/categories" className="link-underline">Catégories</Link></li>
              <li><Link to="/candidater" className="link-underline">Candidater</Link></li>
              <li><Link to="/galerie" className="link-underline">Galerie</Link></li>
              <li><Link to="/contact" className="link-underline">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-[0.7rem] uppercase tracking-[0.3em] text-champagne/80">
              Événement
            </h3>
            <ul className="space-y-3 text-sm text-ivory/70">
              <li>{event.dateLabel}</li>
              <li>{event.timeLabel}</li>
              <li>{event.venue}</li>
              <li>{event.city}</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-[0.7rem] uppercase tracking-[0.3em] text-champagne/80">
              Suivre
            </h3>
            <div className="flex gap-3">
              <a href={event.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-11 place-items-center border border-champagne/30 text-champagne transition-colors hover:bg-champagne hover:text-obsidian">
                <Instagram className="size-4" />
              </a>
              <a href={event.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-11 place-items-center border border-champagne/30 text-champagne transition-colors hover:bg-champagne hover:text-obsidian">
                <Facebook className="size-4" />
              </a>
              <a href={event.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="grid size-11 place-items-center border border-champagne/30 text-champagne transition-colors hover:bg-champagne hover:text-obsidian">
                <Youtube className="size-4" />
              </a>
            </div>
            <p className="mt-6 text-sm text-ivory/60">
              <a href={`mailto:${event.contact.email}`} className="link-underline">
                {event.contact.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-champagne/10 pt-8 text-xs uppercase tracking-[0.25em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ICC Rouen — Victorious</p>
          <Link to="/mentions-legales" className="link-underline">
            Mentions légales
          </Link>
        </div>
      </div>
    </footer>
  );
}
