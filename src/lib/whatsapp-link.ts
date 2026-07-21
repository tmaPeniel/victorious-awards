export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizeWhatsappNumber(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export function isValidWhatsappNumber(value: string): boolean {
  return E164_REGEX.test(normalizeWhatsappNumber(value));
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
