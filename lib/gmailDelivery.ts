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
  pdfBuffer: Buffer;
  eventTitle?: string;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
};

type GmailAttachment = {
  filename: string;
  contentType: string;
  content: Buffer;
};

type GmailMessageInput = {
  to: string;
  subject: string;
  html: string;
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
  const serial = escapeHtml(input.serialNumber);
  const quantity = Math.max(1, Number(input.quantity) || 1);
  const eventTitle = escapeHtml(input.eventTitle || "TRAP LOUD");
  const eventName = escapeHtml(input.eventName || "YAN BLOCK EXPERIENCE");
  const eventDate = escapeHtml(input.eventDate || "18 JUN 2026");
  const eventVenue = escapeHtml(input.eventVenue || "San Juan");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>NENEZ</title>
</head>
<body style="margin:0;padding:0;background:#050306;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050306;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid rgba(255,111,188,0.22);border-radius:28px;background:linear-gradient(180deg,#120611 0%,#070307 100%);overflow:hidden;">
          <tr>
            <td style="padding:30px 24px 18px;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:5px;text-transform:uppercase;color:#ff8acb;">NENEZ</p>
              <h1 style="margin:12px 0 0;font-size:26px;line-height:1;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#ffffff;">Tu entrada esta lista</h1>
              <p style="margin:10px 0 0;font-size:12px;color:#b8a9b4;">${eventTitle} - ${eventName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:22px;background:rgba(0,0,0,0.35);">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0;font-size:14px;color:#d8d0d6;">Hola <strong style="color:#ffffff;">${fullName}</strong>,</p>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#a99da6;">Tu acceso oficial va adjunto en PDF. Presenta el QR en puerta; es valido una sola vez.</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);">
                          <p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#725d6b;">Serial</p>
                          <p style="margin:4px 0 0;font-size:14px;font-weight:900;letter-spacing:1px;color:#ff8acb;">${serial}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);">
                          <p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#725d6b;">Evento</p>
                          <p style="margin:4px 0 0;font-size:13px;font-weight:800;color:#ffffff;">${eventDate} - ${eventVenue} - ${quantity} entrada${quantity === 1 ? "" : "s"}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;text-align:center;font-size:11px;line-height:1.5;color:#7d7079;">No compartas capturas ni reenvies el codigo antes del show.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildMimeMessage(input: GmailMessageInput): string {
  const boundary = `nenez_${randomUUID().replace(/-/g, "")}`;
  const message = [
    `From: ${cleanHeader(gmailFrom())}`,
    `To: ${cleanHeader(input.to)}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    chunkBase64(Buffer.from(input.html, "utf-8").toString("base64")),
    "",
  ];

  for (const attachment of input.attachments || []) {
    const fileName = cleanHeader(attachment.filename);
    message.push(
      `--${boundary}`,
      `${cleanHeader(attachment.contentType)}; name="${fileName}"`.replace(/^/, "Content-Type: "),
      `Content-Disposition: attachment; filename="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      "",
      chunkBase64(attachment.content.toString("base64")),
      "",
    );
  }

  message.push(`--${boundary}--`, "");
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
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || "").trim();
  if (!user || !pass) throw new Error("SMTP_NOT_CONFIGURED");

  const port = Number.parseInt(process.env.SMTP_PORT || "465", 10);
  const transport = createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.isFinite(port) ? port : 465,
    secure: (Number.isFinite(port) ? port : 465) === 465,
    auth: { user, pass },
  });

  const result = await transport.sendMail({
    from: gmailFrom(),
    to: input.to,
    subject: cleanHeader(input.subject),
    html: input.html,
    attachments: (input.attachments || []).map((attachment) => ({
      filename: cleanHeader(attachment.filename),
      contentType: cleanHeader(attachment.contentType),
      content: attachment.content,
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
    const messageId =
      provider === "gmail-api"
        ? await sendViaGmailApi({ ...input, to })
        : await sendViaSmtp({ ...input, to });

    const nextCount = incrementSentToday(account, dateKey);
    secureLog("[EMAIL] Message sent", {
      email: to,
      provider,
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
  const serial = cleanHeader(input.serialNumber);
  return sendGmailMessageWithLimit({
    to: input.to,
    subject: `Tu entrada NENEZ - ${cleanHeader(input.eventTitle || "TRAP LOUD")}`,
    html: ticketHtml(input),
    logLabel: "ticket-pdf",
    attachments: [
      {
        filename: `entrada-${serial}.pdf`,
        contentType: "application/pdf",
        content: input.pdfBuffer,
      },
    ],
  });
}

function recoveryOtpHtml(code: string): string {
  const cleanCode = escapeHtml(code);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>NENEZ</title>
</head>
<body style="margin:0;padding:0;background:#050306;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050306;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;border:1px solid rgba(255,111,188,0.22);border-radius:26px;background:linear-gradient(180deg,#120611 0%,#070307 100%);overflow:hidden;">
          <tr>
            <td style="padding:30px 24px;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:5px;text-transform:uppercase;color:#ff8acb;">NENEZ</p>
              <h1 style="margin:12px 0 0;font-size:24px;line-height:1;font-weight:900;text-transform:uppercase;color:#ffffff;">Recuperar entrada</h1>
              <p style="margin:12px auto 0;max-width:360px;font-size:13px;line-height:1.6;color:#a99da6;">Usa este codigo para validar tu correo. Expira en 10 minutos.</p>
              <p style="margin:24px 0 0;display:inline-block;border:1px solid rgba(255,111,188,0.28);border-radius:18px;background:rgba(255,111,188,0.08);padding:14px 22px;font-size:28px;font-weight:900;letter-spacing:8px;color:#ffffff;">${cleanCode}</p>
              <p style="margin:20px 0 0;font-size:11px;line-height:1.5;color:#74636f;">Si no pediste este codigo, puedes ignorar este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendRecoveryOtpViaGmail(to: string, code: string): Promise<GmailDeliveryResult> {
  return sendGmailMessageWithLimit({
    to,
    subject: "Codigo para recuperar tu entrada NENEZ",
    html: recoveryOtpHtml(code),
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
