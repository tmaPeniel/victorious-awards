import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Clock,
  Download,
  KeyRound,
  MapPin,
  Minus,
  Plus,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { VButton } from "@/components/victorious/VButton";
import { event } from "@/content/event";
import {
  createTicketReservation,
  getTicketingAvailability,
  lookupReservation,
  type TicketBundle,
} from "@/lib/ticketing.functions";


export const Route = createFileRoute("/billetterie")({
  head: () => ({
    meta: [
      { title: "Billetterie gratuite — Victorious 2026" },
      {
        name: "description",
        content:
          "Réservez gratuitement jusqu’à quatre places pour Victorious, le 25 juillet 2026 à ICC Rouen.",
      },
    ],
  }),
  component: TicketingPage,
});

type Attendee = { firstName: string; lastName: string; email: string; whatsapp: string };
const emptyAttendee = (): Attendee => ({ firstName: "", lastName: "", email: "", whatsapp: "" });
const fieldClass =
  "mt-2 h-12 w-full border border-champagne/25 bg-obsidian/35 px-4 text-base text-ivory outline-none transition-colors placeholder:text-ivory/45 focus:border-champagne";


function TicketingPage() {
  const availability = useQuery({
    queryKey: ["ticketing", "availability"],
    queryFn: () => getTicketingAvailability(),
    retry: false,
  });
  const [attendees, setAttendees] = useState<Attendee[]>([emptyAttendee()]);
  const [rgpd, setRgpd] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [result, setResult] = useState<null | {
    reference: string;
    status: "confirmed" | "waitlisted";
    managementPath: string;
    ticketBundle: TicketBundle | null;
  }>(null);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);


  const updateAttendee =
    (index: number, key: keyof Attendee) => (e: ChangeEvent<HTMLInputElement>) => {
      setAttendees((current) =>
        current.map((person, personIndex) =>
          personIndex === index ? { ...person, [key]: e.target.value } : person,
        ),
      );
    };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const primaryAttendee = attendees[0];
      const response = await createTicketReservation({
        data: {
          contactFirstName: primaryAttendee.firstName,
          contactLastName: primaryAttendee.lastName,
          contactEmail: primaryAttendee.email,
          contactPhone: "",
          contactWhatsapp: primaryAttendee.whatsapp.trim(),
          attendees: attendees.map((a) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
            whatsapp: a.whatsapp.trim(),
          })),
          rgpd,
          idempotencyKey,
          website,
        },
      });

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "La réservation n’a pas pu être enregistrée. Réessayez dans un instant.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const availabilityData = availability.data;
  const isOpen = availabilityData?.state === "open";
  const isWaitingOnly = isOpen && (availabilityData?.remaining ?? 0) === 0;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-champagne/15 pt-36 pb-16 sm:pt-44 sm:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,oklch(0.35_0.12_298_/_0.42),transparent_48%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
          <div>
            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-champagne/75">
              <span className="h-px w-12 bg-champagne/60" />
              Billetterie gratuite
            </div>
            <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[0.98] text-ivory text-balance sm:text-7xl lg:text-8xl">
              Votre place pour{" "}
              <span className="font-display-italic text-champagne">une nuit d’excellence.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ivory/75">
              Réservez de une à quatre places nominatives, puis téléchargez immédiatement tous vos
              billets et leurs QR codes dans un seul PDF.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setLookupOpen(true)}
                className="inline-flex h-11 items-center gap-2 border border-champagne/40 px-5 text-xs uppercase tracking-[0.18em] text-champagne transition-colors hover:border-champagne hover:text-gold"
              >
                <KeyRound className="size-4" />
                Gérer ma réservation
              </button>
            </div>

          </div>
          <aside className="self-end border-y border-champagne/25 py-7">
            {[
              { icon: CalendarDays, text: event.dateLabel },
              { icon: Clock, text: event.timeLabel },
              { icon: MapPin, text: `${event.venue} — ${event.city}` },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-4 border-b border-champagne/10 py-4 last:border-0"
              >
                <Icon className="size-5 text-gold" />
                <span className="text-ivory/85">{text}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        {availability.isLoading ? (
          <StateMessage
            title="Vérification des places…"
            text="Nous consultons la jauge de l’événement."
          />
        ) : availability.isError ? (
          <StateMessage
            title="Billetterie momentanément indisponible"
            text="Nous ne pouvons pas vérifier la jauge. Réessayez dans un instant ou contactez l’équipe Victorious."
          />
        ) : !isOpen ? (
          <StateMessage
            title={
              availabilityData?.state === "unconfigured"
                ? "Ouverture prochaine"
                : "Les réservations sont fermées"
            }
            text="La billetterie n’est pas accessible pour le moment. Revenez prochainement ou contactez l’équipe Victorious."
          />
        ) : result ? (
          <SuccessState result={result} />
        ) : (
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <form onSubmit={submit} className="space-y-14" noValidate>
              <fieldset>
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <legend className="font-display text-3xl text-ivory">Les participants</legend>
                    <p className="mt-2 text-ivory/60">
                      Une adresse e-mail différente est nécessaire pour chaque billet.
                    </p>
                  </div>
                  <div
                    className="flex items-center border border-champagne/25"
                    aria-label="Nombre de participants"
                  >
                    <button
                      type="button"
                      aria-label="Retirer un participant"
                      disabled={attendees.length === 1}
                      onClick={() => setAttendees((current) => current.slice(0, -1))}
                      className="grid size-11 place-items-center text-champagne disabled:opacity-30"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-12 text-center font-display text-xl tabular-nums">
                      {attendees.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Ajouter un participant"
                      disabled={attendees.length === 4}
                      onClick={() => setAttendees((current) => [...current, emptyAttendee()])}
                      className="grid size-11 place-items-center text-champagne disabled:opacity-30"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-7 divide-y divide-champagne/15 border-y border-champagne/15">
                  {attendees.map((person, index) => (
                    <div key={index} className="grid gap-5 py-7">
                      <div className="flex items-center gap-4">
                        <div className="grid size-10 place-items-center rounded-full bg-champagne text-sm font-semibold text-obsidian">
                          {index + 1}
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-champagne/75">
                          {index === 0 ? "Contact principal" : `Participant ${index + 1}`}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Prénom"
                          value={person.firstName}
                          onChange={updateAttendee(index, "firstName")}
                          required
                        />
                        <Field
                          label="Nom"
                          value={person.lastName}
                          onChange={updateAttendee(index, "lastName")}
                          required
                        />
                        <Field
                          label="E-mail du participant"
                          type="email"
                          value={person.email}
                          onChange={updateAttendee(index, "email")}
                          required
                        />

                        <Field
                          label={
                            index === 0
                              ? "WhatsApp (obligatoire, format +33…)"
                              : "WhatsApp (optionnel, format +33…)"
                          }
                          type="tel"
                          placeholder="+33612345678"
                          value={person.whatsapp}
                          onChange={updateAttendee(index, "whatsapp")}
                          required={index === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </fieldset>

              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label>
                  Site web
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>
              <label className="flex cursor-pointer items-start gap-4 text-sm leading-relaxed text-ivory/70">
                <input
                  type="checkbox"
                  checked={rgpd}
                  onChange={(e) => setRgpd(e.target.checked)}
                  className="mt-1 size-5 accent-[var(--gold)]"
                  required
                />
                <span>
                  J’accepte que mes données soient utilisées pour gérer cette réservation et le
                  contrôle d’accès à Victorious.{" "}
                  <Link to="/mentions-legales" className="text-champagne underline">
                    En savoir plus
                  </Link>
                  .
                </span>
              </label>
              {error && (
                <div
                  role="alert"
                  className="border border-brick/70 bg-brick/10 p-4 text-sm text-ivory"
                >
                  {error}
                </div>
              )}
              <VButton
                type="submit"
                size="lg"
                disabled={submitting || !rgpd}
                className="w-full sm:w-auto"
              >
                {submitting
                  ? "Réservation en cours…"
                  : isWaitingOnly
                    ? "Rejoindre la liste d’attente"
                    : "Réserver mes places"}
                <ArrowRight className="size-4" />
              </VButton>
            </form>

            <aside className="h-fit border border-champagne/20 bg-velvet/35 p-7 lg:sticky lg:top-28">
              <Ticket className="size-7 text-gold" />
              <h2 className="mt-6 font-display text-2xl text-ivory">
                {isWaitingOnly
                  ? "Liste d’attente ouverte"
                  : `${availabilityData?.remaining ?? 0} place${availabilityData?.remaining === 1 ? "" : "s"} disponible${availabilityData?.remaining === 1 ? "" : "s"}`}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ivory/65">
                {isWaitingOnly
                  ? "Votre groupe sera confirmé automatiquement dès qu’il tiendra dans les places libérées."
                  : "Votre groupe est confirmé immédiatement s’il tient entièrement dans la jauge restante."}
              </p>
              <ul className="mt-7 space-y-4 border-t border-champagne/15 pt-6 text-sm text-ivory/75">
                <li className="flex gap-3">
                  <Check className="size-4 shrink-0 text-gold" />
                  Gratuit, sans création de compte
                </li>
                <li className="flex gap-3">
                  <Users className="size-4 shrink-0 text-gold" />
                  Jusqu’à quatre participants
                </li>
                <li className="flex gap-3">
                  <Ticket className="size-4 shrink-0 text-gold" />
                  QR code nominatif par participant
                </li>
              </ul>
            </aside>
          </div>
        )}
      </section>
      {lookupOpen && <ManageLookupModal onClose={() => setLookupOpen(false)} />}
    </>

  );
}

function Field({
  label,
  second,
  ...props
}: {
  label: string;
  second?: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void };
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  if (second)
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" {...props} />
        <Field label={second.label} value={second.value} onChange={second.onChange} />
      </div>
    );
  return (
    <label htmlFor={id} className="block text-xs uppercase tracking-[0.18em] text-champagne/75">
      {label}
      {props.required && <span className="text-gold"> *</span>}
      <input id={id} className={fieldClass} {...props} />
    </label>
  );

}

function StateMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl border-y border-champagne/20 py-16 text-center">
      <h2 className="font-display text-4xl text-ivory">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-ivory/65">{text}</p>
    </div>
  );
}

function SuccessState({
  result,
}: {
  result: {
    reference: string;
    status: "confirmed" | "waitlisted";
    managementPath: string;
    ticketBundle: TicketBundle | null;
  };
}) {
  const confirmed = result.status === "confirmed";
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const download = async () => {
    if (!result.ticketBundle) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const { downloadTicketBundlePdf } = await import("@/lib/ticket-pdf");
      await downloadTicketBundlePdf(result.ticketBundle);
    } catch {
      setDownloadError("Le PDF n’a pas pu être généré. Réessayez dans un instant.");
    } finally {
      setDownloading(false);
    }
  };

  const copyManagementLink = async () => {
    try {
      const url = new URL(result.managementPath, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setDownloadError(
        "La copie automatique est indisponible. Enregistrez l’adresse de cette page.",
      );
    }
  };

  return (
    <div
      className="mx-auto max-w-3xl border border-champagne/25 bg-velvet/30 p-8 text-center sm:p-14"
      aria-live="polite"
    >
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-champagne text-obsidian">
        <Check className="size-6" />
      </div>
      <h2 className="mt-7 font-display text-4xl text-ivory sm:text-5xl">
        {confirmed ? "Vos places sont confirmées." : "Votre groupe est sur liste d’attente."}
      </h2>
      <p className="mt-5 text-lg text-ivory/70">
        Référence <strong className="text-champagne">{result.reference}</strong>.{" "}
        {confirmed
          ? "Vos billets sont prêts à être téléchargés."
          : "Conservez votre lien de gestion et consultez-le ultérieurement pour suivre votre statut."}
      </p>
      {confirmed && result.ticketBundle && (
        <div className="mt-9 space-y-4">
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="mx-auto inline-flex h-14 items-center justify-center gap-3 bg-champagne px-7 text-sm font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold disabled:opacity-50"
          >
            <Download className="size-5" />
            {downloading ? "Préparation du PDF…" : "Télécharger mes billets en PDF"}
          </button>
          <WhatsappSend bundle={result.ticketBundle} />
        </div>
      )}
      {downloadError && (
        <p role="alert" className="mt-4 text-sm text-brick">
          {downloadError}
        </p>
      )}

      <div className="mx-auto mt-8 max-w-xl border-y border-champagne/15 py-5">
        <p className="text-sm leading-relaxed text-ivory/60">
          Ce lien sécurisé est le seul moyen de retrouver, modifier ou annuler vos billets.
          Enregistrez-le maintenant.
        </p>
        <button
          type="button"
          onClick={copyManagementLink}
          className="mt-4 inline-flex h-11 items-center gap-2 px-4 text-sm text-champagne hover:text-gold"
        >
          <Copy className="size-4" />
          {copied ? "Lien copié" : "Copier mon lien de gestion"}
        </button>
      </div>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <a
          href={result.managementPath}
          className="inline-flex h-12 items-center border border-champagne/50 px-6 text-sm uppercase tracking-[0.15em] text-champagne"
        >
          Gérer ma réservation
        </a>
        <Link
          to="/"
          className="inline-flex h-12 items-center px-6 text-sm text-ivory/65 hover:text-ivory"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

function WhatsappSend({ bundle }: { bundle: TicketBundle }) {
  const dateLabel = new Date(bundle.event.startsAt).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = new Date(bundle.event.startsAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="mt-6 border border-champagne/20 bg-obsidian/40 p-5 text-left">
      <h3 className="font-display text-xl text-champagne">Envoyer les billets par WhatsApp</h3>
      <p className="mt-2 text-sm text-ivory/65">
        Ouvrez chaque conversation WhatsApp pré-remplie avec le lien du billet et le QR code.
      </p>
      <ul className="mt-4 space-y-3">
        {bundle.tickets.map((ticket) => {
          const ticketUrl = `${window.location.origin}/billet?token=${encodeURIComponent(ticket.token)}`;
          const message =
            `Bonjour ${ticket.firstName} 🎉\n\n` +
            `Voici votre billet pour ${bundle.event.name}\n` +
            `📅 ${dateLabel} · ${timeLabel}\n` +
            `📍 ${bundle.event.venue} — ${bundle.event.city}\n\n` +
            `Ouvrez ce lien et présentez le QR code à l'entrée :\n${ticketUrl}\n\n` +
            `Référence : ${bundle.reference}`;
          const number = ticket.whatsapp ?? bundle.contactWhatsapp;
          const digits = number?.replace(/[\s\-().]/g, "").replace(/^\+/, "");
          const waUrl = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
          return (
            <li
              key={ticket.token}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-champagne/10 pb-3 last:border-0"
            >
              <div>
                <p className="text-sm text-ivory">
                  {ticket.firstName} {ticket.lastName}
                </p>
                <p className="text-xs text-ivory/50">{number ?? "Numéro manquant"}</p>
              </div>
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 border border-champagne/40 px-3 text-xs text-champagne"
                >
                  Ouvrir WhatsApp
                </a>
              ) : (
                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-ivory/60 underline"
                >
                  Voir le billet
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
