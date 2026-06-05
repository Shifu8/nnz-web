import { NextResponse } from "next/server";
import { sendRecoveryOtpViaGmail } from "@/lib/gmailDelivery";
import { loadAllReceipts } from "@/lib/access-drop/storage";
import { createRecoveryOtp, normalizeRecoveryEmail } from "@/lib/access-drop/recoveryStore";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function genericOk() {
  return NextResponse.json({
    success: true,
    message: "Si encontramos una entrada aprobada con ese correo, te enviaremos un codigo.",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = normalizeRecoveryEmail(body.email || "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Correo invalido." }, { status: 400 });
    }

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
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
