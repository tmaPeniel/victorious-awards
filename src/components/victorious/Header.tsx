import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VLink } from "./VButton";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/a-propos", label: "À propos" },
  { to: "/categories", label: "Catégories" },
  { to: "/galerie", label: "Galerie" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-obsidian/85 backdrop-blur-xl border-b border-champagne/10"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          to="/"
          aria-label="Victorious — Accueil"
          className="group flex items-center gap-3"
        >
          <span className="font-display text-xl tracking-[0.2em] text-champagne sm:text-2xl">
            VICTORIOUS
          </span>
          <span className="hidden text-[0.6rem] uppercase tracking-[0.3em] text-champagne/50 sm:inline">
            — La Nuit de l'Excellence
          </span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex" aria-label="Navigation principale">
          {links.map((l) => {
            const active =
              l.to === "/"
                ? pathname === "/"
                : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "link-underline text-[0.75rem] uppercase tracking-[0.25em] transition-colors",
                  active ? "text-champagne" : "text-ivory/70 hover:text-ivory",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <VLink to="/candidater" size="md">
            Je candidate
          </VLink>
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="grid size-11 place-items-center text-champagne lg:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-[max-height] duration-500 ease-out border-b border-champagne/10",
          open ? "max-h-[80vh]" : "max-h-0",
        )}
      >
        <div className="bg-obsidian/95 backdrop-blur-xl px-6 pb-8 pt-2">
          <nav className="flex flex-col" aria-label="Navigation mobile">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="border-b border-champagne/10 py-4 font-display text-2xl text-ivory"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <VLink to="/candidater" size="lg" className="w-full">
              Je candidate
            </VLink>
          </div>
        </div>
      </div>
    </header>
  );
}
