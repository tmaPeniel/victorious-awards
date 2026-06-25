import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans text-sm uppercase tracking-[0.18em] transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group/btn";

const sizes: Record<Size, string> = {
  md: "h-11 px-6",
  lg: "h-14 px-9 text-[0.8rem]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-champagne text-obsidian hover:shadow-[0_0_40px_-5px_var(--gold)] hover:bg-ivory",
  secondary:
    "border border-champagne/60 text-champagne hover:border-champagne hover:bg-champagne/10",
  ghost: "text-champagne hover:text-ivory",
};

type Common = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export function VButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

type VLinkProps = Common & {
  to: string;
  params?: Record<string, string>;
  external?: boolean;
};

export function VLink({
  variant = "primary",
  size = "md",
  className,
  children,
  to,
  params,
  external,
}: VLinkProps) {
  const cls = cn(base, sizes[size], variants[variant], className);
  const content = (
    <span className="relative z-10 flex items-center gap-2">{children}</span>
  );
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to} params={params as never} className={cls}>
      {content}
    </Link>
  );
}
