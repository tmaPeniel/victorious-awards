import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Download, Filter, QrCode, Search, Settings2, Ticket, Trash2, Users } from "lucide-react";
import { VButton } from "@/components/victorious/VButton";
import { supabase } from "@/integrations/supabase/client";
import { exportTicketReservationsToExcel } from "@/lib/excel-export";
import { adminDeleteReservation, updateTicketEventSettings } from "@/lib/ticketing.functions";


export const Route = createFileRoute("/admin/billetterie/")({ component: TicketingAdminPage });

function TicketingAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleDelete = async (id: string, reference: string) => {
    if (!confirm(`Supprimer définitivement la réservation ${reference} ? Cette action est irréversible.`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Votre session a expiré.");
      return;
    }
    setDeletingId(id);
    setMessage(null);
    try {
      const result = await adminDeleteReservation({
        data: { accessToken: sessionData.session.access_token, reservationId: id },
      });
      setMessage(
        result.promoted
          ? `Réservation supprimée. ${result.promoted} réservation(s) promue(s) depuis la liste d’attente.`
          : "Réservation supprimée.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "ticketing"] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    } finally {
      setDeletingId(null);
    }
  };


  const query = useQuery({
    queryKey: ["admin", "ticketing"],
    queryFn: async () => {
      const { data: event, error: eventError } = await supabase
        .from("ticket_events")
        .select("*")
        .eq("slug", "victorious-2026")
        .single();
      if (eventError) throw eventError;
      const { data: reservations, error } = await supabase
        .from("ticket_reservations")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (reservations ?? []).map((item) => item.id);
      const { data: attendees } = ids.length
        ? await supabase
            .from("ticket_attendees")
            .select("*")
            .in("reservation_id", ids)
            .order("position")
        : { data: [] };
      return {
        event,
        reservations: (reservations ?? []).map((reservation) => ({
          ...reservation,
          attendees: (attendees ?? []).filter((person) => person.reservation_id === reservation.id),
        })),
      };
    },
  });

  const filtered = useMemo(
    () =>
      (query.data?.reservations ?? []).filter((reservation) => {
        const needle = search.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          [
            reservation.reference,
            reservation.contact_first_name,
            reservation.contact_last_name,
            reservation.contact_email,
            ...reservation.attendees.flatMap((person) => [
              person.first_name,
              person.last_name,
              person.email,
            ]),
          ].some((value) => value.toLowerCase().includes(needle));
        return matchesSearch && (status === "all" || reservation.status === status);
      }),
    [query.data, search, status],
  );

  const totals = useMemo(() => {
    const reservations = query.data?.reservations ?? [];
    const confirmed = reservations
      .filter((item) => item.status === "confirmed")
      .flatMap((item) => item.attendees)
      .filter((person) => person.status !== "cancelled").length;
    const waiting = reservations
      .filter((item) => item.status === "waitlisted")
      .flatMap((item) => item.attendees)
      .filter((person) => person.status !== "cancelled").length;
    const checkedIn = reservations
      .flatMap((item) => item.attendees)
      .filter((person) => person.status === "checked_in").length;
    return {
      confirmed,
      waiting,
      checkedIn,
      remaining: Math.max(0, (query.data?.event.capacity ?? 0) - confirmed),
    };
  }, [query.data]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.data?.event) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage(null);
    const capacity = Number(form.get("capacity"));
    const opens = String(form.get("opens") ?? "");
    const closes = String(form.get("closes") ?? "");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSaving(false);
      setMessage("Votre session a expiré.");
      return;
    }
    try {
      const result = await updateTicketEventSettings({
        data: {
          accessToken: sessionData.session.access_token,
          eventId: query.data.event.id,
          capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
          bookingEnabled: form.get("enabled") === "on",
          bookingOpensAt: opens ? new Date(opens).toISOString() : null,
          bookingClosesAt: closes ? new Date(closes).toISOString() : null,
        },
      });
      setMessage(
        result.promoted
          ? `Configuration enregistrée. ${result.promoted} réservation(s) promue(s).`
          : "Configuration enregistrée.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "ticketing"] });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "La configuration n’a pas pu être enregistrée.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading)
    return <div className="text-sm text-ivory/55">Chargement de la billetterie…</div>;
  if (query.isError || !query.data)
    return (
      <div role="alert" className="border border-brick/50 bg-brick/10 p-5">
        La migration de billetterie doit être appliquée à Supabase avant d’utiliser cet espace.
      </div>
    );

  return (
    <div className="space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-champagne/65">Victorious 2026</p>
          <h1 className="mt-2 font-display text-4xl text-ivory">Billetterie</h1>
          <p className="mt-2 text-sm text-ivory/55">
            Réservations, liste d’attente et contrôle d’entrée.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/billetterie/controle"
            className="inline-flex h-11 items-center gap-2 bg-champagne px-5 text-sm text-obsidian"
          >
            <QrCode className="size-4" />
            Contrôler les billets
          </Link>
          <button
            onClick={() => setShowSettings((value) => !value)}
            className="inline-flex h-11 items-center gap-2 border border-champagne/30 px-5 text-sm text-champagne"
          >
            <Settings2 className="size-4" />
            Configurer
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Confirmées", value: totals.confirmed, icon: Ticket },
          { label: "En attente", value: totals.waiting, icon: Users },
          { label: "Places restantes", value: totals.remaining, icon: Ticket },
          { label: "Présents", value: totals.checkedIn, icon: QrCode },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-champagne/15 bg-ivory/[0.02] p-5">
            <Icon className="size-5 text-gold" />
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-ivory/50">{label}</div>
            <div className="mt-1 font-display text-4xl tabular-nums text-ivory">{value}</div>
          </div>
        ))}
      </div>

      {showSettings && (
        <form onSubmit={saveSettings} className="border border-champagne/20 bg-velvet/25 p-6">
          <h2 className="font-display text-2xl">Configuration des inscriptions</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <AdminField
              label="Jauge totale"
              name="capacity"
              type="number"
              min="1"
              defaultValue={query.data.event.capacity ?? ""}
            />
            <AdminField
              label="Ouverture"
              name="opens"
              type="datetime-local"
              defaultValue={toLocalInput(query.data.event.booking_opens_at)}
            />
            <AdminField
              label="Clôture"
              name="closes"
              type="datetime-local"
              defaultValue={toLocalInput(query.data.event.booking_closes_at)}
            />
            <label className="flex h-12 items-center gap-3 self-end border border-champagne/20 px-4 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={query.data.event.booking_enabled}
                className="size-5 accent-[var(--gold)]"
              />
              Inscriptions ouvertes
            </label>
          </div>
          {message && (
            <p className="mt-4 text-sm text-champagne" role="status">
              {message}
            </p>
          )}
          <VButton type="submit" className="mt-6" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer la configuration"}
          </VButton>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-64 flex-1">
          <Search className="absolute left-4 top-3.5 size-4 text-ivory/40" />
          <span className="sr-only">Rechercher</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Référence, contact ou participant…"
            className="h-11 w-full border border-champagne/20 bg-transparent pl-11 pr-4 text-sm placeholder:text-ivory/35"
          />
        </label>
        <label className="flex items-center gap-3 border border-champagne/20 px-4">
          <Filter className="size-4 text-gold" />
          <span className="sr-only">Statut</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="bg-obsidian text-sm text-ivory"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmed">Confirmées</option>
            <option value="waitlisted">Liste d’attente</option>
            <option value="cancelled">Annulées</option>
          </select>
        </label>
        <button
          onClick={() => exportTicketReservationsToExcel(filtered)}
          className="inline-flex h-11 items-center gap-2 border border-champagne/30 px-4 text-sm text-champagne"
        >
          <Download className="size-4" />
          Exporter
        </button>
      </div>

      <div className="overflow-x-auto border border-champagne/15">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-champagne/15 bg-ivory/[0.03] text-xs uppercase tracking-[0.15em] text-champagne/60">
            <tr>
              <th className="p-4">Référence</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Places</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Créée le</th>
              <th className="p-4">
                <span className="sr-only">Ouvrir</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-champagne/10">
            {filtered.map((reservation) => (
              <tr key={reservation.id} className="hover:bg-ivory/[0.03]">
                <td className="p-4 font-mono text-champagne">{reservation.reference}</td>
                <td className="p-4">
                  <div>
                    {reservation.contact_first_name} {reservation.contact_last_name}
                  </div>
                  <div className="text-xs text-ivory/40">{reservation.contact_email}</div>
                </td>
                <td className="p-4 tabular-nums">
                  {reservation.attendees.filter((person) => person.status !== "cancelled").length}
                </td>
                <td className="p-4">
                  <Status value={reservation.status} />
                </td>
                <td className="p-4 text-ivory/55">
                  {new Date(reservation.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-4">
                    <Link
                      to="/admin/billetterie/$id"
                      params={{ id: reservation.id }}
                      className="text-champagne hover:text-ivory"
                    >
                      Voir →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(reservation.id, reservation.reference)}
                      disabled={deletingId === reservation.id}
                      aria-label={`Supprimer la réservation ${reservation.reference}`}
                      className="text-ivory/50 transition-colors hover:text-brick disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ivory/45">
                  Aucune réservation ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminField(
  props: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <label className="block text-xs uppercase tracking-[0.15em] text-champagne/65">
      {props.label}
      <input
        {...props}
        className="mt-2 h-12 w-full border border-champagne/20 bg-obsidian/40 px-3 text-sm text-ivory"
      />
    </label>
  );
}
function Status({ value }: { value: string }) {
  const labels: Record<string, string> = {
    confirmed: "Confirmée",
    waitlisted: "En attente",
    cancelled: "Annulée",
  };
  return (
    <span className="inline-flex border border-champagne/20 px-2.5 py-1 text-xs text-champagne">
      {labels[value] ?? value}
    </span>
  );
}
function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
