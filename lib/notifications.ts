import { secureLog } from "./security";
import { generateTicketQrPng } from "./tickets/ticketImage";
import { ticketImagePublicUrl } from "./tickets/ticketImageToken";
import { loadAllEvents } from "./admin/events-store";

export function createWhatsAppDeepLink(phone: string, serialNumber: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=NENEZ%20TRAP%20LOUD%20-%20Mi%20entrada%20es%20${serialNumber}`;
}

export type DeliveryChannel = "whatsapp";

export type DeliveryResult = {
  success: boolean;
  sentTo?: string;
  warnings: string[];
  waLink?: string;
};

export type TicketPass = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  transactionId: string;
  serialNumber: string;
};

export async function sendTicketNotifications(pass: TicketPass, qrPayload: string): Promise<DeliveryResult> {
  const result: DeliveryResult = { success: false, warnings: [] };
  const waLink = createWhatsAppDeepLink(pass.phone, pass.serialNumber);
  result.waLink = waLink;

  if (!pass.phone) {
    result.warnings.push("Sin teléfono en el ticket.");
    return result;
  }

  return result;
}

export async function resendTicketNotifications(
  email: string,
  phone: string,
  pass: TicketPass,
  qrPayload: string,
): Promise<DeliveryResult> {
  const resolved: TicketPass = {
    ...pass,
    email: email || pass.email,
    phone: phone || pass.phone,
  };
  return sendTicketNotifications(resolved, qrPayload);
}

export function getNotificationsDiagnostics() {
  return {
    whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    whatsappTokenPreview: process.env.WHATSAPP_ACCESS_TOKEN
      ? `${process.env.WHATSAPP_ACCESS_TOKEN.slice(0, 8)}...`
      : "",
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    publicTicketUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
  };
}
