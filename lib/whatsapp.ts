import { secureLog } from "./security";

const BACKEND_URL = process.env.BACKEND_URL || process.env.RAILWAY_BACKEND_URL || "http://localhost:4000";
const BACKEND_API_KEY = process.env.WHATSAPP_API_KEY || "";

export type WhatsAppResult = {
  success: boolean;
  error?: string;
  messageId?: string;
  queued?: boolean;
  normalizedPhone?: string;
};

export function normalizeEcuadorMobile(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("5930")) {
    digits = `593${digits.slice(4)}`;
  } else if (digits.startsWith("0")) {
    digits = `593${digits.slice(1)}`;
  } else if (!digits.startsWith("593")) {
    digits = `593${digits}`;
  }

  if (!/^5939\d{8}$/.test(digits)) return null;
  return `+${digits}`;
}

async function sendViaBaileysBackend(phone: string, text: string, imageUrl?: string): Promise<WhatsAppResult | null> {
  if (!BACKEND_URL) return null;
  const normalizedPhone = normalizeEcuadorMobile(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Numero celular ecuatoriano invalido" };
  }

  try {
    const body: Record<string, unknown> = { phone: normalizedPhone, text };
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
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      const error = data.message || data.error || `Baileys backend error: ${res.status}`;
      secureLog("[WHATSAPP] Baileys backend error", {
        status: res.status,
        phone: normalizedPhone,
        error,
      });
      return { success: false, error, normalizedPhone };
    }
    const data = (await res.json()) as {
      queueId?: string;
      normalizedPhone?: string;
      queueLength?: number;
    };
    secureLog("[WHATSAPP] Baileys backend queued", {
      phone: normalizedPhone,
      queueId: data.queueId,
      queueLength: data.queueLength,
    });
    return {
      success: true,
      queued: true,
      messageId: data.queueId || `baileys-queue-${Date.now()}`,
      normalizedPhone: data.normalizedPhone || normalizedPhone.replace(/^\+/, ""),
    };
  } catch {
    secureLog("[WHATSAPP] Baileys backend unreachable", { phone });
    return null;
  }
}

async function sendDocumentViaBaileysBackend(phone: string, text: string, filePath: string, fileName: string): Promise<WhatsAppResult | null> {
  if (!BACKEND_URL) return null;
  const normalizedPhone = normalizeEcuadorMobile(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Numero celular ecuatoriano invalido" };
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (BACKEND_API_KEY) headers["x-api-key"] = BACKEND_API_KEY;
    const res = await fetch(`${BACKEND_URL}/api/whatsapp/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone: normalizedPhone, text, filePath, fileName }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      const error = data.message || data.error || `Baileys backend error: ${res.status}`;
      secureLog("[WHATSAPP] Baileys document backend error", {
        status: res.status,
        phone: normalizedPhone,
        error,
      });
      return { success: false, error, normalizedPhone };
    }
    const data = (await res.json()) as { queueId?: string; normalizedPhone?: string };
    secureLog("[WHATSAPP] Baileys document queued", {
      phone: normalizedPhone,
      fileName,
      queueId: data.queueId,
    });
    return {
      success: true,
      queued: true,
      messageId: data.queueId || `baileys-doc-${Date.now()}`,
      normalizedPhone: data.normalizedPhone || normalizedPhone.replace(/^\+/, ""),
    };
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
  const caption = `NENEZ TRAP LOUD\n\nHola ${firstName}, tu entrada está lista.\n\nSerial: ${serialNumber}\n\nPresenta el PDF adjunto en puerta. Válido una sola vez.`;

  const result = await sendDocumentViaBaileysBackend(phone, caption, pdfPath, `entrada-${serialNumber}.pdf`);
  if (!result) return { success: false, error: "Baileys backend not configured (BACKEND_URL missing)" };
  return result;
}

export async function sendRejectionViaWhatsApp(
  phone: string,
  firstName: string,
  reasonLabel: string,
): Promise<WhatsAppResult> {
  const message = `NENEZ TRAP LOUD\n\nHola ${firstName}, tu comprobante fue revisado pero lamentamos informarte que tu pago no ha sido aprobado.\n\nMotivo: ${reasonLabel}\n\nSi tienes dudas, contáctanos.`;
  const result = await sendViaBaileysBackend(phone, message);
  return result ?? { success: false, error: "Baileys backend not configured" };
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppResult> {
  const result = await sendViaBaileysBackend(phone, message);
  return result ?? { success: false, error: "Baileys backend not configured" };
}

export function createWhatsAppLink(phone: string, text?: string): string {
  const to = normalizeEcuadorMobile(phone)?.replace(/^\+/, "") || "";
  const url = `https://wa.me/${to}`;
  if (text) return `${url}?text=${encodeURIComponent(text)}`;
  return url;
}

export function createWhatsAppDeepLink(phone: string, serialNumber: string): string {
  return createWhatsAppLink(phone, `Hola NENEZ, mi código es ${serialNumber}`);
}
