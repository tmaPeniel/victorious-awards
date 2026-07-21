export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizeWhatsappNumber(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export function isValidWhatsappNumber(value: string): boolean {
  return E164_REGEX.test(normalizeWhatsappNumber(value));
}

/**
 * Normalizes a French local number (0X…) or an international one (00…) to E.164.
 * Returns null if the result isn't a valid E.164 number.
 */
export function toE164Whatsapp(value: string): string | null {
  let s = normalizeWhatsappNumber(value);
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0\d{9}$/.test(s)) s = "+33" + s.slice(1);
  return E164_REGEX.test(s) ? s : null;
}

/**
 * Build a wa.me click-to-chat link. `phone` must be E.164 (with the leading +),
 * which we strip because wa.me expects digits only.
 */
export function buildWaMeLink(phone: string, message: string): string {
  const digits = normalizeWhatsappNumber(phone).replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://victorious-awards.lovable.app";
}

export function ticketPublicUrl(token: string): string {
  return `${siteOrigin()}/billet?token=${encodeURIComponent(token)}`;
}

export function buildAttendeeMessage(params: {
  firstName: string;
  eventName: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  city: string;
  ticketUrl: string;
  reference: string;
}): string {
  return (
    `Bonjour ${params.firstName} 🎉\n\n` +
    `Voici votre billet pour ${params.eventName}\n` +
    `📅 ${params.dateLabel} · ${params.timeLabel}\n` +
    `📍 ${params.venue} — ${params.city}\n\n` +
    `Ouvrez ce lien et présentez le QR code à l'entrée :\n${params.ticketUrl}\n\n` +
    `Référence : ${params.reference}`
  );
}

export function buildRaffleTicketMessage(params: {
  firstName: string;
  ticketNumber: number;
}): string {
  const ref = `T-${String(params.ticketNumber).padStart(4, "0")}`;
  return (
    `Bonjour ${params.firstName} 🎟️\n\n` +
    `Vous êtes inscrit(e) au tirage au sort Victorious !\n` +
    `Votre numéro de participation : ${ref}\n\n` +
    `Le tirage aura lieu le jour J. Bonne chance ! ✨`
  );
}

export function buildContactRecapMessage(params: {
  firstName: string;
  reference: string;
  eventName: string;
  dateLabel: string;
  timeLabel: string;
  tickets: Array<{ firstName: string; lastName: string; ticketUrl: string }>;
}): string {
  const lines = params.tickets
    .map(
      (ticket, index) =>
        `${index + 1}. ${ticket.firstName} ${ticket.lastName} → ${ticket.ticketUrl}`,
    )
    .join("\n");
  return (
    `Récapitulatif Victorious 2026 — ${params.reference}\n` +
    `📅 ${params.dateLabel} · ${params.timeLabel}\n\n` +
    `Billets nominatifs :\n${lines}\n\n` +
    `Chaque participant doit présenter son QR code à l'entrée.`
  );
}
