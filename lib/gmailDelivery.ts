import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createTransport } from "nodemailer";
import { secureLog } from "./security";

const GMAIL_USAGE_PATH = path.join(process.cwd(), "data", "gmail-usage.json");
const DEFAULT_GMAIL_USER = "soporte.nenez@gmail.com";

type GmailUsageFile = Record<
  string,
  {
    date: string;
    sent: number;
    updatedAt: string;
  }
>;

export type GmailDeliveryResult = {
  attempted: boolean;
  success: boolean;
  reason?: string;
  messageId?: string;
  sentToday: number;
  dailyLimit: number;
};

type TicketPdfEmailInput = {
  to: string;
  firstName: string;
  lastName: string;
  serialNumber: string;
  quantity: number;
  pdfBuffer: Buffer | Buffer[];
  eventTitle?: string;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
  eventId?: string;
};

type GmailAttachment = {
  filename: string;
  contentType: string;
  content: Buffer;
  cid?: string;
};

type GmailMessageInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: GmailAttachment[];
  logLabel?: string;
};

function gmailUser(): string {
  return (
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    process.env.GMAIL_SENDER_EMAIL ||
    DEFAULT_GMAIL_USER
  )
    .trim()
    .toLowerCase();
}

function gmailFrom(): string {
  return process.env.GMAIL_FROM || process.env.SMTP_FROM || `NENEZ <${gmailUser()}>`;
}

function dailyLimit(): number {
  const parsed = Number(process.env.GMAIL_DAILY_LIMIT || "100");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 100;
}

function ecuadorDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function ensureDataDir() {
  const dir = path.dirname(GMAIL_USAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadUsage(): GmailUsageFile {
  if (!fs.existsSync(GMAIL_USAGE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(GMAIL_USAGE_PATH, "utf-8")) as GmailUsageFile;
  } catch {
    return {};
  }
}

function saveUsage(usage: GmailUsageFile) {
  ensureDataDir();
  fs.writeFileSync(GMAIL_USAGE_PATH, JSON.stringify(usage, null, 2), "utf-8");
}

function getSentToday(account: string, dateKey: string): number {
  const usage = loadUsage();
  const record = usage[account];
  if (!record || record.date !== dateKey) return 0;
  return Number.isFinite(record.sent) ? record.sent : 0;
}

function incrementSentToday(account: string, dateKey: string): number {
  const usage = loadUsage();
  const current = usage[account]?.date === dateKey ? usage[account]?.sent || 0 : 0;
  const next = current + 1;
  usage[account] = { date: dateKey, sent: next, updatedAt: new Date().toISOString() };
  saveUsage(usage);
  return next;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function cleanHeader(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(cleanHeader(subject), "utf-8").toString("base64")}?=`;
}

function chunkBase64(base64: string): string {
  return base64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ticketHtml(input: TicketPdfEmailInput): string {
  const fullName = escapeHtml(`${input.firstName} ${input.lastName}`.trim());
  const serials = input.serialNumber.split(",");
  const quantity = Math.max(1, Number(input.quantity) || 1);
  const eventTitle = escapeHtml(input.eventTitle || "TRAP LOUD");
  const eventName = escapeHtml(input.eventName || "");
  const eventDate = escapeHtml(input.eventDate || "18 JUN 2026");
  const eventVenue = escapeHtml(input.eventVenue || "San Juan");

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const eventUrl = input.eventId
    ? `${siteUrl}/events/${encodeURIComponent(input.eventId)}`
    : siteUrl;
  const accountUrl = `${siteUrl}/cuenta`;

  const isPlural = quantity > 1;
  const headingText = isPlural ? "¡Entradas Confirmadas!" : "¡Entrada Confirmada!";
  const bodyIntro = isPlural
    ? `Tu compra para <strong>${eventTitle}</strong> ha sido verificada y confirmada con éxito.`
    : `Tu compra para <strong>${eventTitle}</strong> ha sido verificada y confirmada con éxito.`;
  const bodyAttachment = isPlural
    ? "Tus pases de acceso oficiales con código QR se encuentran <strong>adjuntos en este correo electrónico en formato de imagen</strong>. Descarga los archivos para presentarlos en el control de acceso el día del evento."
    : "Tu pase de acceso oficial con código QR se encuentra <strong>adjunto en este correo electrónico en formato de imagen</strong>. Descarga el archivo para presentarlo en el control de acceso el día del evento.";

  const serialsList = serials.map((s) => escapeHtml(s.trim())).join(" • ");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>4GO Events</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #e4e4e7;border-radius:24px;background-color:#ffffff;box-shadow:0 8px 30px rgba(0,0,0,0.04);overflow:hidden;">
          <tr>
            <td style="padding:40px 32px 20px;text-align:center;background:linear-gradient(180deg,#f8f9fc 0%,#ffffff 100%);">
              <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#6366f1;">4GO EVENTS</p>
              <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2;font-weight:900;letter-spacing:-0.5px;color:#18181b;">${headingText}</h1>
              <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#71717a;">${eventTitle}${eventName ? ` — ${eventName}` : ""}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0;font-size:15px;color:#18181b;line-height:1.5;">Hola <strong>${fullName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#3f3f46;">
                ${bodyIntro}
              </p>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#3f3f46;">
                ${bodyAttachment}
              </p>

              <!-- Event Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #f1f1f4;">
                    <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;">EVENTO</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:900;color:#18181b;">${eventTitle} <span style="font-weight:600;font-size:13px;color:#71717a;">(${quantity} ${quantity === 1 ? "entrada" : "entradas"})</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f1f4;">
                    <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;">FECHA Y LUGAR</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#18181b;">${eventDate} — ${eventVenue}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;">SERIAL DE SEGURIDAD</p>
                          <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;color:#18181b;">${serialsList}</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;">ESTADO</p>
                          <p style="margin:4px 0 0;font-size:12px;font-weight:800;color:#16a34a;text-transform:uppercase;">Confirmado</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button & Account Link -->
              <div style="margin-top:28px;text-align:center;">
                <a href="${eventUrl}" style="display:inline-block;padding:14px 28px;background-color:#09090b;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:0.5px;border-radius:9999px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                  Ver Detalles del Evento
                </a>
                <p style="margin:14px 0 0;font-size:12px;color:#71717a;line-height:1.5;">
                  También puedes revisar tus entradas y códigos QR en cualquier momento desde <a href="${accountUrl}" style="color:#18181b;font-weight:700;text-decoration:underline;">tu cuenta en 4GO</a>.
                </p>
              </div>

              <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #f4f4f5;font-size:11px;line-height:1.5;color:#a1a1aa;text-align:center;">
                Por motivos de seguridad, recuerda que cada código QR es de un único uso en portería. No compartas tu entrada con terceros antes del ingreso.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;font-size:11px;color:#71717a;line-height:1.6;border-top:1px solid #f4f4f5;background-color:#fafafa;">
              <p style="margin:0;">Mensaje de confirmación oficial enviado automáticamente por el sistema de 4GO.</p>
              <p style="margin:4px 0 0;">Soporte directo: <a href="mailto:soporte.nenez@gmail.com" style="color:#18181b;font-weight:700;text-decoration:underline;">soporte.nenez@gmail.com</a></p>
              <p style="margin:8px 0 0;font-weight:800;color:#18181b;">4GO ® · Loja, Ecuador</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ticketText(input: TicketPdfEmailInput): string {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const serials = input.serialNumber.split(",");
  const quantity = Math.max(1, Number(input.quantity) || 1);
  const eventTitle = input.eventTitle || "TRAP LOUD";
  const eventName = input.eventName || "YAN BLOCK EXPERIENCE";
  const eventDate = input.eventDate || "18 JUN 2026";
  const eventVenue = input.eventVenue || "San Juan";

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const eventUrl = input.eventId ? `${siteUrl}/?event=${encodeURIComponent(input.eventId)}` : siteUrl;

  const serialsTextStr = serials.map((s, idx) => `- Pase ${idx + 1} (Serial): ${s}`).join("\n");

  const isPlural = quantity > 1;
  const headingText = isPlural ? "¡Tus entradas están listas!" : "¡Tu entrada está lista!";
  const bodyText = isPlural
    ? "Tus pases de acceso oficiales han sido generados con éxito y se encuentran adjuntos en este correo electrónico en formato de imagen PNG. Por favor, descarga las imágenes y presenta los códigos QR en la entrada del evento. Recuerda que cada código es de un único uso y válido para un solo ingreso."
    : "Tu pase de acceso oficial ha sido generado con éxito y se encuentra adjunto en este correo electrónico en formato de imagen PNG. Por favor, descarga la imagen y presenta el código QR en la entrada del evento. Recuerda que cada código es de un único uso y válido para un solo ingreso.";

  return `${headingText}

Hola ${fullName},

${bodyText}

¡Nos vemos en ${eventTitle}!
( Enlace al evento: ${eventUrl} )

Detalles de los pases:
${serialsTextStr}
- Evento: ${eventTitle} - ${eventName}
- Fecha y Lugar: ${eventDate} - ${eventVenue}
- Cantidad: ${quantity} entrada${quantity === 1 ? "" : "s"}

Por razones de seguridad, te recomendamos no compartir capturas de pantalla ni reenviar este archivo a terceros antes del espectáculo.

Este es un mensaje de confirmación de compra transaccional enviado automáticamente por el sistema de entradas de Now4Go.

Now4Go ® · Loja, Ecuador`;
}

function buildMimeMessage(input: GmailMessageInput): string {
  const mixedBoundary = `nenez_mixed_${randomUUID().replace(/-/g, "")}`;
  const altBoundary = `nenez_alt_${randomUUID().replace(/-/g, "")}`;

  const headers = [
    `From: ${cleanHeader(gmailFrom())}`,
    `To: ${cleanHeader(input.to)}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
  ];

  const bodyParts = [
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    chunkBase64(Buffer.from(input.text || "", "utf-8").toString("base64")),
    "",
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    chunkBase64(Buffer.from(input.html, "utf-8").toString("base64")),
    "",
    `--${altBoundary}--`,
    "",
  ];

  const message = [...headers, ...bodyParts];

  for (const attachment of input.attachments || []) {
    const fileName = cleanHeader(attachment.filename);
    message.push(
      `--${mixedBoundary}`,
      `${cleanHeader(attachment.contentType)}; name="${fileName}"`.replace(/^/, "Content-Type: "),
      attachment.cid 
        ? `Content-ID: <${cleanHeader(attachment.cid)}>\r\nContent-Disposition: inline; filename="${fileName}"` 
        : `Content-Disposition: attachment; filename="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      "",
      chunkBase64(attachment.content.toString("base64")),
      "",
    );
  }

  message.push(`--${mixedBoundary}--`, "");
  return message.join("\r\n");
}

function isGmailApiConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID?.trim() &&
      process.env.GMAIL_CLIENT_SECRET?.trim() &&
      process.env.GMAIL_REFRESH_TOKEN?.trim(),
  );
}

function isSmtpConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim() &&
      (process.env.SMTP_PASS || process.env.GMAIL_PASS)?.trim(),
  );
}

function emailProvider(): "gmail-api" | "smtp" | "none" {
  if (isGmailApiConfigured()) return "gmail-api";
  if (isSmtpConfigured()) return "smtp";
  return "none";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("GMAIL_API_NOT_CONFIGURED");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error || `GMAIL_TOKEN_${response.status}`);
  }
  return data.access_token;
}

async function sendViaGmailApi(input: GmailMessageInput): Promise<string | undefined> {
  const accessToken = await getAccessToken();
  const raw = toBase64Url(buildMimeMessage(input));
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || `GMAIL_SEND_${response.status}`);
  }

  return data.id;
}

async function sendViaSmtp(input: GmailMessageInput): Promise<string | undefined> {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || DEFAULT_GMAIL_USER).trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || "").replace(/\s+/g, "").trim();
  if (!user || !pass) throw new Error("SMTP_NOT_CONFIGURED");

  const host = process.env.SMTP_HOST?.trim();
  const transport = host && host !== "smtp.gmail.com"
    ? createTransport({
        host,
        port: Number.parseInt(process.env.SMTP_PORT || "465", 10),
        secure: (Number.parseInt(process.env.SMTP_PORT || "465", 10)) === 465,
        auth: { user, pass },
      })
    : createTransport({
        service: "gmail",
        auth: { user, pass },
      });

  const result = await transport.sendMail({
    from: gmailFrom(),
    to: input.to,
    subject: cleanHeader(input.subject),
    html: input.html,
    text: input.text,
    attachments: (input.attachments || []).map((attachment) => ({
      filename: cleanHeader(attachment.filename),
      contentType: cleanHeader(attachment.contentType),
      content: attachment.content,
      cid: attachment.cid,
    })),
  });

  return result.messageId;
}

async function sendGmailMessageWithLimit(input: GmailMessageInput): Promise<GmailDeliveryResult> {
  const account = gmailUser();
  const limit = dailyLimit();
  const dateKey = ecuadorDateKey();
  const sentToday = getSentToday(account, dateKey);
  const to = input.to.trim().toLowerCase();
  const provider = emailProvider();

  if (!isValidEmail(to)) {
    return { attempted: false, success: false, reason: "missing-email", sentToday, dailyLimit: limit };
  }

  if (sentToday >= limit) {
    return { attempted: false, success: false, reason: "daily-limit", sentToday, dailyLimit: limit };
  }

  if (provider === "none") {
    return {
      attempted: false,
      success: false,
      reason: "email-provider-not-configured",
      sentToday,
      dailyLimit: limit,
    };
  }

  try {
    let messageId: string | undefined;
    let actualProvider = provider;

    if (provider === "gmail-api") {
      try {
        messageId = await sendViaGmailApi({ ...input, to });
      } catch (apiError) {
        const apiReason = apiError instanceof Error ? apiError.message : "unknown";
        secureLog("[EMAIL] Gmail API failed, checking SMTP fallback", {
          email: to,
          reason: apiReason,
        });

        if (isSmtpConfigured()) {
          secureLog("[EMAIL] Falling back to SMTP", { email: to });
          messageId = await sendViaSmtp({ ...input, to });
          actualProvider = "smtp";
        } else {
          throw apiError;
        }
      }
    } else {
      messageId = await sendViaSmtp({ ...input, to });
    }

    const nextCount = incrementSentToday(account, dateKey);
    secureLog("[EMAIL] Message sent", {
      email: to,
      provider: actualProvider,
      label: input.logLabel || "message",
      sentToday: nextCount,
      dailyLimit: limit,
      messageId,
    });

    return {
      attempted: true,
      success: true,
      messageId,
      sentToday: nextCount,
      dailyLimit: limit,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "email-provider-error";
    secureLog("[EMAIL] Message send failed", {
      email: to,
      provider,
      label: input.logLabel || "message",
      reason,
    });
    return { attempted: true, success: false, reason, sentToday, dailyLimit: limit };
  }
}

export async function sendTicketPdfViaGmailWithLimit(input: TicketPdfEmailInput): Promise<GmailDeliveryResult> {
  const serials = input.serialNumber.split(",");
  const buffers = Array.isArray(input.pdfBuffer) ? input.pdfBuffer : [input.pdfBuffer];
  
  const attachments = buffers.map((buf, idx) => {
    const s = serials[idx] || serials[0] || "ticket";
    return {
      filename: `entrada-${s}.png`,
      contentType: "image/png",
      content: buf,
    };
  });

  const isPlural = serials.length > 1 || (Number(input.quantity) || 1) > 1;
  const subjectPrefix = isPlural ? "Tus entradas están listas" : "Tu entrada está lista";

  return sendGmailMessageWithLimit({
    to: input.to,
    subject: `${subjectPrefix} 4GO — ${cleanHeader(input.eventTitle || "Evento")}`,
    html: ticketHtml(input),
    text: ticketText(input),
    logLabel: "ticket-image",
    attachments,
  });
}

function recoveryOtpHtml(code: string): string {
  const cleanCode = escapeHtml(code);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>4GO Events</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;border:1px solid #e4e4e7;border-radius:24px;background-color:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.03);overflow:hidden;">
          <tr>
            <td style="padding:40px 32px 20px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#71717a;">4GO</p>
              <h1 style="margin:12px 0 0;font-size:24px;line-height:1.2;font-weight:800;color:#18181b;">Recuperar entrada</h1>
              <p style="margin:10px auto 0;max-width:360px;font-size:13px;line-height:1.6;color:#71717a;">Usa este código de verificación para validar tu correo electrónico. Este código expira en 10 minutos por razones de seguridad.</p>
              
              <p style="margin:24px 0 0;display:inline-block;border:1px solid #e4e4e7;border-radius:18px;background-color:#f4f4f5;padding:14px 22px;font-size:28px;font-weight:800;letter-spacing:8px;color:#18181b;">${cleanCode}</p>
              
              <p style="margin:20px 0 0;font-size:11px;line-height:1.5;color:#a1a1aa;">Si tú no solicitaste este código, puedes ignorar este correo de forma segura.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;text-align:center;font-size:11px;color:#71717a;line-height:1.6;border-top:1px solid #f4f4f5;background-color:#fafafa;">
              <p style="margin:0;">Este es un mensaje de seguridad transaccional enviado automáticamente por 4GO.</p>
              <p style="margin:4px 0 0;">Si necesitas ayuda, escríbenos a <a href="mailto:soporte.nenez@gmail.com" style="color: #18181b; text-decoration: underline; font-weight: bold;">soporte.nenez@gmail.com</a>.</p>
              <p style="margin:8px 0 0;font-weight:bold;color:#18181b;">4GO ® · Loja, Ecuador</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function recoveryOtpText(code: string): string {
  return `Recuperar entrada - Código de verificación

Usa este código de verificación para validar tu correo electrónico en el portal de 4GO:

Código: ${code}

Este código expira en 10 minutos por razones de seguridad. Si tú no solicitaste este código, puedes ignorar este correo de forma segura.

Si necesitas ayuda, escríbenos a soporte.nenez@gmail.com.
4GO ® · Loja, Ecuador`;
}

export async function sendRecoveryOtpViaGmail(to: string, code: string): Promise<GmailDeliveryResult> {
  return sendGmailMessageWithLimit({
    to,
    subject: "Código de verificación — Recuperar entrada 4GO",
    html: recoveryOtpHtml(code),
    text: recoveryOtpText(code),
    logLabel: "recovery-otp",
  });
}

export function getGmailDeliveryDiagnostics() {
  const account = gmailUser();
  const dateKey = ecuadorDateKey();
  const limit = dailyLimit();
  const provider = emailProvider();
  return {
    configured: provider !== "none",
    provider,
    account,
    smtpHost: provider === "smtp" ? process.env.SMTP_HOST || "smtp.gmail.com" : undefined,
    smtpPort:
      provider === "smtp"
        ? Number.parseInt(process.env.SMTP_PORT || "465", 10)
        : undefined,
    sentToday: getSentToday(account, dateKey),
    dailyLimit: limit,
  };
}
