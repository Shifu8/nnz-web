import { NextResponse } from "next/server";
import { getGmailDeliveryDiagnostics } from "@/lib/gmailDelivery";
import { getSupabaseDiagnostics } from "@/lib/supabase";

export const runtime = "nodejs";

const backendUrl =
  process.env.BACKEND_URL || process.env.RAILWAY_BACKEND_URL || "http://localhost:4000";

async function getWhatsAppDiagnostics() {
  try {
    const response = await fetch(`${backendUrl}/api/whatsapp/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      reachable: response.ok,
      backendUrl,
      status: data.status || "unknown",
      isConnected: Boolean(data.isConnected),
      isReady: Boolean(data.isReady),
      phone: data.phone || null,
      queue: data.queue || null,
    };
  } catch {
    return {
      reachable: false,
      backendUrl,
      status: "unreachable",
      isConnected: false,
      isReady: false,
      phone: null,
      queue: null,
    };
  }
}

export async function GET() {
  const email = getGmailDeliveryDiagnostics();
  const supabase = getSupabaseDiagnostics();
  const whatsapp = await getWhatsAppDiagnostics();

  return NextResponse.json({
    email,
    supabase,
    whatsapp,
    publicTicketUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
    ready: email.configured && whatsapp.isReady,
    hints: [
      !email.configured &&
        "Configura Gmail API o SMTP_USER y SMTP_PASS con una contrasena de aplicacion.",
      !supabase.configured &&
        "Supabase no esta configurado; en local se usara data/ticket-recovery.json.",
      !whatsapp.reachable &&
        `Inicia el backend de WhatsApp y verifica BACKEND_URL (${backendUrl}).`,
      whatsapp.reachable &&
        !whatsapp.isReady &&
        "El backend responde, pero WhatsApp aun no esta autenticado o estabilizado.",
      !process.env.NEXT_PUBLIC_SITE_URL &&
        "Configura NEXT_PUBLIC_SITE_URL con la URL HTTPS publica antes de produccion.",
    ].filter(Boolean),
  });
}
