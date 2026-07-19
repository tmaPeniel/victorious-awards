import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Copy, Download, Trash2 } from "lucide-react";
import { z } from "zod";
import { VButton } from "@/components/victorious/VButton";
import {
  getManagedReservation,
  getTicketBundle,
  updateManagedReservation,
} from "@/lib/ticketing.functions";

const searchSchema = z.object({ token: z.string().optional().catch(undefined) });
const inputClass =
  "mt-2 h-12 w-full border border-champagne/25 bg-obsidian/40 px-4 text-base text-ivory outline-none focus:border-champagne";

export const Route = createFileRoute("/billetterie_/gerer")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Gérer ma réservation — Victorious" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ManageBookingPage,
});

type EditableAttendee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  checkedInAt: string | null;
};

function ManageBookingPage() {
  const { token } = Route.useSearch();
  const booking = useQuery({
    queryKey: ["ticketing", "manage", token],
    queryFn: () => getManagedReservation({ data: { token: token! } }),
    enabled: Boolean(token),
    retry: false,
  });
  const ticketBundle = useQuery({
    queryKey: ["ticketing", "bundle", token],
    queryFn: () => getTicketBundle({ data: { token: token! } }),
    enabled: Boolean(token && booking.data?.reservation.status === "confirmed"),
    retry: false,
  });
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [attendees, setAttendees] = useState<EditableAttendee[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!booking.data) return;
    const { reservation, attendees: people } = booking.data;
    setContact({
      firstName: reservation.contact_first_name,
      lastName: reservation.contact_last_name,
      email: reservation.contact_email,
      phone: reservation.contact_phone,
    });
    setAttendees(
      people.map((person) => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.email,
        status: person.status,
        checkedInAt: person.checked_in_at,
      })),
    );
  }, [booking.data]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (
      attendees.length === 0 &&
      !window.confirm("Annuler toute la réservation et libérer toutes les places ?")
    )
      return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await updateManagedReservation({
        data: {
          token,
          contactFirstName: contact.firstName,
          contactLastName: contact.lastName,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          attendees,
        },
      });
      setMessage(
        result.cancelled
          ? "Votre réservation est annulée. Les places ont été libérées."
          : "Vos modifications sont enregistrées. Téléchargez le PDF actualisé ci-dessous.",
      );
      await Promise.all([booking.refetch(), ticketBundle.refetch()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Les modifications n’ont pas pu être enregistrées.",
      );
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    if (!ticketBundle.data) return;
    setDownloading(true);
    setError(null);
    try {
      const { downloadTicketBundlePdf } = await import("@/lib/ticket-pdf");
      await downloadTicketBundlePdf(ticketBundle.data);
    } catch {
      setError("Le PDF n’a pas pu être généré. Réessayez dans un instant.");
    } finally {
      setDownloading(false);
    }
  };

  const copyManagementLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("La copie automatique est indisponible. Enregistrez cette page dans vos favoris.");
    }
  };

  if (!token)
    return (
      <ManageState
        title="Lien incomplet"
        text="Utilisez le lien sécurisé que vous avez enregistré après votre réservation."
      />
    );
  if (booking.isLoading)
    return (
      <ManageState
        title="Ouverture de votre réservation…"
        text="Nous vérifions votre lien sécurisé."
      />
    );
  if (booking.isError || !booking.data)
    return (
      <ManageState
        title="Lien non reconnu"
        text={
          booking.error instanceof Error
            ? booking.error.message
            : "Ce lien de gestion n’est plus valide."
        }
      />
    );

  const cancelled = booking.data.reservation.status === "cancelled";
  return (
    <section className="mx-auto max-w-5xl px-6 pt-36 pb-24 lg:px-10 lg:pt-44">
      <div className="border-b border-champagne/20 pb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-champagne/70">
          Réservation {booking.data.reservation.reference}
        </p>
        <h1 className="mt-5 font-display text-5xl text-ivory sm:text-6xl">Gérer mes places</h1>
        <p className="mt-4 text-ivory/65">
          Statut :{" "}
          <span className="text-champagne">
            {cancelled
              ? "annulée"
              : booking.data.reservation.status === "confirmed"
                ? "confirmée"
                : "liste d’attente"}
          </span>
        </p>
      </div>
      {!cancelled && (
        <section className="border-b border-champagne/20 py-8" aria-labelledby="ticket-download">
          <h2 id="ticket-download" className="font-display text-3xl text-ivory">
            {booking.data.reservation.status === "confirmed"
              ? "Vos billets sont disponibles"
              : "Votre groupe est toujours en attente"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/60">
            {booking.data.reservation.status === "confirmed"
              ? "Téléchargez un PDF groupé contenant un billet nominatif et un QR code par participant."
              : "Aucun billet n’est encore émis. Revenez sur ce lien pour vérifier si votre groupe a été confirmé."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {booking.data.reservation.status === "confirmed" && (
              <button
                type="button"
                onClick={download}
                disabled={downloading || ticketBundle.isLoading || !ticketBundle.data}
                className="inline-flex h-12 items-center gap-3 bg-champagne px-6 text-sm font-semibold text-obsidian hover:bg-gold disabled:opacity-45"
              >
                <Download className="size-5" />
                {downloading ? "Préparation…" : "Télécharger mes billets en PDF"}
              </button>
            )}
            <button
              type="button"
              onClick={copyManagementLink}
              className="inline-flex h-12 items-center gap-2 border border-champagne/35 px-5 text-sm text-champagne"
            >
              <Copy className="size-4" />
              {copied ? "Lien copié" : "Copier ce lien sécurisé"}
            </button>
          </div>
        </section>
      )}
      {cancelled ? (
        <ManageState
          title="Réservation annulée"
          text="Aucune place n’est encore active pour cette référence."
        />
      ) : (
        <form onSubmit={submit} className="mt-12 space-y-14">
          <fieldset>
            <legend className="font-display text-3xl text-ivory">Contact de la réservation</legend>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <ManageField
                label="Prénom"
                value={contact.firstName}
                onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
              />
              <ManageField
                label="Nom"
                value={contact.lastName}
                onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
              />
              <ManageField
                label="E-mail"
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
              <ManageField
                label="Téléphone"
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-display text-3xl text-ivory">Participants actifs</legend>
            <p className="mt-2 text-ivory/60">
              Vous pouvez corriger ou remplacer un invité, ou annuler une place. Il n’est pas
              possible d’ajouter une nouvelle place.
            </p>
            <div className="mt-7 divide-y divide-champagne/15 border-y border-champagne/15">
              {attendees.map((person, index) => (
                <div
                  key={person.id}
                  className="grid gap-5 py-7 sm:grid-cols-[2rem_1fr_1fr_auto] sm:items-end"
                >
                  <span className="pb-3 font-display text-xl text-champagne">{index + 1}</span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ManageField
                      label="Prénom"
                      value={person.firstName}
                      onChange={(e) =>
                        setAttendees((list) =>
                          list.map((item) =>
                            item.id === person.id ? { ...item, firstName: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    <ManageField
                      label="Nom"
                      value={person.lastName}
                      onChange={(e) =>
                        setAttendees((list) =>
                          list.map((item) =>
                            item.id === person.id ? { ...item, lastName: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <ManageField
                    label="E-mail"
                    type="email"
                    value={person.email}
                    onChange={(e) =>
                      setAttendees((list) =>
                        list.map((item) =>
                          item.id === person.id ? { ...item, email: e.target.value } : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAttendees((list) => list.filter((item) => item.id !== person.id))
                    }
                    className="grid size-12 place-items-center border border-brick/50 text-ivory hover:bg-brick/20"
                    aria-label={`Annuler la place de ${person.firstName} ${person.lastName}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {attendees.length === 0 && (
                <div className="py-8 text-center text-ivory/55">
                  Toutes les places seront annulées à l’enregistrement.
                </div>
              )}
            </div>
          </fieldset>
          {message && (
            <div
              role="status"
              className="flex gap-3 border border-champagne/30 bg-champagne/10 p-4 text-ivory"
            >
              <Check className="size-5 text-gold" />
              {message}
            </div>
          )}
          {error && (
            <div role="alert" className="border border-brick/60 bg-brick/10 p-4 text-ivory">
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            <VButton type="submit" size="lg" disabled={saving}>
              {saving
                ? "Enregistrement…"
                : attendees.length
                  ? "Enregistrer les modifications"
                  : "Annuler toute la réservation"}
            </VButton>
            <Link
              to="/"
              className="inline-flex h-14 items-center px-5 text-sm text-ivory/60 hover:text-ivory"
            >
              Retour à l’accueil
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}

function ManageField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-xs uppercase tracking-[0.18em] text-champagne/70">
      {label}
      <input required className={inputClass} {...props} />
    </label>
  );
}

function ManageState({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto max-w-2xl px-6 pt-44 pb-28 text-center">
      <h1 className="font-display text-5xl text-ivory">{title}</h1>
      <p className="mt-5 text-ivory/65">{text}</p>
      <Link
        to="/billetterie"
        className="mt-8 inline-flex h-12 items-center bg-champagne px-6 text-sm uppercase tracking-[0.15em] text-obsidian"
      >
        Retour à la billetterie
      </Link>
    </section>
  );
}
