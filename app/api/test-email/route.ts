import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";
import { secureLog } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { to, subject, message } = await request.json().catch(() => ({}));

    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
    const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || "";

    if (!user || !pass) {
      return NextResponse.json(
        { success: false, error: "SMTP_USER o SMTP_PASS no configurados en .env.local" },
        { status: 400 },
      );
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);

    const transport = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || `DAWGS <${user}>`,
      to: to || user,
      subject: subject || "DAWGS — prueba de email",
      html: message || "<p>Si recibes esto, el email funciona correctamente.</p>",
    });

    secureLog("[TEST-EMAIL] Sent", { messageId: info.messageId });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    secureLog("[TEST-EMAIL] Error", { error: msg });

    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || "";

  return NextResponse.json({
    configured: Boolean(user && pass),
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: user ? `${user.slice(0, 3)}...${user.slice(-5)}` : null,
    from: process.env.SMTP_FROM || `DAWGS <${user}>`,
  });
}
