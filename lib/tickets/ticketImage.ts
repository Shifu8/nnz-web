import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { getEventDesignsServer } from "./designsServer";

export async function generateTicketQrPng(qrPayload: string): Promise<Buffer> {
  return QRCode.toBuffer(qrPayload, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#C8FF00", light: "#050505" },
  });
}

type TicketImageInput = {
  firstName: string;
  lastName: string;
  serialNumber: string;
  qrPayload: string;
  quantity: number;
  eventTitle?: string;
  eventCity?: string;
  eventDate?: string;
  ticketDesign?: string;
};

export async function generateTicketImage(ticket: TicketImageInput): Promise<Buffer> {
  // 1. Generate QR Code image (white background, black foreground for maximum scannability)
  const qrBuffer = await QRCode.toBuffer(ticket.qrPayload, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 170,
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  // 2. Determine event ID
  let eventId = "trap-loud";
  if (ticket.qrPayload) {
    try {
      const parsed = JSON.parse(ticket.qrPayload) as { eventId?: string };
      if (parsed.eventId) eventId = parsed.eventId;
    } catch {
      // fallback
    }
  }

  // Get selected design — supports both UUID string IDs and legacy numeric indices
  const designs = getEventDesignsServer(eventId);
  let selectedDesign = designs[0];
  if (ticket.ticketDesign) {
    // First try matching by UUID id (admin designs manager sends the design's `id`)
    const byId = designs.find((d) => d.id === ticket.ticketDesign);
    if (byId) {
      selectedDesign = byId;
    } else {
      // Fallback: treat as numeric index (legacy behaviour)
      const idx = parseInt(ticket.ticketDesign, 10);
      if (Number.isFinite(idx) && designs[idx]) {
        selectedDesign = designs[idx];
      }
    }
  }
  const accentColor = selectedDesign.accentColor || "#C8FF00";

  // Locate the public directory robustly
  let publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir) && path.basename(process.cwd()) === "frontend") {
    publicDir = path.join(path.dirname(process.cwd()), "public");
  }
  let currentSearch = process.cwd();
  for (let i = 0; i < 3; i++) {
    if (fs.existsSync(path.join(currentSearch, "public"))) {
      publicDir = path.join(currentSearch, "public");
      break;
    }
    currentSearch = path.dirname(currentSearch);
  }

  const bgPath = path.join(publicDir, selectedDesign.photo.replace(/^\//, ""));
  
  // Start with a solid premium dark container background
  const baseImageInput = await sharp({
    create: {
      width: 800,
      height: 1400,
      channels: 4,
      background: { r: 12, g: 12, b: 13, alpha: 1 } // #0c0c0d matches web dark tone
    }
  }).png().toBuffer();

  // Load the background photo and convert to base64 for embedding inside SVG
  let base64Photo = "";
  if (fs.existsSync(bgPath)) {
    try {
      const resizedPhoto = await sharp(bgPath)
        .resize(800, 1000, { fit: "cover" })
        .png()
        .toBuffer();
      base64Photo = resizedPhoto.toString("base64");
    } catch (err) {
      console.error(`[TICKET_IMAGE] Error resizing background image: ${err}`);
    }
  }

  // 3. Build high-fidelity SVG overlay representing the HD/4K design layout matching the mockup
  const holderName = `${ticket.firstName} ${ticket.lastName}`.trim().toUpperCase();
  const eventTitle = (ticket.eventTitle || "TRAP LOUD").toUpperCase();
  const eventCity = (ticket.eventCity || "LOJA").toUpperCase();
  const eventDate = (ticket.eventDate || "18 JUN 2026").toUpperCase();
  const serialText = ticket.serialNumber.toUpperCase();
  const badgeText = (selectedDesign.badge || "VIP ACCESS").toUpperCase();
  const artistName = selectedDesign.name.toUpperCase();

  const photoSvgElement = base64Photo
    ? `<image href="data:image/png;base64,${base64Photo}" x="0" y="0" width="800" height="1000" />`
    : "";

  const svgOverlay = Buffer.from(`
    <svg width="800" height="1400">
      <defs>
        <!-- Grid pattern -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
        </pattern>
        
        <!-- Photo dark gradient overlay -->
        <linearGradient id="photoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black" stop-opacity="0.5" />
          <stop offset="40%" stop-color="black" stop-opacity="0" />
          <stop offset="70%" stop-color="black" stop-opacity="0" />
          <stop offset="100%" stop-color="#09090b" stop-opacity="1" />
        </linearGradient>

        <!-- Ticket Card Clip Path to round all corners -->
        <clipPath id="cardClip">
          <rect x="0" y="0" width="800" height="1400" rx="36" />
        </clipPath>
      </defs>

      <!-- Main card group clipped to rounded card bounds -->
      <g clip-path="url(#cardClip)">
        <!-- Solid background -->
        <rect x="0" y="0" width="800" height="1400" fill="#09090b" />

        <!-- Embedded photo (if available) -->
        ${photoSvgElement}

        <!-- Fade gradient overlay -->
        <rect x="0" y="0" width="800" height="1000" fill="url(#photoGrad)" />

        <!-- Grid texture on the stub (from y=1000 to y=1400) -->
        <rect x="0" y="1000" width="800" height="400" fill="url(#grid)" />
      </g>

      <!-- Outer ticket thin border inside the card -->
      <rect x="1" y="1" width="798" height="1398" rx="35" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="2" />

      <!-- Styles -->
      <style>
        .text-brand { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 20px; letter-spacing: 4px; }
        .text-badge-txt { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: ${accentColor}; font-size: 11px; letter-spacing: 2px; text-anchor: middle; }
        
        .text-photo-subtitle { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #a1a1aa; font-size: 13px; letter-spacing: 2.5px; }
        .text-photo-title { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 34px; letter-spacing: -0.5px; }

        .details-label { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 700; fill: #52525b; font-size: 9px; letter-spacing: 1.5px; }
        .details-val { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 12px; letter-spacing: 0.5px; }
        .details-val-large { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 16px; letter-spacing: 0.5px; }
        .text-serial { font-family: 'Courier New', monospace; font-weight: 900; fill: ${accentColor}; font-size: 10px; letter-spacing: 1.5px; text-anchor: middle; }
      </style>

      <!-- Top Header Row -->
      <!-- NENEZ Text -->
      <text x="50" y="92" class="text-brand">NENEZ</text>
      
      <!-- VIP ACCESS badge -->
      <rect x="570" y="60" width="180" height="36" rx="6" fill="#18181b" fill-opacity="0.45" stroke="${accentColor}40" stroke-width="1.5" />
      <text x="660" y="83" class="text-badge-txt">${badgeText}</text>

      <!-- Bottom of the photo artist metadata -->
      <text x="50" y="890" class="text-photo-subtitle">${eventTitle}</text>
      <text x="50" y="945" class="text-photo-title">${artistName}</text>

      <!-- Perforated Dash Divider with left/right notch cutouts -->
      <circle cx="0" cy="1000" r="16" fill="#0c0c0d" />
      <circle cx="800" cy="1000" r="16" fill="#0c0c0d" />
      <line x1="16" y1="1000" x2="784" y2="1000" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2" stroke-dasharray="10 10" />

      <!-- Stub Section Details -->
      <!-- QR code background frame -->
      <rect x="305" y="1025" width="190" height="190" rx="20" fill="#18181b" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1.5" />
      <rect x="315" y="1035" width="170" height="170" rx="14" fill="#ffffff" />

      <!-- Holder details -->
      <text x="400" y="1242" class="details-label" text-anchor="middle">PASS HOLDER</text>
      <text x="400" y="1268" class="details-val-large" text-anchor="middle">${holderName} (${ticket.quantity}x)</text>

      <!-- Left: Event details -->
      <text x="50" y="1302" class="details-label">EVENT</text>
      <text x="50" y="1324" class="details-val">${eventTitle}</text>

      <!-- Right: Date and location details -->
      <text x="750" y="1302" class="details-label" text-anchor="end">DATE &amp; PLACE</text>
      <text x="750" y="1324" class="details-val" text-anchor="end">${eventDate} - ${eventCity}</text>

      <!-- Bottom: Serial badge -->
      <rect x="250" y="1345" width="300" height="38" rx="8" fill="#141416" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
      <text x="400" y="1369" class="text-serial">${serialText}</text>
    </svg>
  `);

  // 4. Composite the SVG overlay and the QR code onto the ticket card
  return await sharp(baseImageInput)
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: qrBuffer, top: 1035, left: 315 } // Place QR code inside the white box
    ])
    .png()
    .toBuffer();
}
