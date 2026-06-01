import { waLogger } from "../whatsapp/logger";
import { getSocket, startBaileys, logoutBaileys, getConnectionInfo, waitForConnection, waitForConnectionReady, validateNumber, isReady } from "../whatsapp/baileys";
import { addToQueue, startQueue } from "../whatsapp/messageQueue";

let initialized = false;

export async function initWhatsApp() {
  if (initialized) return;
  initialized = true;

  waLogger.info("SERVICE", "Initializing WhatsApp Baileys...");
  await startBaileys();

  const sock = getSocket();
  if (!sock) {
    waLogger.error("SERVICE", "Failed to create socket on init");
    return;
  }

  startQueue(async (jid: string, content: any) => {
    const s = getSocket();
    if (!s) throw new Error("Socket not available");
    await s.sendMessage(jid, content, { mediaUploadTimeoutMs: 120_000 });
  });

  waLogger.info("SERVICE", "WhatsApp service initialized");
}

export function getStatus(): ReturnType<typeof getConnectionInfo> {
  return getConnectionInfo();
}

export function getConnectionReady(): boolean {
  return isReady();
}

export async function waitUntilReady(timeoutMs = 180_000): Promise<boolean> {
  return waitForConnectionReady(timeoutMs);
}

export async function restart() {
  waLogger.info("SERVICE", "Restarting WhatsApp...");
  await logoutBaileys();
  initialized = false;
  await initWhatsApp();
}

export async function logout() {
  waLogger.info("SERVICE", "Logging out WhatsApp...");
  await logoutBaileys();
  initialized = false;
}

export function sendTicketMessage(jid: string, text: string) {
  addToQueue({ jid, text, type: "text" });
}

export function sendTicketImage(jid: string, imageUrl: string, caption: string) {
  addToQueue({ jid, text: caption, imageUrl, type: "image" });
}

export function sendTicketDocument(jid: string, documentUrl: string, fileName: string, caption: string) {
  addToQueue({ jid, text: caption, documentUrl, fileName, type: "document" });
}

export function sendTicketDocumentBuffer(jid: string, documentBuffer: Buffer, fileName: string, caption: string) {
  addToQueue({ jid, text: caption, documentBuffer, fileName, type: "document-buffer" });
}

export function sendTicketDocumentWithTextFirst(
  jid: string,
  documentBuffer: Buffer,
  fileName: string,
  caption: string,
  preamble = "📄 Preparando tu entrada digital...",
  preambleDelayMs = 8_000,
) {
  addToQueue({
    jid,
    text: caption,
    preamble,
    preambleDelayMs,
    documentBuffer,
    fileName,
    type: "text-then-document",
  });
}

export async function checkNumber(phone: string): Promise<{ exists: boolean; jid?: string }> {
  return validateNumber(phone);
}
