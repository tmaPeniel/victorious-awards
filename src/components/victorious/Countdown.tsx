import { useEffect, useState } from "react";

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function Countdown({
  target,
  compact = false,
}: {
  target: Date;
  compact?: boolean;
}) {
  const { days, hours, minutes, seconds } = useCountdown(target);
  const items = [
    { value: pad(days), label: "Jours" },
    { value: pad(hours), label: "Heures" },
    { value: pad(minutes), label: "Min." },
    { value: pad(seconds), label: "Sec." },
  ];
  return (
    <div
      className={
        compact
          ? "flex items-baseline gap-4"
          : "flex items-baseline justify-center gap-6 sm:gap-10"
      }
    >
      {items.map((it, idx) => (
        <div key={it.label} className="flex items-baseline gap-4 sm:gap-6">
          <div className="text-center">
            <div
              className={
                compact
                  ? "font-display text-2xl tabular-nums text-champagne"
                  : "font-display text-5xl tabular-nums leading-none text-champagne sm:text-6xl lg:text-7xl"
              }
            >
              {it.value}
            </div>
            <div className="mt-2 text-[0.6rem] uppercase tracking-[0.3em] text-ivory/50 sm:text-xs">
              {it.label}
            </div>
          </div>
          {idx < items.length - 1 && (
            <span className="font-display text-3xl text-champagne/30 sm:text-5xl">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
