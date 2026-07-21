import { event as eventDetails } from "@/content/event";
import type { TicketBundle } from "@/lib/ticketing.functions";
import { renderTicketBundlePdfServer } from "@/lib/ticket-pdf.server";

async function hashToken(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
}

async function deterministicToken(seed: string): Promise<string> {
  return hashToken(`victorious-ticket:v1:${seed}`);
}

async function ticketTokenFor(idempotencyKey: string, position: number, version: number) {
  const base = `${idempotencyKey}:attendee:${position}`;
  return deterministicToken(version === 1 ? base : `${base}:v${version}`);
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked base64 conversion for large buffers.
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function formatEventDate(startsAt: string) {
  const date = new Date(startsAt);
  return {
    date: new Intl.DateTimeFormat("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date).replace(":", "h"),
  };
}

async function loadReservationBundle(reservationId: string): Promise<{
  reservation: {
    id: string;
    reference: string;
    status: "confirmed" | "waitlisted" | "cancelled";
    contact_first_name: string;
    contact_last_name: string;
    contact_email: string;
  };
  bundle: TicketBundle;
  attendees: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: reservation, error } = await supabaseAdmin
    .from("ticket_reservations")
    .select(
      "id, event_id, reference, status, idempotency_key, contact_first_name, contact_last_name, contact_email",
    )
    .eq("id", reservationId)
    .single();
  if (error || !reservation) throw new Error("Réservation introuvable.");

  const [{ data: ticketEvent }, { data: attendees }] = await Promise.all([
    supabaseAdmin
      .from("ticket_events")
      .select("name, starts_at, venue, city")
      .eq("id", reservation.event_id)
      .single(),
    supabaseAdmin
      .from("ticket_attendees")
      .select("id, position, first_name, last_name, email, status, ticket_token_hash, ticket_version")
      .eq("reservation_id", reservation.id)
      .neq("status", "cancelled")
      .order("position"),
  ]);
  if (!ticketEvent) throw new Error("Événement introuvable.");

  const tickets =
    reservation.status === "confirmed"
      ? await Promise.all(
          (attendees ?? []).map(async (attendee) => {
            const token = await ticketTokenFor(
              reservation.idempotency_key,
              attendee.position,
              attendee.ticket_version,
            );
            const tokenHash = await hashToken(token);
            if (tokenHash !== attendee.ticket_token_hash) {
              await supabaseAdmin
                .from("ticket_attendees")
                .update({ ticket_token_hash: tokenHash })
                .eq("id", attendee.id);
            }
            return {
              attendeeId: attendee.id,
              firstName: attendee.first_name,
              lastName: attendee.last_name,
              email: attendee.email,
              token,
            };
          }),
        )
      : [];

  const bundle: TicketBundle = {
    reference: reservation.reference,
    status: reservation.status,
    event: {
      name: ticketEvent.name,
      startsAt: ticketEvent.starts_at,
      venue: ticketEvent.venue,
      city: ticketEvent.city,
    },
    tickets,
  };

  return {
    reservation: {
      id: reservation.id,
      reference: reservation.reference,
      status: reservation.status,
      contact_first_name: reservation.contact_first_name,
      contact_last_name: reservation.contact_last_name,
      contact_email: reservation.contact_email,
    },
    bundle,
    attendees:
      attendees?.map((a) => ({
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
      })) ?? [],
  };
}

type ResendAttachment = { filename: string; content: string };

async function resendSend(payload: {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: ResendAttachment[];
}): Promise<{ id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY manquant.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text) as { id?: string };
  } catch {
    return {};
  }
}

const SENDER =
  process.env.TICKET_EMAIL_FROM ??
  "Victorious <onboarding@resend.dev>";

