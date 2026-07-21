import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Download, MessageCircle, Search, Trash2, Undo2 } from "lucide-react";
import { VButton } from "@/components/victorious/VButton";
import { supabase } from "@/integrations/supabase/client";
import { exportRaffleParticipantsToExcel } from "@/lib/excel-export";
import { toE164Whatsapp, buildWaMeLink, buildRaffleTicketMessage } from "@/lib/whatsapp-link";
import {
  adminCreateRaffleParticipant,
  adminCancelRaffleParticipant,
  adminDeleteRaffleParticipant,
  adminMarkRaffleWhatsappSent,
} from "@/lib/raffle.functions";

export const Route = createFileRoute("/admin/tirage/")({ component: RaffleAdminPage });

type RaffleParticipant = {
  id: string;
  ticket_number: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  status: "active" | "cancelled";
  whatsapp_sent_at: string | null;
  created_at: string;
};

function RaffleAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin", "raffle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raffle_participants")
        .select("*")
        .order("ticket_number", { ascending: true });
      if (error) throw error;
      return data as RaffleParticipant[];
    },
  });

  const filtered = useMemo(
    () =>
      (query.data ?? []).filter((participant) => {
        const needle = search.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          [participant.first_name, participant.last_name, participant.phone, participant.email ?? ""].some(
            (value) => value.toLowerCase().includes(needle),
          );
        return matchesSearch && (status === "all" || participant.status === status);
      }),
    [query.data, search, status],
  );

  const requireSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Votre session a expiré.");
      return null;
    }
    return sessionData.session.access_token;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    setFormError(null);
    if (!toE164Whatsapp(phone)) {
      setFormError("Numéro WhatsApp invalide (format international, ex. +33612345678).");
      return;
    }

    const accessToken = await requireSession();
    if (!accessToken) return;

    setCreating(true);
    setMessage(null);
    try {
      const result = await adminCreateRaffleParticipant({
        data: { accessToken, firstName, lastName, phone, email },
      });
      setMessage(`Participant ajouté — ticket T-${String(result.ticketNumber).padStart(4, "0")}.`);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["admin", "raffle"] });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Impossible d’ajouter ce participant.");
    } finally {
      setCreating(false);
    }
  };

  const handleWhatsapp = async (participant: RaffleParticipant) => {
    const link = buildWaMeLink(
      participant.phone,
      buildRaffleTicketMessage({ firstName: participant.first_name, ticketNumber: participant.ticket_number }),
    );
    window.open(link, "_blank", "noopener,noreferrer");
    const accessToken = await requireSession();
    if (!accessToken) return;
    try {
      await adminMarkRaffleWhatsappSent({ data: { accessToken, participantId: participant.id } });
      await queryClient.invalidateQueries({ queryKey: ["admin", "raffle"] });
    } catch {
      // pas bloquant : l’ouverture WhatsApp a déjà eu lieu
    }
  };

  const handleCancel = async (participant: RaffleParticipant) => {
    const accessToken = await requireSession();
    if (!accessToken) return;
    setBusyId(participant.id);
    setMessage(null);
    try {
      await adminCancelRaffleParticipant({ data: { accessToken, participantId: participant.id } });
      setMessage("Participant annulé.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "raffle"] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Annulation impossible.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (participant: RaffleParticipant) => {
    if (!confirm(`Supprimer définitivement le ticket T-${String(participant.ticket_number).padStart(4, "0")} ? Cette action est irréversible.`))
      return;
    const accessToken = await requireSession();
    if (!accessToken) return;
    setBusyId(participant.id);
    setMessage(null);
    try {
      await adminDeleteRaffleParticipant({ data: { accessToken, participantId: participant.id } });
      setMessage("Participant supprimé.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "raffle"] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-9">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-champagne/65">Victorious 2026</p>
        <h1 className="mt-2 font-display text-4xl text-ivory">Tirage au sort</h1>
        <p className="mt-2 text-sm text-ivory/55">
          Inscrivez les participants et envoyez-leur leur ticket par WhatsApp. Le tirage se fait
          manuellement le jour J à partir de la liste exportée.
        </p>
      </header>

      <form
        onSubmit={handleCreate}
        className="grid gap-5 border border-champagne/20 bg-velvet/25 p-6 md:grid-cols-5"
      >
        <AdminField label="Prénom" name="firstName" required />
        <AdminField label="Nom" name="lastName" required />
        <AdminField label="Téléphone WhatsApp" name="phone" placeholder="+33612345678" required />
        <AdminField label="Email" name="email" type="email" required />
        <div className="flex items-end">
          <VButton type="submit" disabled={creating} className="w-full">
            {creating ? "Ajout…" : "Ajouter"}
          </VButton>
        </div>
        {formError && (
          <p role="alert" className="md:col-span-5 text-sm text-brick">
            {formError}
          </p>
        )}
      </form>

      {message && (
        <p role="status" className="text-sm text-champagne">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-64 flex-1">
          <Search className="absolute left-4 top-3.5 size-4 text-ivory/40" />
          <span className="sr-only">Rechercher</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, téléphone ou email…"
            className="h-11 w-full border border-champagne/20 bg-transparent pl-11 pr-4 text-sm placeholder:text-ivory/35"
          />
        </label>
        <label className="flex items-center gap-3 border border-champagne/20 px-4">
          <span className="sr-only">Statut</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="bg-obsidian text-sm text-ivory"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="cancelled">Annulés</option>
          </select>
        </label>
        <button
          onClick={() => exportRaffleParticipantsToExcel(filtered)}
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
              <th className="p-4">Ticket</th>
              <th className="p-4">Participant</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4">Statut</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-champagne/10">
            {(query.isLoading ? [] : filtered).map((participant) => (
              <tr key={participant.id} className="hover:bg-ivory/[0.03]">
                <td className="p-4 font-mono text-champagne">
                  T-{String(participant.ticket_number).padStart(4, "0")}
                </td>
                <td className="p-4">
                  <div>
                    {participant.first_name} {participant.last_name}
                  </div>
                  <div className="text-xs text-ivory/40">{participant.email}</div>
                </td>
                <td className="p-4 text-ivory/70">{participant.phone}</td>
                <td className="p-4">
                  <span className="inline-flex border border-champagne/20 px-2.5 py-1 text-xs text-champagne">
                    {participant.status === "cancelled" ? "Annulé" : "Actif"}
                  </span>
                </td>
                <td className="p-4 text-ivory/55">
                  {participant.whatsapp_sent_at
                    ? new Date(participant.whatsapp_sent_at).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleWhatsapp(participant)}
                      disabled={participant.status === "cancelled"}
                      aria-label={`Envoyer le ticket à ${participant.first_name} par WhatsApp`}
                      className="text-champagne transition-colors hover:text-ivory disabled:opacity-40"
                    >
                      <MessageCircle className="size-4" />
                    </button>
                    {participant.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(participant)}
                        disabled={busyId === participant.id}
                        aria-label={`Annuler le ticket de ${participant.first_name}`}
                        className="text-ivory/50 transition-colors hover:text-champagne disabled:opacity-40"
                      >
                        <Undo2 className="size-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(participant)}
                      disabled={busyId === participant.id}
                      aria-label={`Supprimer le ticket de ${participant.first_name}`}
                      className="text-ivory/50 transition-colors hover:text-brick disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!query.isLoading && !filtered.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ivory/45">
                  Aucun participant ne correspond aux filtres.
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
