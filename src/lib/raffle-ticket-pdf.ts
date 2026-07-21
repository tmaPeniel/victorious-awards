import { PDFDocument, StandardFonts, type PDFFont, rgb } from "pdf-lib";

const A4 = { width: 595.28, height: 841.89 };
const colors = {
  night: rgb(0.105, 0.055, 0.18),
  velvet: rgb(0.18, 0.095, 0.28),
  champagne: rgb(0.91, 0.79, 0.43),
  gold: rgb(0.76, 0.57, 0.2),
  ivory: rgb(0.965, 0.94, 0.98),
  muted: rgb(0.72, 0.68, 0.78),
};

export type RaffleTicket = {
  firstName: string;
  lastName: string;
  ticketNumber: number;
};

export function raffleTicketRef(ticketNumber: number): string {
  return `T-${String(ticketNumber).padStart(4, "0")}`;
}

function fitText(font: PDFFont, text: string, maxWidth: number, preferred: number, minimum: number) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

function dataUrlBytes(dataUrl: string) {
  const encoded = dataUrl.split(",")[1] ?? "";
  const binary = window.atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function namePng(fullName: string) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1_600;
  canvas.height = 150;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Le navigateur ne peut pas dessiner le billet.");
  let size = 82;
  context.font = `${size}px "Fraunces Variable", Fraunces, Georgia, serif`;
  while (size > 48 && context.measureText(fullName).width > 1_500) {
    size -= 2;
    context.font = `${size}px "Fraunces Variable", Fraunces, Georgia, serif`;
  }
  context.fillStyle = "#f8effc";
  context.textBaseline = "middle";
  context.fillText(fullName, 0, canvas.height / 2);
  return dataUrlBytes(canvas.toDataURL("image/png"));
}

export async function createRaffleTicketPdf(ticket: RaffleTicket): Promise<Uint8Array> {
  const ref = raffleTicketRef(ticket.ticketNumber);
  const fullName = `${ticket.firstName} ${ticket.lastName}`;

  const pdf = await PDFDocument.create();
  const [display, sans] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman),
    pdf.embedFont(StandardFonts.Helvetica),
  ]);
  pdf.setTitle(`Ticket tirage au sort Victorious - ${ref}`);
  pdf.setAuthor("Victorious - ICC Rouen");
  pdf.setSubject("Ticket de participation au tirage au sort Victorious");
  pdf.setCreator("Victorious");

  const page = pdf.addPage([A4.width, A4.height]);
  const name = await pdf.embedPng(await namePng(fullName));

  page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: colors.night });
  page.drawRectangle({ x: 0, y: A4.height - 146, width: A4.width, height: 146, color: colors.champagne });
  page.drawRectangle({ x: 42, y: 46, width: 511, height: 610, color: colors.velvet });
  page.drawRectangle({ x: 42, y: 46, width: 4, height: 610, color: colors.gold });

  page.drawText("VICTORIOUS", { x: 42, y: A4.height - 72, size: 28, font: display, color: colors.night });
  page.drawText("TIRAGE AU SORT", { x: 43, y: A4.height - 98, size: 9, font: sans, color: colors.night });

  page.drawText("TICKET DE PARTICIPATION", { x: 72, y: 606, size: 10, font: sans, color: colors.champagne });
  const nameWidth = Math.min(450, name.width * (58 / name.height));
  page.drawImage(name, { x: 72, y: 545, width: nameWidth, height: 58 });

  page.drawRectangle({ x: 122, y: 300, width: 344, height: 160, color: colors.night });
  page.drawRectangle({ x: 122, y: 300, width: 344, height: 160, borderColor: colors.gold, borderWidth: 1 });
  page.drawText(ref, {
    x: 122 + (344 - display.widthOfTextAtSize(ref, 56)) / 2,
    y: 358,
    size: 56,
    font: display,
    color: colors.champagne,
  });
  page.drawText("NUMÉRO DE PARTICIPATION", {
    x: 122 + (344 - sans.widthOfTextAtSize("NUMÉRO DE PARTICIPATION", 10)) / 2,
    y: 322,
    size: 10,
    font: sans,
    color: colors.muted,
  });

  page.drawLine({ start: { x: 72, y: 218 }, end: { x: 523, y: 218 }, thickness: 0.7, color: colors.gold, opacity: 0.5 });
  const info = "Ce ticket vous inscrit au tirage au sort Victorious. Le tirage sera effectué le jour de la cérémonie.";
  page.drawText(info, {
    x: 72,
    y: 185,
    size: fitText(sans, info, 451, 11, 8),
    font: sans,
    color: colors.ivory,
  });

  page.drawText("Ticket personnel et non transmissible", { x: 72, y: 86, size: 9, font: sans, color: colors.muted });
  page.drawText("victorious", { x: 470, y: 86, size: 9, font: sans, color: colors.champagne });

  return pdf.save();
}

export async function downloadRaffleTicketPdf(ticket: RaffleTicket) {
  const bytes = await createRaffleTicketPdf(ticket);
  const buffer = new Uint8Array(bytes.byteLength);
  buffer.set(bytes);
  const blob = new Blob([buffer.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `victorious-tirage-${raffleTicketRef(ticket.ticketNumber).toLowerCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
