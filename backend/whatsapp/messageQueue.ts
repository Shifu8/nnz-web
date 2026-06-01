import { waLogger } from "./logger";

export interface QueuedMessage {
  jid: string;
  text: string;
  type: "text";
}

export interface QueuedImageMessage {
  jid: string;
  text: string;
  imageUrl: string;
  type: "image";
}

export interface QueuedDocumentMessage {
  jid: string;
  text: string;
  documentUrl: string;
  fileName: string;
  type: "document";
}

export interface QueuedDocumentBufferMessage {
  jid: string;
  text: string;
  documentBuffer: Buffer;
  fileName: string;
  type: "document-buffer";
}

export interface QueuedTextThenDocumentMessage {
  jid: string;
  text: string;
  preamble: string;
  preambleDelayMs: number;
  documentBuffer: Buffer;
  fileName: string;
  type: "text-then-document";
}

type QueueItem = QueuedMessage | QueuedImageMessage | QueuedDocumentMessage | QueuedDocumentBufferMessage | QueuedTextThenDocumentMessage;

interface SendFn {
  (jid: string, content: { text: string }): Promise<void>;
  (jid: string, content: { image: { url: string }; caption?: string }): Promise<void>;
  (jid: string, content: { document: { url: string }; fileName: string; mimetype: string; caption?: string }): Promise<void>;
  (jid: string, content: { document: Buffer; fileName: string; mimetype: string; caption?: string }): Promise<void>;
}

const queue: QueueItem[] = [];
let processing = false;
let stats = { sent: 0, failed: 0, queueSize: 0 };

const MIN_DELAY_MS = Number(process.env.WHATSAPP_MIN_DELAY_MS) || 20_000;
const MAX_DELAY_MS = Number(process.env.WHATSAPP_MAX_DELAY_MS) || 40_000;

function randomDelay(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

export function enqueueMessage(item: QueueItem) {
  queue.push(item);
  stats.queueSize = queue.length;
  waLogger.info("QUEUE", `Enqueued ${item.type}. Queue length: ${queue.length}`);
}

export function queueStats() {
  return { ...stats, pending: queue.length };
}

async function processQueue(send: SendFn) {
  if (processing) return;
  processing = true;
  waLogger.info("QUEUE", `Started processing. ${queue.length} pending.`);

  while (queue.length > 0) {
    const item = queue.shift()!;
    const delay = randomDelay();
    waLogger.info("QUEUE", `Waiting ${(delay / 1000).toFixed(1)}s before sending to ${item.jid}...`);

    await new Promise((r) => setTimeout(r, delay));

    const doSend = async (): Promise<void> => {
      if (item.type === "image") {
        await send(item.jid, { image: { url: item.imageUrl }, caption: item.text });
      } else if (item.type === "document") {
        await send(item.jid, {
          document: { url: item.documentUrl },
          fileName: item.fileName,
          mimetype: "application/pdf",
          caption: item.text,
        });
      } else if (item.type === "document-buffer") {
        await send(item.jid, {
          document: item.documentBuffer,
          fileName: item.fileName,
          mimetype: "application/pdf",
          caption: item.text,
        });
      } else if (item.type === "text-then-document") {
        await send(item.jid, { text: item.preamble });
        await new Promise((r) => setTimeout(r, item.preambleDelayMs));
        await send(item.jid, {
          document: item.documentBuffer,
          fileName: item.fileName,
          mimetype: "application/pdf",
          caption: item.text,
        });
      } else {
        await send(item.jid, { text: item.text });
      }
    };

    let attempts = 0;
    const maxAttempts = 3;
    let lastError: unknown;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        await doSend();
        stats.sent++;
        waLogger.info("QUEUE", `Sent ${item.type} to ${item.jid} (attempt ${attempts}). Total sent: ${stats.sent}`);
        break;
      } catch (err) {
        lastError = err;
        if (attempts < maxAttempts) {
          const retryDelay = 10_000 + Math.random() * 5_000;
          waLogger.warn("QUEUE", `Failed attempt ${attempts}/${maxAttempts} to ${item.jid}, retrying in ${(retryDelay / 1000).toFixed(1)}s...`);
          await new Promise((r) => setTimeout(r, retryDelay));
        }
      }
    }
    if (attempts === maxAttempts) {
      stats.failed++;
      waLogger.error("QUEUE", `Failed to send to ${item.jid} after ${maxAttempts} attempts`, lastError instanceof Error ? lastError.message : lastError);
    }
  }

  processing = false;
  stats.queueSize = 0;
  waLogger.info("QUEUE", `Queue empty. ${stats.sent} sent, ${stats.failed} failed.`);
}

let sendImpl: SendFn | null = null;

export function startQueue(send: SendFn) {
  sendImpl = send;
  setInterval(() => {
    if (queue.length > 0) processQueue(send);
  }, 5000);
}

export function addToQueue(item: QueueItem) {
  enqueueMessage(item);
  if (sendImpl && !processing) {
    processQueue(sendImpl);
  }
}