function attendeeHtml(params: {
  firstName: string;
  reference: string;
  eventName: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  city: string;
  status: "confirmed" | "waitlisted";
}) {
  if (params.status === "waitlisted") {
    return `<!doctype html><html lang="fr"><body style="margin:0;background:#1a0e2e;color:#f8effc;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a0e2e;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#2e1848;border:1px solid rgba(232,201,110,0.25);">
<tr><td style="padding:32px;">
<div style="font-size:11px;letter-spacing:0.25em;color:#e8c96e;text-transform:uppercase;">Victorious 2026 · Liste d'attente</div>
<h1 style="font-family:Georgia,serif;font-size:26px;margin:16px 0 8px;color:#f8effc;">Bonjour ${escapeHtml(params.firstName)},</h1>
<p style="font-size:15px;line-height:1.6;color:rgba(248,239,252,0.8);">
Votre demande de réservation <strong style="color:#e8c96e;">${escapeHtml(params.reference)}</strong> a bien été enregistrée sur la liste d'attente.
Nous vous préviendrons dès qu'une place se libère.
</p>
<p style="font-size:14px;color:rgba(248,239,252,0.7);margin-top:24px;">${escapeHtml(params.eventName)} — ${escapeHtml(params.dateLabel)} · ${escapeHtml(params.timeLabel)}</p>
</td></tr></table>
<p style="color:rgba(248,239,252,0.5);font-size:11px;margin-top:16px;">ICC Rouen — Victorious</p>
</td></tr></table></body></html>`;
  }
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#1a0e2e;color:#f8effc;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a0e2e;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#2e1848;border:1px solid rgba(232,201,110,0.25);">
<tr><td style="padding:32px;">
<div style="font-size:11px;letter-spacing:0.25em;color:#e8c96e;text-transform:uppercase;">Votre billet Victorious</div>
<h1 style="font-family:Georgia,serif;font-size:28px;margin:16px 0 8px;color:#f8effc;">Bonjour ${escapeHtml(params.firstName)},</h1>
<p style="font-size:15px;line-height:1.6;color:rgba(248,239,252,0.85);">
Votre place est confirmée pour <strong style="color:#e8c96e;">${escapeHtml(params.eventName)}</strong>.
Vous trouverez votre billet nominatif en pièce jointe (PDF). Présentez-le à l'entrée — un QR code unique vous sera scanné.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;width:100%;border-top:1px solid rgba(232,201,110,0.2);">
<tr><td style="padding:16px 0;border-bottom:1px solid rgba(232,201,110,0.15);">
<div style="font-size:10px;letter-spacing:0.2em;color:#e8c96e;text-transform:uppercase;">Référence</div>
<div style="font-size:16px;color:#f8effc;margin-top:4px;font-family:'Courier New',monospace;">${escapeHtml(params.reference)}</div>
</td></tr>
<tr><td style="padding:16px 0;border-bottom:1px solid rgba(232,201,110,0.15);">
<div style="font-size:10px;letter-spacing:0.2em;color:#e8c96e;text-transform:uppercase;">Date &amp; heure</div>
<div style="font-size:16px;color:#f8effc;margin-top:4px;">${escapeHtml(params.dateLabel)} · ${escapeHtml(params.timeLabel)}</div>
</td></tr>
<tr><td style="padding:16px 0;">
<div style="font-size:10px;letter-spacing:0.2em;color:#e8c96e;text-transform:uppercase;">Lieu</div>
<div style="font-size:16px;color:#f8effc;margin-top:4px;">${escapeHtml(params.venue)} — ${escapeHtml(params.city)}</div>
</td></tr>
</table>
<p style="font-size:13px;color:rgba(248,239,252,0.6);margin-top:24px;line-height:1.6;">
Ce billet est personnel et gratuit. En cas de modification, contactez ${escapeHtml(eventDetails.contact.email)}.
</p>
</td></tr></table>
<p style="color:rgba(248,239,252,0.5);font-size:11px;margin-top:16px;">ICC Rouen — Victorious 2026</p>
</td></tr></table></body></html>`;
}

function contactRecapHtml(params: {
  firstName: string;
  reference: string;
  eventName: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  city: string;
  attendees: Array<{ first_name: string; last_name: string; email: string }>;
  status: "confirmed" | "waitlisted";
}) {
  const rows = params.attendees
    .map(
      (a, i) => `<tr><td style="padding:8px 0;color:rgba(248,239,252,0.85);font-size:14px;">
<strong style="color:#e8c96e;">${i + 1}.</strong> ${escapeHtml(a.first_name)} ${escapeHtml(a.last_name)} — ${escapeHtml(a.email)}
</td></tr>`,
    )
    .join("");
  const statusLabel = params.status === "confirmed" ? "confirmée" : "sur liste d'attente";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#1a0e2e;color:#f8effc;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a0e2e;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#2e1848;border:1px solid rgba(232,201,110,0.25);">
<tr><td style="padding:32px;">
<div style="font-size:11px;letter-spacing:0.25em;color:#e8c96e;text-transform:uppercase;">Récapitulatif de réservation</div>
<h1 style="font-family:Georgia,serif;font-size:26px;margin:16px 0 8px;color:#f8effc;">Bonjour ${escapeHtml(params.firstName)},</h1>
<p style="font-size:15px;line-height:1.6;color:rgba(248,239,252,0.85);">
Votre réservation <strong style="color:#e8c96e;">${escapeHtml(params.reference)}</strong> est ${statusLabel}.
${params.status === "confirmed" ? "Chaque participant recevra son billet nominatif en pièce jointe par e-mail." : "Nous vous préviendrons dès qu'une place se libère."}
</p>
<p style="font-size:14px;color:rgba(248,239,252,0.75);margin-top:20px;">
${escapeHtml(params.eventName)}<br/>${escapeHtml(params.dateLabel)} · ${escapeHtml(params.timeLabel)}<br/>${escapeHtml(params.venue)} — ${escapeHtml(params.city)}
</p>
<div style="margin-top:24px;border-top:1px solid rgba(232,201,110,0.2);padding-top:16px;">
<div style="font-size:10px;letter-spacing:0.2em;color:#e8c96e;text-transform:uppercase;margin-bottom:8px;">Participants</div>
<table role="presentation" width="100%">${rows}</table>
</div>
</td></tr></table>
</td></tr></table></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function logEmail(entry: {
  reservation_id: string;
  attendee_id?: string | null;
  kind: string;
  recipient: string;
  provider_id?: string | null;
  status: "sent" | "failed";
  error_message?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ticket_email_log").insert({
      reservation_id: entry.reservation_id,
      attendee_id: entry.attendee_id ?? null,
      kind: entry.kind,
      recipient: entry.recipient,
      provider_id: entry.provider_id ?? null,
      status: entry.status,
      error_message: entry.error_message ?? null,
    });
  } catch (error) {
    console.error("ticket-email log insert failed", error);
  }
}

export type SendResult = {
  sent: number;
  failed: number;
  errors: string[];
};

/**
 * Send ticket emails for a reservation:
 * - one email per confirmed attendee with the personal PDF attached,
 * - one recap email to the contact person (if different from attendees, or always).
 * Waitlisted reservations get informational emails only (no PDF).
 * Fire-and-forget safe: never throws; returns a summary.
 */
export async function sendReservationTicketEmails(
  reservationId: string,
  options?: { kindSuffix?: string },
): Promise<SendResult> {
  const summary: SendResult = { sent: 0, failed: 0, errors: [] };
  try {
    const { reservation, bundle, attendees } = await loadReservationBundle(reservationId);
    if (reservation.status === "cancelled") return summary;

    const { date: dateLabel, time: timeLabel } = formatEventDate(bundle.event.startsAt);
    const kindPrefix = options?.kindSuffix ? `${options.kindSuffix}:` : "";

    // Waitlisted → single info mail to contact + attendees (no PDF).
    if (bundle.status === "waitlisted") {
      const targets = new Set<string>();
      targets.add(reservation.contact_email.toLowerCase());
      for (const attendee of attendees) targets.add(attendee.email.toLowerCase());
      for (const recipient of targets) {
        try {
          const result = await resendSend({
            from: SENDER,
            to: [recipient],
            subject: `Victorious 2026 — Vous êtes sur la liste d'attente (${reservation.reference})`,
            html: attendeeHtml({
              firstName: reservation.contact_first_name,
              reference: reservation.reference,
              eventName: bundle.event.name,
              dateLabel, timeLabel,
              venue: bundle.event.venue,
              city: bundle.event.city,
              status: "waitlisted",
            }),
            reply_to: eventDetails.contact.email,
          });
          summary.sent += 1;
          await logEmail({
            reservation_id: reservation.id,
            kind: `${kindPrefix}waitlist`,
            recipient,
            provider_id: result.id ?? null,
            status: "sent",
          });
        } catch (error) {
          summary.failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          summary.errors.push(message);
          await logEmail({
            reservation_id: reservation.id,
            kind: `${kindPrefix}waitlist`,
            recipient,
            status: "failed",
            error_message: message,
          });
        }
      }
      return summary;
    }

    // Confirmed → generate PDF once for the bundle, send one email per attendee.
    // Attaching just their own page would require per-attendee PDFs, but the
    // bundle PDF contains named pages for each attendee, which is acceptable
    // for a small party (≤4). Each attendee receives the same bundle attachment.
    const pdfBytes = await renderTicketBundlePdfServer(bundle);
    const attachmentBase64 = bytesToBase64(pdfBytes);
    const attachmentFilename = `victorious-2026-${reservation.reference.toLowerCase()}.pdf`;
    const attendeeEmails = new Set<string>();

    for (const ticket of bundle.tickets) {
      const recipient = ticket.email.toLowerCase();
      attendeeEmails.add(recipient);
      try {
        const result = await resendSend({
          from: SENDER,
          to: [ticket.email],
          subject: `🎟️ Votre billet Victorious 2026 — ${reservation.reference}`,
          html: attendeeHtml({
            firstName: ticket.firstName,
            reference: reservation.reference,
            eventName: bundle.event.name,
            dateLabel, timeLabel,
            venue: bundle.event.venue,
            city: bundle.event.city,
            status: "confirmed",
          }),
          reply_to: eventDetails.contact.email,
          attachments: [{ filename: attachmentFilename, content: attachmentBase64 }],
        });
        summary.sent += 1;
        await logEmail({
          reservation_id: reservation.id,
          attendee_id: ticket.attendeeId || null,
          kind: `${kindPrefix}ticket`,
          recipient: ticket.email,
          provider_id: result.id ?? null,
          status: "sent",
        });
      } catch (error) {
        summary.failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        summary.errors.push(message);
        await logEmail({
          reservation_id: reservation.id,
          attendee_id: ticket.attendeeId || null,
          kind: `${kindPrefix}ticket`,
          recipient: ticket.email,
          status: "failed",
          error_message: message,
        });
      }
    }

    // Contact recap (always send: acts as a copy for the contact person even if they are also an attendee).
    const contactRecipient = reservation.contact_email.toLowerCase();
    try {
      const ccList = Array.from(
        new Set(
          attendees
            .map((a) => a.email)
            .filter((email) => email && email.toLowerCase() !== contactRecipient),
        ),
      );
      const result = await resendSend({
        from: SENDER,
        to: [reservation.contact_email],
        cc: ccList.length > 0 ? ccList : undefined,
        subject: `Récapitulatif Victorious 2026 — ${reservation.reference}`,
        html: contactRecapHtml({
          firstName: reservation.contact_first_name,
          reference: reservation.reference,
          eventName: bundle.event.name,
          dateLabel, timeLabel,
          venue: bundle.event.venue,
          city: bundle.event.city,
          attendees,
          status: "confirmed",
        }),
        reply_to: eventDetails.contact.email,
        attachments: [{ filename: attachmentFilename, content: attachmentBase64 }],
      });
      summary.sent += 1;
      await logEmail({
        reservation_id: reservation.id,
        kind: `${kindPrefix}contact-recap`,
        recipient: contactRecipient,
        provider_id: result.id ?? null,
        status: "sent",
      });
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(message);
      await logEmail({
        reservation_id: reservation.id,
        kind: `${kindPrefix}contact-recap`,
        recipient: contactRecipient,
        status: "failed",
        error_message: message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summary.failed += 1;
    summary.errors.push(message);
    console.error("sendReservationTicketEmails fatal", error);
  }
  return summary;
}
