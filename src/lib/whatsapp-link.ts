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

export function buildRaffleTicketMessage(params: {
  firstName: string;
  ticketNumber: number;
}): string {
  const ref = `T-${String(params.ticketNumber).padStart(4, "0")}`;
  return (
    `Bonjour ${params.firstName} 🎟️\n\n` +
    `Vous êtes inscrit(e) au tirage au sort Victorious !\n` +
    `Votre ticket (numéro ${ref}) est en pièce jointe.\n\n` +
    `Le tirage aura lieu le jour J. Bonne chance ! ✨`
  );
}
