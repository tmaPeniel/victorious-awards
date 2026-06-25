import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/content/categories";

export function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.8,
        delay: (index % 3) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      <Link
        to="/categories/$slug"
        params={{ slug: category.slug }}
        className="block focus:outline-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-velvet shadow-frame">
          <img
            src={category.image}
            alt={category.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: "var(--gradient-veil)" }}
          />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
            <div className="mb-3 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-champagne/80">
              <span className="font-display text-sm text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-8 bg-champagne/50" />
              <span>{category.tagline}</span>
            </div>
            <h3 className="font-display text-2xl leading-tight text-ivory sm:text-3xl">
              {category.title}
            </h3>
            <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-champagne opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-1">
              <span>Découvrir</span>
              <ArrowUpRight className="size-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
