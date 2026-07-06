import "server-only";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getDbOrNull } from "@/lib/db/postgres";
import { hashLookup, hashToken } from "@/lib/security";
import type { RecoveryTicketSource } from "@/lib/tickets/recoveryTicket";

export const RECOVERY_OTP_TTL_MS = 10 * 60_000;
export const RECOVERY_MAX_ATTEMPTS = 5;
export const RECOVERY_MAX_OTPS_PER_DAY = 100;
export const RECOVERY_MAX_RESENDS_PER_DAY = 100;
export const RECOVERY_RESEND_COOLDOWN_MS = 2 * 60_000;

export type RecoveryLogAction =
  | "RECOVERY_REQUEST"
  | "RECOVERY_OTP_SENT"
  | "RECOVERY_VERIFY_SUCCESS"
  | "RECOVERY_VERIFY_FAILED"
  | "RECOVERY_DOWNLOAD"
  | "RECOVERY_RESEND";

type RecoveryOtp = {
  id: string;
  emailHash: string;
  eventId: string;
  ticketId: string;
  ticketSource: RecoveryTicketSource;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  used: boolean;
  createdAt: string;
  updatedAt: string;
};

type RecoveryLog = {
  id: string;
  emailHash: string;
  eventId: string;
  action: RecoveryLogAction;
  ipHash: string;
  userAgentHash: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type RecoveryFile = {
  version: 2;
  otps: RecoveryOtp[];
  logs: RecoveryLog[];
};

type CreateOtpInput = {
  email: string;
  eventId: string;
  ticketId: string;
  ticketSource: RecoveryTicketSource;
};

type RecoveryLogInput = Omit<RecoveryLog, "id" | "createdAt">;

const DEFAULT_RECOVERY_STORE_PATH = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "data",
  "ticket-recovery.json",
);
let recoveryTestFile: RecoveryFile | null = null;

export function resetRecoveryStoreForTests(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Recovery store overrides are disabled in production.");
  }
  recoveryTestFile = emptyFile();
}

function emptyFile(): RecoveryFile {
  return { version: 2, otps: [], logs: [] };
}

function loadRecoveryFile(): RecoveryFile {
  if (process.env.NODE_ENV === "test" && recoveryTestFile) {
    return structuredClone(recoveryTestFile);
  }

  const filePath = DEFAULT_RECOVERY_STORE_PATH;
  if (!fs.existsSync(filePath)) return emptyFile();

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<RecoveryFile>;
    if (parsed.version !== 2 || !Array.isArray(parsed.otps) || !Array.isArray(parsed.logs)) {
      return emptyFile();
    }
    return parsed as RecoveryFile;
  } catch {
    return emptyFile();
  }
}

function saveRecoveryFile(file: RecoveryFile): void {
  if (process.env.NODE_ENV === "test" && recoveryTestFile) {
    recoveryTestFile = structuredClone(file);
    return;
  }

  const filePath = DEFAULT_RECOVERY_STORE_PATH;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(file, null, 2), "utf8");
}

function startOfEcuadorDay(date = new Date()): string {
  const local = new Date(date.getTime() - 5 * 60 * 60_000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T05:00:00.000Z`;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function codeHash(email: string, eventId: string, code: string): string {
  return hashToken(`ticket-recovery:${normalizeRecoveryEmail(email)}:${eventId}:${code}`);
}

export function normalizeRecoveryEmail(email: string): string {
  return email.normalize("NFKC").trim().toLowerCase();
}

export function recoveryEmailHash(email: string): string {
  return hashLookup(normalizeRecoveryEmail(email));
}

export async function countRecoveryLogs(
  emailHash: string,
  eventId: string,
  action: RecoveryLogAction,
  since = startOfEcuadorDay(),
): Promise<number> {
  const db = getDbOrNull();
  if (db) {
    const [row] = await db`
      SELECT COUNT(*) as count FROM ticket_recovery_logs
      WHERE email_hash = ${emailHash}
        AND event_id = ${eventId}
        AND action = ${action}
        AND created_at >= ${since}
    `;
    return Number(row?.count || 0);
  }

  const sinceMs = new Date(since).getTime();
  return loadRecoveryFile().logs.filter(
    (log) =>
      log.emailHash === emailHash &&
      log.eventId === eventId &&
      log.action === action &&
      new Date(log.createdAt).getTime() >= sinceMs,
  ).length;
}

export async function getLastRecoveryLogAt(
  emailHash: string,
  eventId: string,
  action: RecoveryLogAction,
): Promise<string | null> {
  const db = getDbOrNull();
  if (db) {
    const [row] = await db`
      SELECT created_at FROM ticket_recovery_logs
      WHERE email_hash = ${emailHash}
        AND event_id = ${eventId}
        AND action = ${action}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return row?.created_at ? new Date(row.created_at).toISOString() : null;
  }

  const match = loadRecoveryFile().logs
    .filter((log) => log.emailHash === emailHash && log.eventId === eventId && log.action === action)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
  return match?.createdAt || null;
}

