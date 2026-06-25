import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  numeral?: string;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
  contained?: boolean;
  align?: "left" | "center";
};

export function Section({
  id,
  numeral,
  eyebrow,
  title,
  intro,
  children,
  className,
  contained = true,
  align = "left",
}: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <section
      id={id}
      className={cn("relative py-24 sm:py-32 lg:py-40", className)}
    >
      <div className={cn(contained && "mx-auto max-w-7xl px-6 lg:px-10")}>
        {(numeral || eyebrow || title || intro) && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "mb-16 max-w-3xl",
              align === "center" && "mx-auto text-center",
            )}
          >
            {(numeral || eyebrow) && (
              <div
                className={cn(
                  "mb-6 flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.3em] text-champagne/70",
                  align === "center" && "justify-center",
                )}
              >
                {numeral && (
                  <span className="font-display text-base text-gold">
                    {numeral}
                  </span>
                )}
                <span className="h-px w-10 bg-champagne/40" />
                {eyebrow && <span>{eyebrow}</span>}
              </div>
            )}
            {title && (
              <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-balance text-ivory sm:text-5xl lg:text-6xl">
                {title}
              </h2>
            )}
            {intro && (
              <p className="mt-6 max-w-2xl text-pretty text-base text-ivory/70 sm:text-lg">
                {intro}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
