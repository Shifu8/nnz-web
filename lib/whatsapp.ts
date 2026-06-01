import { secureLog } from "./security";

const BACKEND_URL = process.env.BACKEND_URL || process.env.RAILWAY_BACKEND_URL || "http://localhost:4000";
const BACKEND_API_KEY = process.env.WHATSAPP_API_KEY || "";

export type WhatsAppResult = {
  success: boolean;
  error?: string;
  messageId?: string;
};

function ecuadorPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+")) return phone;
  if (digits.startsWith("593")) return `+${digits}`;
  if (digits.startsWith("0")) return `+593${digits.slice(1)}`;
  return `+593${digits}`;
}

async function sendViaBaileysBackend(phone: string, text: string, imageUrl?: string): Promise<WhatsAppResult | null> {
  if (!BACKEND_URL) return null;
  try {
    const body: Record<string, unknown> = { phone: ecuadorPhoneE164(phone), text };
    if (imageUrl) body.imageUrl = imageUrl;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (BACKEND_API_KEY) headers["x-api-key"] = BACKEND_API_KEY;
    const res = await fetch(`${BACKEND_URL}/api/whatsapp/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      secureLog("[WHATSAPP] Baileys backend error", { status: res.status, phone });
      return null;
    }
    const data = await res.json();
    secureLog("[WHATSAPP] Baileys backend queued", { phone, queueLength: data.queueLength });
    return { success: true, messageId: `baileys-queue-${Date.now()}` };
  } catch {
    secureLog("[WHATSAPP] Baileys backend unreachable", { phone });
    return null;
  }
}

async function sendDocumentViaBaileysBackend(phone: string, text: string, filePath: string, fileName: string): Promise<WhatsAppResult | null> {
  if (!BACKEND_URL) return null;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (BACKEND_API_KEY) headers["x-api-key"] = BACKEND_API_KEY;
    const res = await fetch(`${BACKEND_URL}/api/whatsapp/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone: ecuadorPhoneE164(phone), text, filePath, fileName }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      secureLog("[WHATSAPP] Baileys document backend error", { status: res.status, phone });
      return { success: false, error: `Baileys backend error: ${res.status}` };
    }
    secureLog("[WHATSAPP] Baileys document queued", { phone, fileName });
    return { success: true, messageId: `baileys-doc-${Date.now()}` };
  } catch {
    secureLog("[WHATSAPP] Baileys backend unreachable for document", { phone });
    return { success: false, error: "Baileys backend unreachable" };
  }
}

export async function sendTicketPdfViaWhatsApp(
  phone: string,
  firstName: string,
  serialNumber: string,
  pdfPath: string,
): Promise<WhatsAppResult> {
  const caption = `DAWGS TRAP LOUD\n\nHola ${firstName}, tu entrada está lista.\n\nSerial: ${serialNumber}\n\nPresenta el PDF adjunto en puerta. Válido una sola vez.`;

  const result = await sendDocumentViaBaileysBackend(phone, caption, pdfPath, `entrada-${serialNumber}.pdf`);
  if (!result) return { success: false, error: "Baileys backend not configured (BACKEND_URL missing)" };
  return result;
}

export async function sendRejectionViaWhatsApp(
  phone: string,
  firstName: string,
  reasonLabel: string,
): Promise<WhatsAppResult> {
  const message = `DAWGS TRAP LOUD\n\nHola ${firstName}, tu comprobante fue revisado pero lamentamos informarte que tu pago no ha sido aprobado.\n\nMotivo: ${reasonLabel}\n\nSi tienes dudas, contáctanos.`;
  const result = await sendViaBaileysBackend(phone, message);
  return result ?? { success: false, error: "Baileys backend not configured" };
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppResult> {
  const result = await sendViaBaileysBackend(phone, message);
  return result ?? { success: false, error: "Baileys backend not configured" };
}

export function createWhatsAppLink(phone: string, text?: string): string {
  const to = ecuadorPhoneE164(phone).replace(/^\+/, "");
  const url = `https://wa.me/${to}`;
  if (text) return `${url}?text=${encodeURIComponent(text)}`;
  return url;
}

export function createWhatsAppDeepLink(phone: string, serialNumber: string): string {
  return createWhatsAppLink(phone, `Hola DAWGS, mi código es ${serialNumber}`);
}