export async function recordRecoveryLog(input: RecoveryLogInput): Promise<void> {
  const db = getDbOrNull();
  if (db) {
    await db`
      INSERT INTO ticket_recovery_logs (
        email_hash, event_id, action, ip_hash, user_agent_hash, metadata
      ) VALUES (
        ${input.emailHash}, ${input.eventId}, ${input.action},
        ${input.ipHash}, ${input.userAgentHash}, ${db.json(input.metadata as any || {})}
      )
    `;
    return;
  }

  const file = loadRecoveryFile();
  file.logs.push({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  file.logs = file.logs.slice(-2000);
  saveRecoveryFile(file);
}

export async function createRecoveryOtp(input: CreateOtpInput): Promise<{
  id: string;
  code: string;
  expiresAt: string;
}> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RECOVERY_OTP_TTL_MS).toISOString();
  const code = String(crypto.randomInt(100000, 1_000_000));
  const emailHash = recoveryEmailHash(input.email);
  const hash = codeHash(input.email, input.eventId, code);
  const id = crypto.randomUUID();
  const db = getDbOrNull();

  if (db) {
    // Invalidate old OTPs
    await db`
      UPDATE ticket_recovery_otps
      SET used = true, updated_at = ${now.toISOString()}
      WHERE email_hash = ${emailHash}
        AND event_id = ${input.eventId}
        AND used = false
    `;

    // Insert new OTP
    await db`
      INSERT INTO ticket_recovery_otps (
        id, email_hash, event_id, ticket_id, ticket_source, code_hash,
        expires_at, attempts, used, created_at, updated_at
      ) VALUES (
        ${id}, ${emailHash}, ${input.eventId}, ${input.ticketId}, ${input.ticketSource}, ${hash},
        ${expiresAt}, 0, false, ${now.toISOString()}, ${now.toISOString()}
      )
    `;
    return { id, code, expiresAt };
  }

  const file = loadRecoveryFile();
  file.otps = file.otps.map((otp) =>
    otp.emailHash === emailHash && otp.eventId === input.eventId && !otp.used
      ? { ...otp, used: true, updatedAt: now.toISOString() }
      : otp,
  );
  file.otps.push({
    id,
    emailHash,
    eventId: input.eventId,
    ticketId: input.ticketId,
    ticketSource: input.ticketSource,
    codeHash: hash,
    expiresAt,
    attempts: 0,
    used: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  saveRecoveryFile(file);
  return { id, code, expiresAt };
}

export async function invalidateRecoveryOtp(id: string): Promise<void> {
  const now = new Date().toISOString();
  const db = getDbOrNull();
  if (db) {
    await db`
      UPDATE ticket_recovery_otps
      SET used = true, updated_at = ${now}
      WHERE id = ${id}
    `;
    return;
  }

  const file = loadRecoveryFile();
  file.otps = file.otps.map((otp) => (otp.id === id ? { ...otp, used: true, updatedAt: now } : otp));
  saveRecoveryFile(file);
}

export async function verifyRecoveryOtp(
  email: string,
  eventId: string,
  code: string,
): Promise<
  | { ok: true; ticketId: string; ticketSource: RecoveryTicketSource }
  | { ok: false; reason: "expired" | "not-found" | "locked" | "invalid" }
> {
  const normalizedEmail = normalizeRecoveryEmail(email);
  const emailHash = recoveryEmailHash(normalizedEmail);
  const now = new Date();
  const db = getDbOrNull();

  if (db) {
    const [otp] = await db`
      SELECT id, ticket_id, ticket_source, code_hash, expires_at, attempts, used
      FROM ticket_recovery_otps
      WHERE email_hash = ${emailHash}
        AND event_id = ${eventId}
        AND used = false
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (!otp) return { ok: false, reason: "not-found" };

    if (otp.attempts >= RECOVERY_MAX_ATTEMPTS) {
      await db`
        UPDATE ticket_recovery_otps
        SET used = true, updated_at = ${now.toISOString()}
        WHERE id = ${otp.id}
      `;
      return { ok: false, reason: "locked" };
    }

    if (new Date(otp.expires_at).getTime() <= now.getTime()) {
      await db`
        UPDATE ticket_recovery_otps
        SET used = true, updated_at = ${now.toISOString()}
        WHERE id = ${otp.id}
      `;
      return { ok: false, reason: "expired" };
    }

    if (!safeEqual(otp.code_hash, codeHash(normalizedEmail, eventId, code))) {
      const attempts = otp.attempts + 1;
      const locked = attempts >= RECOVERY_MAX_ATTEMPTS;
      await db`
        UPDATE ticket_recovery_otps
        SET attempts = ${attempts}, used = ${locked}, updated_at = ${now.toISOString()}
        WHERE id = ${otp.id}
      `;
      return { ok: false, reason: locked ? "locked" : "invalid" };
    }

    await db`
      UPDATE ticket_recovery_otps
      SET used = true, updated_at = ${now.toISOString()}
      WHERE id = ${otp.id}
    `;

    return {
      ok: true,
      ticketId: String(otp.ticket_id),
      ticketSource: otp.ticket_source as RecoveryTicketSource,
    };
  }

  const file = loadRecoveryFile();
  const record = file.otps
    .filter((otp) => otp.emailHash === emailHash && otp.eventId === eventId && !otp.used)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];

  if (!record) return { ok: false, reason: "not-found" };

  if (record.attempts >= RECOVERY_MAX_ATTEMPTS) {
    record.used = true;
    record.updatedAt = now.toISOString();
    saveRecoveryFile(file);
    return { ok: false, reason: "locked" };
  }

  if (new Date(record.expiresAt).getTime() <= now.getTime()) {
    record.used = true;
    record.updatedAt = now.toISOString();
    saveRecoveryFile(file);
    return { ok: false, reason: "expired" };
  }

  if (!safeEqual(record.codeHash, codeHash(normalizedEmail, eventId, code))) {
    record.attempts += 1;
    record.used = record.attempts >= RECOVERY_MAX_ATTEMPTS;
    record.updatedAt = now.toISOString();
    saveRecoveryFile(file);
    return { ok: false, reason: record.used ? "locked" : "invalid" };
  }

  record.used = true;
  record.updatedAt = now.toISOString();
  saveRecoveryFile(file);
  return {
    ok: true,
    ticketId: record.ticketId,
    ticketSource: record.ticketSource,
  };
}
