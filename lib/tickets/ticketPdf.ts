import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateTicketQrPng } from "./ticketImage";
import { getEventDesigns } from "./designs";

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
  ticketDesign?: string;
};

const W = 400;
const H = 700;
const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(136 / 255, 136 / 255, 136 / 255);

function parseHexColor(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}
export async function generateTicketPdf(ticket: TicketInfo): Promise<Buffer> {
  const qrPng = await generateTicketQrPng(ticket.qrPayload);
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedStandardFont(StandardFonts.Helvetica);

  // Determine event ID
  let eventId = "trap-loud";
  if (ticket.qrPayload) {
    try {
      const parsed = JSON.parse(ticket.qrPayload) as { eventId?: string };
      if (parsed.eventId) eventId = parsed.eventId;
    } catch {
      // fallback
    }
  }

  // Get selected design
  const designs = getEventDesigns(eventId);
  const designIdx = parseInt(ticket.ticketDesign || "0", 10);
  const selectedDesign = designs[designIdx] || designs[0];
  const accentColor = parseHexColor(selectedDesign.accentColor);

  // Background fallback
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BLACK });

  // Locate the public directory robustly
  let publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir) && path.basename(process.cwd()) === "frontend") {
    publicDir = path.join(path.dirname(process.cwd()), "public");
  }
  // Fallback: search parent directories up to 3 levels
  let currentSearch = process.cwd();
  for (let i = 0; i < 3; i++) {
    if (fs.existsSync(path.join(currentSearch, "public"))) {
      publicDir = path.join(currentSearch, "public");
      break;
    }
    currentSearch = path.dirname(currentSearch);
  }

  // Load and embed selected artist photo (fill entire background)
  const photoPath = path.join(publicDir, selectedDesign.photo.replace(/^\//, ""));
  if (fs.existsSync(photoPath)) {
    try {
      const photoBytes = fs.readFileSync(photoPath);
      let embeddedPhoto;
      if (photoPath.toLowerCase().endsWith(".png")) {
        embeddedPhoto = await doc.embedPng(photoBytes);
      } else {
        embeddedPhoto = await doc.embedJpg(photoBytes);
      }
      page.drawImage(embeddedPhoto, { x: 0, y: 0, width: W, height: H });
    } catch (err) {
      console.error("[TICKET_PDF] Failed to embed artist photo", err);
    }
  } else {
    console.warn(`[TICKET_PDF] Photo not found at: ${photoPath}`);
  }

  // Top header overlay
  page.drawRectangle({
    x: 0,
    y: H - 70,
    width: W,
    height: 70,
    color: BLACK,
    opacity: 0.6,
  });

  // Top header text
  page.drawText("NENEZ", { x: 24, y: H - 44, size: 13, font: bold, color: WHITE });

  // Badge Access border
  const badgeText = selectedDesign.badge.toUpperCase();
  const badgeW = bold.widthOfTextAtSize(badgeText, 7) + 16;
  page.drawRectangle({
    x: W - 24 - badgeW,
    y: H - 48,
    width: badgeW,
    height: 18,
    color: BLACK,
    borderColor: accentColor,
    borderWidth: 1,
  });
  page.drawText(badgeText, {
    x: W - 24 - badgeW + 8,
    y: H - 43,
    size: 7,
    font: bold,
    color: accentColor,
  });

  // ── BOTTOM OVERLAY STUB ──
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: 180,
    color: BLACK,
    opacity: 0.82,
  });

  // Divider accent line above stub
  page.drawLine({
    start: { x: 0, y: 180 },
    end: { x: W, y: 180 },
    thickness: 2,
    color: accentColor,
  });

  // Perforated line
  page.drawLine({
    start: { x: 16, y: 180 },
    end: { x: W - 16, y: 180 },
    thickness: 1.5,
    color: BLACK,
    dashArray: [5, 5],
  });

  // Left Column Details
  // Event & Artist Title
  page.drawText(ticket.eventTitle || "TRAP LOUD", { x: 24, y: 155, size: 8, font: regular, color: GRAY });
  page.drawText(selectedDesign.name, { x: 24, y: 134, size: 18, font: bold, color: WHITE });

  // Ciudad & Fecha
  page.drawText("CIUDAD / FECHA", { x: 24, y: 110, size: 7, font: regular, color: GRAY });
  page.drawText(`${ticket.eventCity || "LOJA"} - ${ticket.eventDate || "18 JUN 2026"}`, { x: 24, y: 96, size: 9, font: bold, color: WHITE });

  // Quantity / Holder
  const holderName = `${ticket.firstName} ${ticket.lastName}`.trim();
  page.drawText("TITULAR / PASES", { x: 24, y: 72, size: 7, font: regular, color: GRAY });
  page.drawText(`${holderName} (${ticket.quantity}x)`, { x: 24, y: 57, size: 9, font: bold, color: accentColor });

  // QR Container on right
  page.drawRectangle({
    x: W - 24 - 100 - 4,
    y: 48 - 4,
    width: 108,
    height: 108,
    color: WHITE,
  });
  const qrImage = await doc.embedPng(qrPng);
  page.drawImage(qrImage, { x: W - 24 - 100, y: 48, width: 100, height: 100 });

  // Ticket Code and Barcode text
  page.drawText(`TICKET: #${ticket.serialNumber}`, { x: 24, y: 38, size: 6.5, font: regular, color: GRAY });
  page.drawText("*VIP-ONLY-ENTRY*", { x: 24, y: 28, size: 6.5, font: regular, color: GRAY });

  // Footer disclaimer
  const disclaimer = "Entrada válida para un solo uso. No compartas capturas ni este archivo PDF.";
  page.drawText(disclaimer, {
    x: 24,
    y: 12,
    size: 6,
    font: regular,
    color: GRAY,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
