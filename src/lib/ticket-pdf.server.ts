import { PDFDocument, StandardFonts, type PDFFont, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { TicketBundle } from "@/lib/ticketing.functions";

const A4 = { width: 595.28, height: 841.89 };
const colors = {
  night: rgb(0.105, 0.055, 0.18),
  velvet: rgb(0.18, 0.095, 0.28),
  champagne: rgb(0.91, 0.79, 0.43),
  gold: rgb(0.76, 0.57, 0.2),
  ivory: rgb(0.965, 0.94, 0.98),
  muted: rgb(0.72, 0.68, 0.78),
  white: rgb(1, 1, 1),
};

function fitText(font: PDFFont, text: string, maxWidth: number, preferred: number, minimum: number) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

function base64FromDataUrl(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(",")[1] ?? "";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function formattedEventDate(startsAt: string) {
  const date = new Date(startsAt);
  return {
    date: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date),
    time: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date).replace(":", "h"),
  };
}

export async function renderTicketBundlePdfServer(bundle: TicketBundle): Promise<Uint8Array> {
  if (bundle.status !== "confirmed" || bundle.tickets.length === 0)
    throw new Error("Les billets ne sont pas encore disponibles.");

  const pdf = await PDFDocument.create();
  const [display, sans, sansBold] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman),
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
  ]);
  const eventDate = formattedEventDate(bundle.event.startsAt);

  pdf.setTitle(`Billets Victorious 2026 - ${bundle.reference}`);
  pdf.setAuthor("Victorious - ICC Rouen");
  pdf.setSubject("Billets nominatifs Victorious 2026");
  pdf.setCreator("Victorious");

  for (const [index, ticket] of bundle.tickets.entries()) {
    const page = pdf.addPage([A4.width, A4.height]);
    const fullName = `${ticket.firstName} ${ticket.lastName}`;
    const qrDataUrl = await QRCode.toDataURL(`victorious-ticket:${ticket.token}`, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1A0E2E", light: "#FFFFFF" },
    });
    const qr = await pdf.embedPng(base64FromDataUrl(qrDataUrl));

    page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: colors.night });
    page.drawRectangle({ x: 0, y: A4.height - 146, width: A4.width, height: 146, color: colors.champagne });
    page.drawRectangle({ x: 42, y: 46, width: 511, height: 610, color: colors.velvet });
    page.drawRectangle({ x: 42, y: 46, width: 4, height: 610, color: colors.gold });

    page.drawText("VICTORIOUS", { x: 42, y: A4.height - 72, size: 28, font: display, color: colors.night });
    page.drawText("LA NUIT DE L'EXCELLENCE", { x: 43, y: A4.height - 98, size: 9, font: sans, color: colors.night });
    page.drawText(`BILLET ${index + 1} / ${bundle.tickets.length}`, {
      x: 448, y: A4.height - 82, size: 9, font: sans, color: colors.night,
    });

    page.drawText("BILLET NOMINATIF", { x: 72, y: 606, size: 10, font: sans, color: colors.champagne });
    const nameSize = fitText(sansBold, fullName, 450, 34, 18);
    page.drawText(fullName, { x: 72, y: 560, size: nameSize, font: sansBold, color: colors.ivory });
    page.drawText(bundle.reference, { x: 72, y: 522, size: 11, font: sans, color: colors.champagne });

    page.drawRectangle({ x: 176, y: 270, width: 244, height: 244, color: colors.white });
    page.drawImage(qr, { x: 188, y: 282, width: 220, height: 220 });
    page.drawText("Présentez ce QR code au contrôle d'entrée", {
      x: 176, y: 246, size: 10, font: sans, color: colors.muted,
    });

    page.drawLine({
      start: { x: 72, y: 218 }, end: { x: 523, y: 218 },
      thickness: 0.7, color: colors.gold, opacity: 0.5,
    });
    const details: Array<[string, string]> = [
      ["DATE", eventDate.date],
      ["HEURE", eventDate.time],
      ["LIEU", `${bundle.event.venue} - ${bundle.event.city}`],
    ];
    details.forEach(([label, value], detailIndex) => {
      const x = 72 + detailIndex * 151;
      page.drawText(label, { x, y: 185, size: 8, font: sans, color: colors.champagne });
      page.drawText(value, {
        x, y: 164,
        size: fitText(sans, value, 138, 11, 8),
        font: sans, color: colors.ivory,
      });
    });

    page.drawText("Billet personnel et gratuit - une seule entrée autorisée", {
      x: 72, y: 86, size: 9, font: sans, color: colors.muted,
    });
    page.drawText("victorious 2026", { x: 450, y: 86, size: 9, font: sans, color: colors.champagne });
  }

  return pdf.save();
}
