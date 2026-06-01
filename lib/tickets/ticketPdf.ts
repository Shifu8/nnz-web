import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateTicketQrPng } from "./ticketImage";

type TicketInfo = {
  firstName: string;
  lastName: string;
  serialNumber: string;
  qrPayload: string;
  quantity: number;
  eventTitle?: string;
  eventSubtitle?: string;
  eventDate?: string;
  eventCity?: string;
};

const W = 400;
const H = 600;
const BLACK = rgb(0, 0, 0);
const RED = rgb(220 / 255, 38 / 255, 38 / 255);
const GREEN = rgb(200 / 255, 255 / 255, 0);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(136 / 255, 136 / 255, 136 / 255);

function cx(w: number): number {
  return (W - w) / 2;
}

export async function generateTicketPdf(ticket: TicketInfo): Promise<Buffer> {
  const qrPng = await generateTicketQrPng(ticket.qrPayload);

  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);

  const bold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedStandardFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BLACK });

  page.drawText("DAWGS", { x: 24, y: H - 44, size: 32, font: bold, color: WHITE });
  page.drawText("ACCESO · ENTRADA ÚNICA", { x: 24, y: H - 62, size: 8, font: regular, color: GRAY });

  page.drawLine({ start: { x: 24, y: H - 74 }, end: { x: W - 24, y: H - 74 }, thickness: 1, color: RED });

  const eventTitle = ticket.eventTitle || "TRAP LOUD";
  const eventSub = ticket.eventSubtitle || "YAN BLOCK EXPERIENCE";
  const eventDate = ticket.eventDate || "18 JUN 2026";
  const eventCity = ticket.eventCity || "San Juan";

  page.drawText(eventTitle, { x: 24, y: H - 104, size: 22, font: bold, color: WHITE });
  page.drawText(eventSub, { x: 24, y: H - 122, size: 12, font: regular, color: GREEN });
  page.drawText(`${eventDate} · ${eventCity}`, { x: 24, y: H - 140, size: 9, font: regular, color: GRAY });

  const qrSize = 180;
  const qrX = (W - qrSize) / 2;
  const qrY = H - 200 - qrSize;
  const qrImage = await doc.embedPng(qrPng);
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  const serialY = qrY - 20;
  page.drawText("SERIAL", { x: cx(40), y: serialY, size: 7, font: regular, color: GRAY });
  page.drawText(ticket.serialNumber, { x: cx(bold.widthOfTextAtSize(ticket.serialNumber, 10)), y: serialY - 14, size: 10, font: bold, color: WHITE });

  const holderY = serialY - 42;
  const holderName = `${ticket.firstName} ${ticket.lastName}`;
  page.drawText("TITULAR", { x: cx(36), y: holderY, size: 7, font: regular, color: GRAY });
  page.drawText(holderName, { x: cx(bold.widthOfTextAtSize(holderName, 14)), y: holderY - 16, size: 14, font: bold, color: WHITE });

  const qtyStr = `${ticket.quantity} entrada(s)`;
  const qtyY = holderY - 48;
  page.drawText("CANTIDAD", { x: cx(48), y: qtyY, size: 7, font: regular, color: GRAY });
  page.drawText(qtyStr, { x: cx(bold.widthOfTextAtSize(qtyStr, 14)), y: qtyY - 16, size: 14, font: bold, color: GREEN });

  page.drawText("VÁLIDO POR UNA SOLA OCASIÓN · DAWGS", { x: cx(170), y: 20, size: 6, font: regular, color: GRAY });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
