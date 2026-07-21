import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import { VButton } from "@/components/victorious/VButton";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCancelReservation,
  adminResendReservationTickets,
  adminUpdateReservation,
} from "@/lib/ticketing.functions";

export const Route = createFileRoute("/admin/billetterie/$id")({
  component: TicketReservationDetail,
});

type EditablePerson = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  checked_in_at: string | null;
};
const inputClass =
  "mt-2 h-11 w-full border border-champagne/20 bg-obsidian/50 px-3 text-sm text-ivory outline-none focus:border-champagne";

function TicketReservationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "ticketing", id],
    queryFn: async () => {
      const { data: reservation, error } = await supabase
        .from("ticket_reservations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      const { data: attendees } = await supabase
        .from("ticket_attendees")
        .select("*")
        .eq("reservation_id", id)
        .neq("status", "cancelled")
        .order("position");
      return { reservation, attendees: attendees ?? [] };
    },
  });
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [attendees, setAttendees] = useState<EditablePerson[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    const reservation = query.data.reservation;
    setContact({
      firstName: reservation.contact_first_name,
      lastName: reservation.contact_last_name,
      email: reservation.contact_email,
      phone: reservation.contact_phone,
    });
    setAttendees(
      query.data.attendees.map((person) => ({
        id: person.id,
        first_name: person.first_name,
        last_name: person.last_name,
        email: person.email,
        status: person.status,
        checked_in_at: person.checked_in_at,
      })),
    );
  }, [query.data]);

  const accessToken = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Votre session a expiré.");
    return data.session.access_token;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await adminUpdateReservation({
        data: {
          reservationId: id,
          accessToken: await accessToken(),
          contactFirstName: contact.firstName,
          contactLastName: contact.lastName,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          attendees: attendees.map((person) => ({
            id: person.id,
            firstName: person.first_name,
            lastName: person.last_name,
            email: person.email,
          })),
        },
      });
      setMessage("Modifications enregistrées. Les anciens QR concernés ont été révoqués.");
      await query.refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Échec de l’enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Annuler cette réservation et libérer toutes ses places ?")) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminCancelReservation({
        data: { reservationId: id, accessToken: await accessToken() },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "ticketing"] });
      void navigate({ to: "/admin/billetterie" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Échec de l’annulation.");
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await adminResendReservationTickets({
        data: { reservationId: id, accessToken: await accessToken() },
      });
      setMessage(
        result.failed
          ? `Envoi partiel : ${result.sent} e-mail(s) envoyé(s), ${result.failed} échec(s). ${result.errors[0] ?? ""}`
          : `${result.sent} e-mail(s) envoyé(s) avec succès.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Échec de l’envoi des billets.");
    } finally {
      setBusy(false);
    }
  };

  if (query.isLoading)
    return <div className="text-sm text-ivory/50">Chargement de la réservation…</div>;
  if (!query.data) return <div role="alert">Réservation introuvable.</div>;
  const reservation = query.data.reservation;

  return (
    <div className="space-y-9">
      <Link
        to="/admin/billetterie"
        className="inline-flex items-center gap-2 text-sm text-ivory/55 hover:text-champagne"
      >
        <ArrowLeft className="size-4" />
        Retour à la billetterie
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-champagne/15 pb-7">
        <div>
          <p className="font-mono text-sm text-champagne">{reservation.reference}</p>
          <h1 className="mt-2 font-display text-4xl">
            {reservation.contact_first_name} {reservation.contact_last_name}
          </h1>
          <p className="mt-2 text-sm text-ivory/50">
            Créée le {new Date(reservation.created_at).toLocaleString("fr-FR")} ·{" "}
            {reservation.status === "confirmed"
              ? "Confirmée"
              : reservation.status === "waitlisted"
                ? "Liste d’attente"
                : "Annulée"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={cancel}
            disabled={busy || reservation.status === "cancelled"}
            className="inline-flex h-11 items-center gap-2 border border-brick/50 px-4 text-sm text-ivory disabled:opacity-40"
          >
            <Trash2 className="size-4" />
            Annuler
          </button>
        </div>
      </header>
      <form onSubmit={save} className="space-y-10">
        <fieldset>
          <legend className="font-display text-2xl">Contact</legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Prénom"
              value={contact.firstName}
              onChange={(value) => setContact({ ...contact, firstName: value })}
            />
            <Field
              label="Nom"
              value={contact.lastName}
              onChange={(value) => setContact({ ...contact, lastName: value })}
            />
            <Field
              label="E-mail"
              type="email"
              value={contact.email}
              onChange={(value) => setContact({ ...contact, email: value })}
            />
            <Field
              label="Téléphone"
              value={contact.phone}
              onChange={(value) => setContact({ ...contact, phone: value })}
            />
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-display text-2xl">Participants</legend>
          <div className="mt-5 divide-y divide-champagne/10 border-y border-champagne/15">
            {attendees.map((person, index) => (
              <div key={person.id} className="grid gap-4 py-5 sm:grid-cols-[2rem_1fr_1fr_1.2fr]">
                <span className="pt-4 font-display text-xl text-champagne">{index + 1}</span>
                <Field
                  label="Prénom"
                  value={person.first_name}
                  onChange={(value) =>
                    setAttendees((list) =>
                      list.map((item) =>
                        item.id === person.id ? { ...item, first_name: value } : item,
                      ),
                    )
                  }
                />
                <Field
                  label="Nom"
                  value={person.last_name}
                  onChange={(value) =>
                    setAttendees((list) =>
                      list.map((item) =>
                        item.id === person.id ? { ...item, last_name: value } : item,
                      ),
                    )
                  }
                />
                <Field
                  label={`E-mail · ${person.status === "checked_in" ? "présent" : person.status}`}
                  type="email"
                  value={person.email}
                  onChange={(value) =>
                    setAttendees((list) =>
                      list.map((item) =>
                        item.id === person.id ? { ...item, email: value } : item,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </fieldset>
        {message && (
          <p role="status" className="border border-champagne/25 bg-champagne/10 p-4 text-sm">
            {message}
          </p>
        )}
        <VButton type="submit" disabled={busy || reservation.status === "cancelled"}>
          {busy ? "Enregistrement…" : "Enregistrer les modifications"}
        </VButton>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-[0.15em] text-champagne/60">
      {label}
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}
