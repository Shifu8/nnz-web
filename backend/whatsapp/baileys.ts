import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { existsSync } from "fs";
import { join } from "path";
import qrcode from "qrcode-terminal";
import { waLogger } from "./logger";
import { useFileAuthState as getFileAuthState, clearSession } from "./sessionStore";

const SESSION_DIR = process.env.BAILEYS_SESSION_DIR || "wa_session";
const CONNECTION_READY_DELAY_MS = Number(process.env.CONNECTION_READY_DELAY_MS) || 15_000;

export type ConnectionStatus = "connecting" | "open" | "closing" | "closed" | "error";
export type QREventHandler = (qr: string) => void;

let sock: ReturnType<typeof makeWASocket> | null = null;
let connectionStatus: ConnectionStatus = "closed";
let connectionReady = false;
let currentQR: string | null = null;
let onQRCallback: QREventHandler | null = null;
let onReadyCallback: (() => void) | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let readyTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT_DELAY = 60_000;

function getReconnectDelay(): number {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  return delay + Math.random() * 1000;
}

function cancelTimers() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (readyTimer) { clearTimeout(readyTimer); readyTimer = null; }
}

export function onQR(cb: QREventHandler) {
  onQRCallback = cb;
}

export function onReady(cb: () => void) {
  onReadyCallback = cb;
}

export function getQR(): string | null {
  return currentQR;
}

export function getStatus(): ConnectionStatus {
  return connectionStatus;
}

export function isReady(): boolean {
  return connectionStatus === "open" && connectionReady;
}

export function getSocket() {
  return sock;
}

export async function startBaileys() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  waLogger.info("BAILEYS", `Using WA v${version.join(".")}, latest: ${isLatest}`);

  const { state, saveCreds } = getFileAuthState();
  const hasSession = existsSync(join(SESSION_DIR, "creds.json"));

  waLogger.info("BAILEYS", `Session found: ${hasSession}`);
  currentQR = null;
  connectionReady = false;
  cancelTimers();

  const prevSock = sock;
  if (prevSock) {
    try {
      prevSock.ev.removeAllListeners("connection.update");
      prevSock.ev.removeAllListeners("creds.update");
      prevSock.ev.removeAllListeners("messages.upsert");
      prevSock.ev.removeAllListeners("messages.update");
    } catch { }
  }

  sock = makeWASocket({
    version,
    browser: Browsers.macOS("Desktop"),
    auth: state,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 120_000,
    keepAliveIntervalMs: 15_000,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    fireInitQueries: false,
    shouldSyncHistoryMessage: () => false,
    emitOwnEvents: false,
  });

  connectionStatus = "connecting";

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      connectionReady = false;
      waLogger.info("BAILEYS", "New QR code received");
      console.log("\n┌──────────────────────────────────────┐");
      console.log("│  ESCANEA ESTE QR CON WHATSAPP WEB    │");
      console.log("│  (3 puntitos → WhatsApp Web)          │");
      console.log("└──────────────────────────────────────┘\n");
      qrcode.generate(qr, { small: true });
      if (onQRCallback) onQRCallback(qr);
    }

    if (connection === "open") {
      connectionStatus = "open";
      connectionReady = false;
      reconnectAttempts = 0;
      currentQR = null;
      waLogger.info("BAILEYS", "Connected! Phone authenticated.");

      readyTimer = setTimeout(() => {
        connectionReady = true;
        waLogger.info("BAILEYS", `Connection ready after ${CONNECTION_READY_DELAY_MS / 1000}s stabilization delay`);
        console.log("\n✅ WhatsApp listo para enviar mensajes.\n");
        if (onReadyCallback) onReadyCallback();
      }, CONNECTION_READY_DELAY_MS);

      console.log("\n✅ WhatsApp conectado. Estabilizando conexión...\n");
    }

    if (connection === "close") {
      connectionStatus = "closed";
      connectionReady = false;
      cancelTimers();

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      waLogger.warn("BAILEYS", `Disconnected (code: ${statusCode})`, {
        shouldReconnect,
        attempts: reconnectAttempts,
      });

      if (statusCode === DisconnectReason.loggedOut) {
        waLogger.warn("BAILEYS", "Logged out. Clearing session.");
        clearSession();
      }

      if (shouldReconnect) {
        const delay = getReconnectDelay();
        waLogger.info("BAILEYS", `Reconnecting in ${(delay / 1000).toFixed(1)}s...`);
        reconnectTimer = setTimeout(startBaileys, delay);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

export function getConnectionInfo() {
  const hasSession = existsSync(join(SESSION_DIR, "creds.json"));
  const jid = sock?.user?.id ? `${sock.user.id.split(":")[0]}@s.whatsapp.net` : null;
  return {
    status: connectionStatus,
    phone: sock?.user?.id ? sock.user.id.split(":")[0] : null,
    jid,
    hasSession,
    qr: currentQR,
    reconnectAttempts,
    isConnected: connectionStatus === "open",
    isReady: connectionReady,
  };
}

export async function waitForConnection(timeoutMs = 60_000): Promise<boolean> {
  if (connectionStatus === "open") return true;
  return new Promise((resolve) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (connectionStatus === "open") {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 500);
  });
}

export async function waitForConnectionReady(timeoutMs = 180_000): Promise<boolean> {
  if (connectionStatus === "open" && connectionReady) return true;
  return new Promise((resolve) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (connectionStatus === "open" && connectionReady) {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 500);
  });
}

export async function validateNumber(phone: string): Promise<{ exists: boolean; jid?: string }> {
  if (!sock) return { exists: false };
  try {
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("593") ? digits : `593${digits.replace(/^0+/, "")}`;
    const result = await sock.onWhatsApp(`${normalized}@s.whatsapp.net`);
    if (result && result.length > 0 && result[0].exists) {
      return { exists: true, jid: result[0].jid };
    }
    return { exists: false };
  } catch (err) {
    waLogger.warn("BAILEYS", "onWhatsApp check failed", err instanceof Error ? err.message : err);
    return { exists: false };
  }
}

export async function logoutBaileys() {
  cancelTimers();
  if (sock) {
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
      sock.ev.removeAllListeners("messages.upsert");
      sock.ev.removeAllListeners("messages.update");
    } catch { }
    try {
      await sock.logout();
    } catch { }
    sock = null;
  }
  clearSession();
  connectionStatus = "closed";
  connectionReady = false;
  currentQR = null;
  reconnectAttempts = 0;
}
