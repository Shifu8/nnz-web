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
    width: 220,
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
  const darkBgBuffer = await sharp({
    create: {
      width: 800,
      height: 1400,
      channels: 4,
      background: { r: 12, g: 12, b: 13, alpha: 1 }
    }
  }).png().toBuffer();

  let baseImageInput: Buffer;

  if (fs.existsSync(bgPath)) {
    try {
      // Scale artist photo to 800x1400 cover and blend it softly as a background texture watermark
      const resizedPhoto = await sharp(bgPath)
        .resize(800, 1400, { fit: "cover" })
        .toBuffer();

      baseImageInput = await sharp(darkBgBuffer)
        .composite([
          {
            input: resizedPhoto,
            blend: "over",
            opacity: 0.18
          } as any
        ])
        .png()
        .toBuffer();
    } catch (err) {
      console.error(`[TICKET_IMAGE] Error blending background image: ${err}`);
      baseImageInput = darkBgBuffer;
    }
  } else {
    console.warn(`[TICKET_IMAGE] Background image not found at: ${bgPath}. Using black fallback.`);
    baseImageInput = darkBgBuffer;
  }

  // 3. Build high-fidelity SVG overlay representing the HD/4K design layout matching the mockup
  const holderName = `${ticket.firstName} ${ticket.lastName}`.trim().toUpperCase();
  const eventTitle = (ticket.eventTitle || "TRAP LOUD").toUpperCase();
  const eventCity = (ticket.eventCity || "LOJA").toUpperCase();
  const eventDate = (ticket.eventDate || "18 JUN 2026").toUpperCase();
  const serialText = ticket.serialNumber.toUpperCase();
  const badgeText = (selectedDesign.badge || "VIP ACCESS").toUpperCase();
  const artistName = selectedDesign.name.toUpperCase();

  const svgOverlay = Buffer.from(`
    <svg width="800" height="1400">
      <defs>
        <!-- Grid pattern -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
        </pattern>
        
        <!-- Circle neon glow -->
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="25" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <!-- QR code border glow -->
        <filter id="qrGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Grid texture overlay -->
      <rect width="800" height="1400" fill="url(#grid)" />
      
      <!-- Outer ticket thin border -->
      <rect x="20" y="20" width="760" height="1360" rx="36" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="1.5" />

      <!-- Styles -->
      <style>
        .text-brand { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 19px; letter-spacing: 3px; }
        .text-header-access { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: ${accentColor}; font-size: 19px; letter-spacing: 3px; }
        .text-badge-txt { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ef4444; font-size: 13px; letter-spacing: 2.5px; text-anchor: middle; }
        
        .box-label { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 700; fill: #52525b; font-size: 10px; letter-spacing: 2px; }
        .box-val { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 16px; letter-spacing: 0.5px; }
        .box-val-accent { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: ${accentColor}; font-size: 16px; letter-spacing: 0.5px; }
        
        .text-circle-brand { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #000000; font-size: 38px; letter-spacing: 4px; }
        .text-circle-pass { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 700; fill: #000000; font-size: 16px; letter-spacing: 3px; }
        .text-circle-feat { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #000000; font-size: 18px; letter-spacing: 1px; }
        .text-circle-lbl { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 700; fill: rgba(0, 0, 0, 0.55); font-size: 9.5px; letter-spacing: 1px; }
        .text-circle-holder { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #000000; font-size: 18px; letter-spacing: 0.5px; }
        .text-circle-live { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 800; fill: #000000; font-size: 12.5px; letter-spacing: 1.5px; }
        .text-circle-vip { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 700; fill: rgba(0, 0, 0, 0.45); font-size: 8.5px; letter-spacing: 1px; }

        .details-label { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 700; fill: #52525b; font-size: 12px; letter-spacing: 2px; }
        .details-val { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 900; fill: #ffffff; font-size: 20px; letter-spacing: 1px; }
        .text-serial { font-family: 'Courier New', monospace; font-weight: 900; fill: ${accentColor}; font-size: 14px; letter-spacing: 2px; text-anchor: middle; }
        
        .footer-disclaimer { font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 800; fill: #3f3f46; font-size: 11px; letter-spacing: 3px; text-anchor: middle; }
      </style>

      <!-- Top Header Row -->
      <!-- Green dot -->
      <circle cx="60" cy="85" r="7" fill="${accentColor}" />
      <!-- VIP ACCESSO text -->
      <text x="85" y="92" class="text-header-access">NENEZ VIP ACCESS</text>
      <!-- Estricto box -->
      <rect x="580" y="63" width="160" height="42" rx="21" fill="none" stroke="#ef4444" stroke-width="1.5" />
      <text x="660" y="89" class="text-badge-txt">ESTRICTO</text>

      <!-- Left Boxes -->
      <!-- Event Type Box (Show Artist) -->
      <rect x="60" y="200" width="260" height="96" rx="18" fill="#141416" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <text x="84" y="235" class="box-label">EVENT TYPE</text>
      <text x="84" y="270" class="box-val">SHOW ${artistName}</text>

      <!-- Access Level Box -->
      <rect x="60" y="324" width="260" height="96" rx="18" fill="#141416" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <text x="84" y="359" class="box-label">ACCESO</text>
      <text x="84" y="394" class="box-val-accent">${badgeText}</text>

      <!-- Right Glowing Circle -->
      <!-- Glow halo backing -->
      <circle cx="560" cy="360" r="185" fill="${accentColor}" filter="url(#glow)" opacity="0.22" />
      <!-- Main solid circle -->
      <circle cx="560" cy="360" r="172" fill="${accentColor}" />
      
      <!-- Circle Texts -->
      <text x="560" y="268" text-anchor="middle" class="text-circle-brand">NENEZ</text>
      <text x="560" y="306" text-anchor="middle" class="text-circle-pass">PARTY PASS</text>
      
      <text x="560" y="348" text-anchor="middle" class="text-circle-feat">FEAT. ${artistName}</text>
      
      <text x="560" y="386" text-anchor="middle" class="text-circle-lbl">PERFORMED BY:</text>
      <text x="560" y="415" text-anchor="middle" class="text-circle-holder">${holderName}</text>
      
      <text x="560" y="455" text-anchor="middle" class="text-circle-live">LIVE FROM ${eventCity}</text>
      <text x="560" y="488" text-anchor="middle" class="text-circle-vip">* VIP ACCESS ONLY *</text>

      <!-- Perforated Dash Divider -->
      <line x1="60" y1="880" x2="740" y2="880" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="10 10" />

      <!-- Bottom-Left QR code glow frame -->
      <rect x="58" y="938" width="244" height="244" rx="34" fill="none" stroke="${accentColor}" stroke-width="4" filter="url(#qrGlow)" opacity="0.3" />
      <rect x="58" y="938" width="244" height="244" rx="34" fill="none" stroke="${accentColor}" stroke-width="4" />
      <!-- White background inside QR container -->
      <rect x="70" y="950" width="220" height="220" rx="20" fill="#ffffff" />

      <!-- Bottom-Right Metadata Details -->
      <!-- Holder -->
      <text x="740" y="974" text-anchor="end" class="details-label">HOLDER</text>
      <text x="740" y="1005" text-anchor="end" class="details-val">${holderName} (${ticket.quantity}x)</text>

      <!-- Event -->
      <text x="740" y="1064" text-anchor="end" class="details-label">EVENT</text>
      <text x="740" y="1095" text-anchor="end" class="details-val">${eventTitle}</text>

      <!-- Date & Place -->
      <text x="740" y="1154" text-anchor="end" class="details-label">DATE &amp; PLACE</text>
      <text x="740" y="1185" text-anchor="end" class="details-val">${eventDate} - ${eventCity}</text>

      <!-- Serial badge -->
      <rect x="420" y="1234" width="320" height="74" rx="14" fill="#141416" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <text x="580" y="1278" class="text-serial">${serialText}</text>

      <!-- Very Bottom Disclaimer -->
      <text x="400" y="1364" class="footer-disclaimer">* MANTENER EN SEGURO • ESCANEAR AL INGRESAR *</text>
    </svg>
  `);

  // 4. Composite the SVG overlay and the QR code onto the ticket card
  return await sharp(baseImageInput)
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: qrBuffer, top: 950, left: 70 } // Place QR code inside the white box
    ])
    .png()
    .toBuffer();
}
