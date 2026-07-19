import { supabase } from "@/integrations/supabase/client";
import { categories as staticCategories } from "@/content/categories";

type AppRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  category_slug: string;
  status: string;
  testimony: string;
  admin_notes: string | null;
  created_at: string;
  photo_path: string | null;
};

const statusLabels: Record<string, string> = {
  pending: "À traiter",
  reviewing: "En revue",
  shortlisted: "Présélectionnée",
  winner: "Lauréate",
  rejected: "Refusée",
};

export async function exportApplicationsToExcel(rows: AppRow[]): Promise<void> {
  const XLSX = await import("xlsx");

  // Sign file URLs (7 days)
  const signed = await Promise.all(
    rows.map(async (r) => {
      const photo = r.photo_path
        ? await supabase.storage
            .from("application-files")
            .createSignedUrl(r.photo_path, 60 * 60 * 24 * 7)
        : { data: null as { signedUrl: string } | null };
      return {
        Prénom: r.first_name,
        Nom: r.last_name,
        Email: r.email,
        Téléphone: r.phone,
        Ville: r.city,
        Catégorie:
          staticCategories.find((c) => c.slug === r.category_slug)?.title ?? r.category_slug,
        Statut: statusLabels[r.status] ?? r.status,
        Témoignage: r.testimony,
        "Notes admin": r.admin_notes ?? "",
        "Reçue le": new Date(r.created_at).toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        Photo: photo.data?.signedUrl ?? "",
      };
    }),
  );

  const ws = XLSX.utils.json_to_sheet(signed);

  // Column widths
  ws["!cols"] = [
    { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 20 },
    { wch: 26 }, { wch: 16 }, { wch: 60 }, { wch: 40 }, { wch: 18 },
    { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidatures");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `victorious-candidatures-${stamp}.xlsx`);
}

export async function exportTicketReservationsToExcel(rows: Array<{
  reference: string;
  status: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  attendees: Array<{ first_name: string; last_name: string; email: string; status: string; checked_in_at: string | null }>;
}>): Promise<void> {
  const XLSX = await import("xlsx");
  const statusLabels: Record<string, string> = { confirmed: "Confirmée", waitlisted: "Liste d’attente", cancelled: "Annulée" };
  const flat = rows.flatMap((reservation) => reservation.attendees.map((attendee) => ({
    Référence: reservation.reference,
    "Statut réservation": statusLabels[reservation.status] ?? reservation.status,
    "Prénom participant": attendee.first_name,
    "Nom participant": attendee.last_name,
    "E-mail participant": attendee.email,
    "Statut billet": attendee.status,
    "Contrôlé le": attendee.checked_in_at ? new Date(attendee.checked_in_at).toLocaleString("fr-FR") : "",
    "Contact réservation": `${reservation.contact_first_name} ${reservation.contact_last_name}`,
    "E-mail contact": reservation.contact_email,
    Téléphone: reservation.contact_phone,
    "Réservée le": new Date(reservation.created_at).toLocaleString("fr-FR"),
  })));
  const ws = XLSX.utils.json_to_sheet(flat);
  ws["!cols"] = [{ wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 30 }, { wch: 18 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Billetterie");
  XLSX.writeFile(wb, `victorious-billetterie-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
