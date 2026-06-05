import crypto from "crypto";
import fs from "fs";
import path from "path";

const RECOVERY_PATH = path.join(process.cwd(), "data", "ticket-recovery.json");
const OTP_TTL_MS = 10 * 60_000;
const DOWNLOAD_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 3;

type OtpRecord = {
  emailHash: string;
  receiptId: string;
  codeHash: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
};

type DownloadRecord = {
  tokenHash: string;
  receiptId: string;
  createdAt: string;
  expiresAt: string;
};

type RecoveryFile = {
  otps: Record<string, OtpRecord>;
  downloads: Record<string, DownloadRecord>;
};

function secret(): string {
  return process.env.QR_HASH_SECRET || process.env.JWT_SECRET || "dev-dawgs-recovery-secret";
}

function hash(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function recoveryEmailHash(email: string): string {
  return hash(`email:${normalizeRecoveryEmail(email)}`);
}

function ensureDir() {
  const dir = path.dirname(RECOVERY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function emptyFile(): RecoveryFile {
  return { otps: {}, downloads: {} };
}

function loadRecoveryFile(): RecoveryFile {
  if (!fs.existsSync(RECOVERY_PATH)) return emptyFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(RECOVERY_PATH, "utf-8")) as Partial<RecoveryFile>;
    return {
      otps: parsed.otps || {},
      downloads: parsed.downloads || {},
    };
  } catch {
    return emptyFile();
  }
}

function saveRecoveryFile(file: RecoveryFile) {
  ensureDir();
  fs.writeFileSync(RECOVERY_PATH, JSON.stringify(file, null, 2), "utf-8");
}

function cleanup(file: RecoveryFile, now = Date.now()): RecoveryFile {
  for (const [key, record] of Object.entries(file.otps)) {
    if (new Date(record.expiresAt).getTime() <= now || record.attempts >= MAX_ATTEMPTS) {
      delete file.otps[key];
    }
  }
  for (const [key, record] of Object.entries(file.downloads)) {
    if (new Date(record.expiresAt).getTime() <= now) {
      delete file.downloads[key];
    }
  }
  return file;
}

export function createRecoveryOtp(email: string, receiptId: string): { code: string; expiresAt: string } {
  const normalized = normalizeRecoveryEmail(email);
  const emailHash = recoveryEmailHash(normalized);
  const code = String(crypto.randomInt(100000, 999999));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString();
  const file = cleanup(loadRecoveryFile());

  file.otps[emailHash] = {
    emailHash,
    receiptId,
    codeHash: hash(`otp:${normalized}:${code}`),
    attempts: 0,
    createdAt: now.toISOString(),
    expiresAt,
  };

  saveRecoveryFile(file);
  return { code, expiresAt };
}

export function verifyRecoveryOtp(email: string, code: string): {
  ok: boolean;
  reason?: "expired" | "not-found" | "locked" | "invalid";
  token?: string;
  downloadExpiresAt?: string;
} {
  const normalized = normalizeRecoveryEmail(email);
  const emailHash = recoveryEmailHash(normalized);
  const file = loadRecoveryFile();
  const record = file.otps[emailHash];

  if (!record) {
    saveRecoveryFile(cleanup(file));
    return { ok: false, reason: "not-found" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    delete file.otps[emailHash];
    saveRecoveryFile(file);
    return { ok: false, reason: "locked" };
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    delete file.otps[emailHash];
    saveRecoveryFile(file);
    return { ok: false, reason: "expired" };
  }

  const cleanCode = code.replace(/\D/g, "");
  if (record.codeHash !== hash(`otp:${normalized}:${cleanCode}`)) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) delete file.otps[emailHash];
    saveRecoveryFile(file);
    return { ok: false, reason: record.attempts >= MAX_ATTEMPTS ? "locked" : "invalid" };
  }

  const token = `${crypto.randomUUID()}-${crypto.randomBytes(18).toString("hex")}`;
  const tokenHash = hash(`download:${token}`);
  const now = new Date();
  const downloadExpiresAt = new Date(now.getTime() + DOWNLOAD_TTL_MS).toISOString();

  delete file.otps[emailHash];
  file.downloads[tokenHash] = {
    tokenHash,
    receiptId: record.receiptId,
    createdAt: now.toISOString(),
    expiresAt: downloadExpiresAt,
  };

  saveRecoveryFile(file);
  return { ok: true, token, downloadExpiresAt };
}

export function consumeRecoveryDownloadToken(token: string): { ok: boolean; receiptId?: string } {
  const tokenHash = hash(`download:${token}`);
  const file = cleanup(loadRecoveryFile());
  const record = file.downloads[tokenHash];

  if (!record || new Date(record.expiresAt).getTime() <= Date.now()) {
    saveRecoveryFile(file);
    return { ok: false };
  }

  saveRecoveryFile(file);
  return { ok: true, receiptId: record.receiptId };
}
