import "server-only";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";
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
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { count, error } = await supabase
      .from("ticket_recovery_logs")
      .select("id", { count: "exact", head: true })
      .eq("email_hash", emailHash)
      .eq("event_id", eventId)
      .eq("action", action)
      .gte("created_at", since);
    if (error) throw new Error(`RECOVERY_LOG_COUNT_FAILED:${error.message}`);
    return count || 0;
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
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("ticket_recovery_logs")
      .select("created_at")
      .eq("email_hash", emailHash)
      .eq("event_id", eventId)
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`RECOVERY_LOG_READ_FAILED:${error.message}`);
    return data?.created_at || null;
  }

  const match = loadRecoveryFile().logs
    .filter((log) => log.emailHash === emailHash && log.eventId === eventId && log.action === action)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
  return match?.createdAt || null;
}

export async function recordRecoveryLog(input: RecoveryLogInput): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("ticket_recovery_logs").insert({
      email_hash: input.emailHash,
      event_id: input.eventId,
      action: input.action,
      ip_hash: input.ipHash,
      user_agent_hash: input.userAgentHash,
      metadata: input.metadata || {},
    });
    if (error) throw new Error(`RECOVERY_LOG_WRITE_FAILED:${error.message}`);
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
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error: invalidateError } = await supabase
      .from("ticket_recovery_otps")
      .update({ used: true, updated_at: now.toISOString() })
      .eq("email_hash", emailHash)
      .eq("event_id", input.eventId)
      .eq("used", false);
    if (invalidateError) throw new Error(`RECOVERY_OTP_INVALIDATE_FAILED:${invalidateError.message}`);

    const { error } = await supabase.from("ticket_recovery_otps").insert({
      id,
      email_hash: emailHash,
      event_id: input.eventId,
      ticket_id: input.ticketId,
      ticket_source: input.ticketSource,
      code_hash: hash,
      expires_at: expiresAt,
      attempts: 0,
      used: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    if (error) throw new Error(`RECOVERY_OTP_WRITE_FAILED:${error.message}`);
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
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from("ticket_recovery_otps")
      .update({ used: true, updated_at: now })
      .eq("id", id);
    if (error) throw new Error(`RECOVERY_OTP_INVALIDATE_FAILED:${error.message}`);
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
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("ticket_recovery_otps")
      .select("id,ticket_id,ticket_source,code_hash,expires_at,attempts,used")
      .eq("email_hash", emailHash)
      .eq("event_id", eventId)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`RECOVERY_OTP_READ_FAILED:${error.message}`);
    if (!data) return { ok: false, reason: "not-found" };

    if (data.attempts >= RECOVERY_MAX_ATTEMPTS) {
      await supabase.from("ticket_recovery_otps").update({ used: true, updated_at: now.toISOString() }).eq("id", data.id);
      return { ok: false, reason: "locked" };
    }

    if (new Date(data.expires_at).getTime() <= now.getTime()) {
      await supabase.from("ticket_recovery_otps").update({ used: true, updated_at: now.toISOString() }).eq("id", data.id);
      return { ok: false, reason: "expired" };
    }

    if (!safeEqual(data.code_hash, codeHash(normalizedEmail, eventId, code))) {
      const attempts = data.attempts + 1;
      const locked = attempts >= RECOVERY_MAX_ATTEMPTS;
      await supabase
        .from("ticket_recovery_otps")
        .update({ attempts, used: locked, updated_at: now.toISOString() })
        .eq("id", data.id);
      return { ok: false, reason: locked ? "locked" : "invalid" };
    }

    const { error: updateError } = await supabase
      .from("ticket_recovery_otps")
      .update({ used: true, updated_at: now.toISOString() })
      .eq("id", data.id)
      .eq("used", false);
    if (updateError) throw new Error(`RECOVERY_OTP_UPDATE_FAILED:${updateError.message}`);

    return {
      ok: true,
      ticketId: String(data.ticket_id),
      ticketSource: data.ticket_source as RecoveryTicketSource,
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
