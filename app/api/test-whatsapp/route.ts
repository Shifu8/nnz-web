import { NextResponse } from "next/server";
import { secureLog } from "@/lib/security";
import { sendWhatsAppText } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json().catch(() => ({}));

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Debes enviar un n\u00famero de tel\u00e9fono en el body: { phone: '+593XXXXXXXXX' }" },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppText(
      phone,
      `NENEZ — Mensaje de prueba\n\nSi recibes esto, WhatsApp Baileys est\u00e1 configurado correctamente.`,
    );

    if (!result.success) {
      secureLog("[TEST-WHATSAPP] Error", { error: result.error });
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    secureLog("[TEST-WHATSAPP] Queued", {
      messageId: result.messageId,
      normalizedPhone: result.normalizedPhone,
    });

    return NextResponse.json({
      success: true,
      status: "queued",
      messageId: result.messageId,
      normalizedPhone: result.normalizedPhone,
      backend: "baileys",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    secureLog("[TEST-WHATSAPP] Error", { error: msg });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
