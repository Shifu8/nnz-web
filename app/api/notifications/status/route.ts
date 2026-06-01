import { NextResponse } from "next/server";
import { getNotificationsDiagnostics } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET() {
  const d = getNotificationsDiagnostics();
  return NextResponse.json({
    WhatsApp: d.whatsapp,
    phoneNumberId: d.whatsappPhoneNumberId,
    tokenPreview: d.whatsappTokenPreview,
    verifyToken: d.whatsappVerifyToken,
    publicTicketUrl: d.publicTicketUrl,
    hints: [
      !d.whatsapp && "A\u00f1ade WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID (Meta WhatsApp Cloud API).",
      !d.publicTicketUrl &&
        "NEXT_PUBLIC_SITE_URL debe ser HTTPS p\u00fablico para URLs de tickets (no localhost).",
    ].filter(Boolean),
  });
}
