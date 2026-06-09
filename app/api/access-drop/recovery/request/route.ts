import { NextResponse } from "next/server";
import { sendRecoveryOtpViaGmail } from "@/lib/gmailDelivery";
import { loadAllReceipts } from "@/lib/access-drop/receiptStore";
import { createRecoveryOtp, normalizeRecoveryEmail } from "@/lib/access-drop/recoveryStore";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { ApiError } from "@/lib/security";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  return email.length <= 80 && /^[a-z0-9._%+\-]{1,48}@[a-z0-9.\-]{2,40}\.[a-z]{2,12}$/.test(email);
}

function genericOk() {
  return NextResponse.json({
    success: true,
    message: "Si encontramos una entrada aprobada con ese correo, te enviaremos un codigo.",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; turnstileToken?: string };
    const email = normalizeRecoveryEmail(body.email || "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Correo invalido." }, { status: 400 });
    }

    await verifyTurnstileToken(request, body.turnstileToken, {
      variant: "invisible",
      action: "ticket_recovery",
    });

    const receipt = loadAllReceipts()
      .filter((item) => item.status === "aprobado" && item.serialNumber && normalizeRecoveryEmail(item.email || "") === email)
      .sort((a, b) => new Date(b.reviewedAt || b.createdAt).getTime() - new Date(a.reviewedAt || a.createdAt).getTime())[0];

    if (!receipt) return genericOk();

    const { code } = createRecoveryOtp(email, receipt.id);
    const result = await sendRecoveryOtpViaGmail(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: "No pudimos enviar el codigo ahora. Intenta de nuevo en unos minutos." },
        { status: 503 },
      );
    }

    return genericOk();
  } catch (error) {
    console.error("[RECOVERY] request error", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
