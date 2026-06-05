import { NextResponse } from "next/server";
import { normalizeRecoveryEmail, verifyRecoveryOtp } from "@/lib/access-drop/recoveryStore";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function errorMessage(reason?: string): string {
  if (reason === "expired") return "El codigo expiro. Pide uno nuevo.";
  if (reason === "locked") return "Se agotaron los intentos. Pide un codigo nuevo.";
  return "Codigo incorrecto.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; code?: string };
    const email = normalizeRecoveryEmail(body.email || "");
    const code = (body.code || "").replace(/\D/g, "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Correo invalido." }, { status: 400 });
    }

    if (code.length !== 6) {
      return NextResponse.json({ error: "Escribe el codigo de 6 digitos." }, { status: 400 });
    }

    const result = verifyRecoveryOtp(email, code);
    if (!result.ok || !result.token) {
      return NextResponse.json({ error: errorMessage(result.reason) }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Verificacion completada",
      downloadUrl: `/api/access-drop/recovery/download?token=${encodeURIComponent(result.token)}`,
      expiresAt: result.downloadExpiresAt,
    });
  } catch (error) {
    console.error("[RECOVERY] verify error", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
