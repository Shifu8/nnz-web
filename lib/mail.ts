import nodemailer from "nodemailer";
import { secureLog } from "./security";

export type TicketPass = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  transactionId: string;
  serialNumber: string;
};

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; encoding?: string }[];
};

function createTransport() {
  const host = process.env.SMTP_HOST || "in-v3.mailjet.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || process.env.MAILJET_API_KEY || "";
  const pass = process.env.SMTP_PASS || process.env.MAILJET_SECRET_KEY || "";

  if (!user || !pass) {
    throw new Error(
      "Mailjet SMTP no configurado. Revisa SMTP_USER y SMTP_PASS en .env.local",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function fromAddress(): string {
  return process.env.MAILJET_FROM_EMAIL || "DAWGS <tickets@dawgswear.com>";
}

async function sendMail(options: MailOptions) {
  const transport = createTransport();
  const info = await transport.sendMail({
    from: fromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      encoding: a.encoding || "base64",
    })),
  });
  secureLog("[MAILJET] Email sent", { to: options.to, messageId: info.messageId });
  return info;
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>DAWGS</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <tr>
            <td style="background:linear-gradient(180deg,#0a0a0a 0%,#050505 100%);border:1px solid rgba(200,255,0,0.15);border-radius:24px;padding:32px 24px;box-shadow:0 0 80px rgba(200,255,0,0.04);">
              ${body}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#C8FF00;">DAWGS</p>
                    <p style="margin:8px 0 0;font-size:10px;color:#555;letter-spacing:1px;">underground access</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── TEMPLATES ─── */

export function ticketEmailHtml(
  pass: TicketPass,
  qrDataUri: string,
  resend = false,
): string {
  const title = resend
    ? "REENVÍO DE TU PASE DAWGS"
    : "TU PASE VIP DAWGS TRAP LOUD";
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding-bottom:20px;">
          <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#C8FF00;">DAWGS</p>
          <h1 style="color:#fff;font-size:22px;font-weight:900;letter-spacing:1px;margin:12px 0 0;text-transform:uppercase;">${title}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0;font-size:14px;color:#ccc;">Hola <strong style="color:#fff;">${pass.firstName} ${pass.lastName}</strong>,</p>
          <p style="margin:8px 0 0;font-size:13px;color:#999;">Tu acceso DAWGS está listo.</p>
          <p style="margin:4px 0 0;font-size:11px;color:#888;">Serial: <strong style="color:#C8FF00;letter-spacing:2px;">${pass.serialNumber}</strong></p>
        </td>
      </tr>
      <tr>
        <td style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;text-align:center;">
          <img src="${qrDataUri}" alt="QR DAWGS" width="260" height="260" style="display:block;margin:0 auto;border-radius:8px;outline:2px solid rgba(200,255,0,0.15);outline-offset:4px;" />
          <p style="margin:16px 0 0;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#C8FF00;">TRAP LOUD · 18 JUN 2026 · SAN JUAN</p>
          <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#555;">cuenca · ecuador</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 0 0;">
          <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">Presenta este QR en puerta. Cada código funciona <strong style="color:#ff4444;">una sola vez</strong>.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#666;text-align:center;">No compartas este código en redes sociales ni chats.</p>
        </td>
      </tr>
    </table>
  `;
  return wrapHtml(body);
}

export function purchaseConfirmationHtml(pass: TicketPass): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding-bottom:16px;">
          <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#C8FF00;">DAWGS</p>
          <h1 style="color:#fff;font-size:20px;font-weight:900;margin:12px 0 0;text-transform:uppercase;">COMPRA CONFIRMADA</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0;font-size:14px;color:#ccc;">Gracias <strong style="color:#fff;">${pass.firstName} ${pass.lastName}</strong>,</p>
          <p style="margin:8px 0 0;font-size:13px;color:#999;">Tu pago fue aprobado y tu ticket ha sido generado.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin:8px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;">
                <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Ticket</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#C8FF00;letter-spacing:1px;">TRAP LOUD</p>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Serial</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;">${pass.serialNumber}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Fecha</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#fff;">18 JUN 2026</p>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Lugar</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#fff;">San Juan · Cuenca, Ecuador</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaa;">Revisa tu ticket QR en el siguiente correo o descárgalo desde tu panel.</p>
        </td>
      </tr>
    </table>
  `;
  return wrapHtml(body);
}

export function giveawayWinnerHtml(params: {
  firstName: string;
  prize: string;
  code?: string;
}): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding-bottom:16px;">
          <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#C8FF00;">DAWGS</p>
          <h1 style="color:#fff;font-size:20px;font-weight:900;margin:12px 0 0;text-transform:uppercase;">¡FELICIDADES!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0;font-size:14px;color:#ccc;">Hola <strong style="color:#fff;">${params.firstName}</strong>,</p>
          <p style="margin:8px 0 0;font-size:13px;color:#999;">Has ganado en el sorteo DAWGS.</p>
        </td>
      </tr>
      <tr>
        <td style="background:linear-gradient(135deg,#0a0a0a,#111);border:1px solid rgba(200,255,0,0.15);border-radius:16px;padding:24px;text-align:center;">
          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#666;">Premio</p>
          <p style="margin:8px 0 0;font-size:18px;font-weight:900;color:#C8FF00;letter-spacing:1px;">${params.prize}</p>
          ${params.code ? `<p style="margin:12px 0 0;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;background:#050505;display:inline-block;padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);">CÓDIGO: ${params.code}</p>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaa;">Te contactaremos pronto con los detalles para reclamar tu premio.</p>
        </td>
      </tr>
    </table>
  `;
  return wrapHtml(body);
}

export function supportEmailHtml(params: {
  name: string;
  message: string;
  ticketSerial?: string;
}): string {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding-bottom:16px;">
          <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#C8FF00;">DAWGS</p>
          <h1 style="color:#fff;font-size:18px;font-weight:900;margin:12px 0 0;">SOPORTE DAWGS</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0;font-size:13px;color:#ccc;">Hola <strong style="color:#fff;">${params.name}</strong>,</p>
          <p style="margin:8px 0 0;font-size:12px;color:#999;">Hemos recibido tu solicitud y te responderemos a la brevedad.</p>
          ${params.ticketSerial ? `<p style="margin:6px 0 0;font-size:11px;color:#888;">Ticket relacionado: <strong style="color:#C8FF00;">${params.ticketSerial}</strong></p>` : ""}
        </td>
      </tr>
      <tr>
        <td style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;">
          <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Tu mensaje</p>
          <p style="margin:8px 0 0;font-size:12px;color:#ccc;line-height:1.5;">${params.message}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#555;">Equipo DAWGS — underground access</p>
        </td>
      </tr>
    </table>
  `;
  return wrapHtml(body);
}

/* ─── PUBLIC SENDERS ─── */

export async function sendTicketEmail(
  to: string,
  pass: TicketPass,
  qrDataUri: string,
  resend = false,
): Promise<void> {
  await sendMail({
    to,
    subject: resend
      ? "🎟️ Reenvío de tu pase DAWGS Trap Loud"
      : "🎟️ Tu pase DAWGS Trap Loud",
    html: ticketEmailHtml(pass, qrDataUri, resend),
  });
}

export async function sendPurchaseConfirmationEmail(
  to: string,
  pass: TicketPass,
): Promise<void> {
  await sendMail({
    to,
    subject: "✅ Compra confirmada — DAWGS Trap Loud",
    html: purchaseConfirmationHtml(pass),
  });
}

export async function sendGiveawayWinnerEmail(
  to: string,
  params: { firstName: string; prize: string; code?: string },
): Promise<void> {
  await sendMail({
    to,
    subject: "🎉 ¡Ganaste en el sorteo DAWGS!",
    html: giveawayWinnerHtml(params),
  });
}

export async function sendSupportEmail(
  to: string,
  params: { name: string; message: string; ticketSerial?: string },
): Promise<void> {
  await sendMail({
    to,
    subject: "📬 Hemos recibido tu solicitud — DAWGS Soporte",
    html: supportEmailHtml(params),
  });
}

export async function sendRawEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await sendMail(options);
}

export function getMailjetDiagnostics() {
  return {
    configured: Boolean(
      (process.env.SMTP_USER || process.env.MAILJET_API_KEY) &&
        (process.env.SMTP_PASS || process.env.MAILJET_SECRET_KEY),
    ),
    from: fromAddress(),
    host: process.env.SMTP_HOST || "in-v3.mailjet.com",
  };
}

export function isMailjetConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_USER || process.env.MAILJET_API_KEY) &&
      (process.env.SMTP_PASS || process.env.MAILJET_SECRET_KEY),
  );
}
