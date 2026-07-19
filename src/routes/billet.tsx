import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Ticket as TicketIcon,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { TicketQrCode } from "@/components/victorious/TicketQrCode";
import { getTicket } from "@/lib/ticketing.functions";

export const Route = createFileRoute("/billet")({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [{ title: "Mon billet — Victorious" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { token } = Route.useSearch();
  const ticket = useQuery({
    queryKey: ["ticketing", "ticket", token],
    queryFn: () => getTicket({ data: { token: token! } }),
    enabled: Boolean(token),
    retry: false,
  });
  if (!token || ticket.isError)
    return (
      <TicketState
        title="Billet non reconnu"
        text="Ouvrez ce billet depuis votre PDF ou contactez l’équipe Victorious."
      />
    );
  if (ticket.isLoading || !ticket.data)
    return <TicketState title="Ouverture du billet…" text="Nous vérifions son authenticité." />;

  const data = ticket.data as unknown as {
    first_name: string;
    last_name: string;
    status: string;
    checked_in_at: string | null;
    ticket_reservations: { reference: string; status: string };
    ticket_events: { name: string; starts_at: string; venue: string; city: string };
  };
  const active = data.status !== "cancelled" && data.ticket_reservations.status === "confirmed";
  return (
    <section className="min-h-screen px-5 pt-32 pb-20 sm:pt-40 print:bg-white print:p-0">
      <article className="mx-auto max-w-xl overflow-hidden border border-champagne/25 bg-velvet/35 print:border-black print:bg-white print:text-black">
        <header className="border-b border-champagne/20 bg-champagne px-7 py-6 text-obsidian">
          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em]">Victorious 2026</p>
              <h1 className="mt-2 font-display text-3xl">Billet nominatif</h1>
            </div>
            <TicketIcon className="size-8" />
          </div>
        </header>
        <div className="p-7 sm:p-10">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-champagne/65 print:text-black">
                Participant
              </p>
              <h2 className="mt-2 font-display text-3xl text-ivory print:text-black">
                {data.first_name} {data.last_name}
              </h2>
              <p className="mt-2 font-mono text-sm text-champagne print:text-black">
                {data.ticket_reservations.reference}
              </p>
            </div>
            {active ? (
              <CheckCircle2 className="size-7 text-gold print:text-black" />
            ) : (
              <XCircle className="size-7 text-brick" />
            )}
          </div>
          {active ? (
            <div className="mx-auto mt-9 w-full max-w-[20rem] bg-ivory p-4">
              <TicketQrCode
                value={`victorious-ticket:${token}`}
                label={`QR code du billet de ${data.first_name} ${data.last_name}`}
              />
            </div>
          ) : (
            <div className="mt-9 border border-brick/50 bg-brick/10 p-5 text-center text-ivory print:text-black">
              Ce billet n’est plus actif.
            </div>
          )}
          {data.checked_in_at && (
            <p className="mt-5 text-center text-sm text-champagne/70 print:text-black">
              Entrée enregistrée le {new Date(data.checked_in_at).toLocaleString("fr-FR")}
            </p>
          )}
          <dl className="mt-9 space-y-4 border-t border-champagne/15 pt-7 text-sm print:border-black">
            <div className="flex items-center gap-4">
              <CalendarDays className="size-5 text-gold print:text-black" />
              <div>
                <dt className="text-ivory/50 print:text-black">Date</dt>
                <dd className="text-ivory print:text-black">25 juillet 2026</dd>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="size-5 text-gold print:text-black" />
              <div>
                <dt className="text-ivory/50 print:text-black">Heure</dt>
                <dd className="text-ivory print:text-black">19h00</dd>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="size-5 text-gold print:text-black" />
              <div>
                <dt className="text-ivory/50 print:text-black">Lieu</dt>
                <dd className="text-ivory print:text-black">
                  {data.ticket_events.venue} — {data.ticket_events.city}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </article>
      <div className="mx-auto mt-7 flex max-w-xl justify-center gap-5 print:hidden">
        <button
          onClick={() => window.print()}
          className="h-11 border border-champagne/40 px-5 text-sm text-champagne"
        >
          Imprimer le billet
        </button>
        <Link to="/" className="inline-flex h-11 items-center px-5 text-sm text-ivory/60">
          Accueil
        </Link>
      </div>
    </section>
  );
}

function TicketState({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto max-w-2xl px-6 pt-44 pb-28 text-center">
      <h1 className="font-display text-5xl text-ivory">{title}</h1>
      <p className="mt-5 text-ivory/65">{text}</p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center bg-champagne px-6 text-sm uppercase tracking-[0.15em] text-obsidian"
      >
        Retour à l’accueil
      </Link>
    </section>
  );
}
