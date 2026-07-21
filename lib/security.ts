import bcrypt from "bcryptjs";
import crypto from "crypto";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

export const STAFF_SESSION_COOKIE = "nenez_staff_session";
export const STAFF_CSRF_COOKIE = "nenez_staff_csrf";

const encoder = new TextEncoder();
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sanitizeName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[^\p{L}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .toUpperCase();
}

export function sanitizeEmail(value: unknown): string {
  return String(value ?? "").normalize("NFKC").trim().toLowerCase().slice(0, 120);
}

export function sanitizePhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, 15);
}

export function sanitizeDocument(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, 13);
}

export function sanitizeInstagram(value: unknown): string | null {
  const clean = String(value ?? "")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._]/g, "")
    .slice(0, 30);
  return clean.length ? clean : null;
}

export function validateEcuadorPhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone);
}

export function validateName(name: string): boolean {
  return /^[\p{L}\s'-]{2,40}$/u.test(name.trim());
}

export function validateEcuadorCedula(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const province = Number(value.slice(0, 2));
  const thirdDigit = Number(value[2]);
  if (province < 1 || province > 24 || thirdDigit > 5) return false;

  const digits = value.split("").map(Number);
  const checkDigit = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, digit, index) => {
    if (index % 2 === 0) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  const expected = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return expected === checkDigit;
}

export function validateCardNumberLuhn(value: string): boolean {
  const clean = String(value).replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i -= 1) {
    let digit = Number(clean[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function getFingerprint(ip: string, userAgent: string): string {
  return crypto.createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number; namespace: string },
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucketKey = `${options.namespace}:${key}`;
  const bucket = rateLimitBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function enforceRateLimit(
  request: Request,
  options: { limit: number; windowMs: number; namespace: string },
) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  const result = checkRateLimit(getFingerprint(ip, userAgent), options);
  if (!result.allowed) {
    throw new ApiError(429, `Demasiados intentos. Intenta de nuevo en ${result.retryAfter}s.`, "RATE_LIMITED");
  }
}

export function assertJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "Solicitud invalida.", "UNSUPPORTED_MEDIA_TYPE");
  }
}

export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = 16_384,
): Promise<T> {
  assertJsonRequest(request);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new ApiError(413, "Solicitud demasiado grande.", "PAYLOAD_TOO_LARGE");
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new ApiError(413, "Solicitud demasiado grande.", "PAYLOAD_TOO_LARGE");
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "JSON invalido.", "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path?.join(".") || "desconocido";
    const reason = first?.message || "invalido";
    throw new ApiError(400, `Campo "${field}": ${reason}`, "VALIDATION_ERROR");
  }
  return parsed.data;
}

function allowedOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NETLIFY_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean) as string[];
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set([requestOrigin, ...allowedOrigins()]);
  if (!allowed.has(origin)) {
    throw new ApiError(403, "Origen no permitido.", "BAD_ORIGIN");
  }
}

function envSecret(name: string, fallbackSeed: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(500, `Falta variable de entorno: ${name}`, "CONFIG_ERROR");
  }
  return `dev-only-${fallbackSeed}`;
}

function hashSecret(): string {
  return envSecret("QR_HASH_SECRET", "qr-hash-secret");
}

export function hashToken(value: string): string {
  return crypto.createHmac("sha256", hashSecret()).update(value).digest("hex");
}

export function hashLookup(value: string): string {
  return crypto.createHmac("sha256", hashSecret()).update(value.trim().toLowerCase()).digest("hex");
}

function encryptionKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (raw) {
    const decoded = Buffer.from(raw, "base64");
    if ([16, 24, 32].includes(decoded.length)) return decoded;
    throw new ApiError(500, "DATA_ENCRYPTION_KEY debe ser base64 de 16, 24 o 32 bytes.", "CONFIG_ERROR");
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(500, "Falta variable de entorno: DATA_ENCRYPTION_KEY", "CONFIG_ERROR");
  }

  return crypto.createHash("sha256").update("dev-only-nenez-encryption-key").digest();
}

export function encryptSensitive(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSensitive(value: string): string {
  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new ApiError(500, "Dato cifrado invalido.", "CONFIG_ERROR");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

const qrPayloadSchema = z.object({
  type: z.literal("NENEZ_PASS"),
  serialNumber: z.string().regex(/^NENEZ-[A-Z0-9-]{6,40}$/),
  token: z.string().min(24).max(80),
  eventId: z.string().regex(/^[a-z0-9-]{3,40}$/),
  issuedAt: z.string().datetime(),
  v: z.literal(1),
});

const legacyQrPayloadSchema = z
  .object({
    type: z.literal("NENEZ_PASS"),
    serialNumber: z.string().min(3).max(80).optional(),
    passId: z.string().min(3).max(80).optional(),
    token: z.string().min(8).max(120),
    eventId: z.string().regex(/^[a-z0-9-]{3,40}$/),
  })
  .passthrough();

export type NenezQrPayload = z.infer<typeof qrPayloadSchema>;

export function generateSecureQrPayload(serialNumber: string, token: string, eventId: string): string {
  return JSON.stringify({
    type: "NENEZ_PASS",
    serialNumber,
    token,
    eventId,
    issuedAt: new Date().toISOString(),
    v: 1,
  } satisfies NenezQrPayload);
}

export function parseSecureQrPayload(qrPayload: string): NenezQrPayload {
  if (qrPayload.length > 2048) {
    throw new ApiError(400, "QR demasiado grande.", "QR_TOO_LARGE");
  }

  try {
    return qrPayloadSchema.parse(JSON.parse(qrPayload));
  } catch {
    try {
      const legacy = legacyQrPayloadSchema.parse(JSON.parse(qrPayload));
      const serialNumber = legacy.serialNumber || legacy.passId;
      if (!serialNumber) throw new Error("missing serial");
      return {
        type: "NENEZ_PASS",
        serialNumber,
        token: legacy.token,
        eventId: legacy.eventId,
        issuedAt: new Date().toISOString(),
        v: 1,
      };
    } catch {
      throw new ApiError(400, "QR invalido o corrupto.", "INVALID_QR");
    }
  }
}

function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export type NenezAuthRole = "staff" | "admin" | "sales";

function roleHashEnvNames(role: NenezAuthRole): { b64: string; plain: string } {
  return role === "admin"
    ? { b64: "ADMIN_PASSWORD_HASH_B64", plain: "ADMIN_PASSWORD_HASH" }
    : { b64: "STAFF_PASSWORD_HASH_B64", plain: "STAFF_PASSWORD_HASH" };
}

/** Next/dotenv-expand corrupts bcrypt hashes that contain `$` in .env files. */
function loadBcryptHash(role: NenezAuthRole): string | undefined {
  const { b64, plain } = roleHashEnvNames(role);
  const encoded = process.env[b64]?.trim();
  if (encoded) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8").trim();
      if (decoded.startsWith("$2") && decoded.length >= 59) return decoded;
    } catch {
      /* fall through */
    }
  }

  const raw = process.env[plain]?.trim().replace(/^["']|["']$/g, "");
  if (raw?.startsWith("$2") && raw.length >= 59) return raw;
  return undefined;
}

export async function verifyRolePassword(password: string, role: NenezAuthRole): Promise<boolean> {
  const hash = loadBcryptHash(role);
  if (hash) return bcrypt.compare(password, hash);

  const plain = role === "admin" ? process.env.ADMIN_PASSWORD : process.env.STAFF_PASSWORD;
  if (plain) return timingSafeEqualString(password, plain);

  throw new ApiError(
    500,
    `Falta configurar ${role === "admin" ? "ADMIN" : "STAFF"}_PASSWORD_HASH.`,
    "CONFIG_ERROR",
  );
}

/** @deprecated Use verifyRolePassword */
export async function verifyStaffPassword(password: string): Promise<boolean> {
  return verifyRolePassword(password, "staff");
}

function jwtSecret(): Uint8Array {
  return encoder.encode(envSecret("JWT_SECRET", "staff-jwt-secret-min-32-bytes"));
}

export async function createStaffSessionJwt(
  sessionId: string,
  csrfToken: string,
  role: NenezAuthRole = "staff",
): Promise<string> {
  return new SignJWT({ role, sessionId, csrfToken })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(jwtSecret());
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

export function getCookie(request: Request, name: string): string | undefined {
  return parseCookies(request.headers.get("cookie"))[name];
}

export async function verifyStaffRequest(
  request: Request,
  options: { requireCsrf?: boolean; roles?: NenezAuthRole[] } = { requireCsrf: true },
) {
  const token =
    getCookie(request, STAFF_SESSION_COOKIE) ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new ApiError(401, "Sesion de staff requerida.", "UNAUTHORIZED");
  }

  const allowedRoles = options.roles || ["staff", "admin"];

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const role = payload.role as NenezAuthRole;
    if (!allowedRoles.includes(role) || typeof payload.sessionId !== "string") {
      throw new Error("bad role");
    }

    if (options.requireCsrf ?? true) {
      const csrfHeader = request.headers.get("x-csrf-token");
      const csrfCookie = getCookie(request, STAFF_CSRF_COOKIE);
      const csrfPayload = typeof payload.csrfToken === "string" ? payload.csrfToken : "";
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || csrfHeader !== csrfPayload) {
        throw new ApiError(403, "CSRF invalido.", "CSRF_FAILED");
      }
    }

    return {
      sessionId: payload.sessionId,
      csrfToken: typeof payload.csrfToken === "string" ? payload.csrfToken : "",
      role,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Sesion de staff invalida.", "UNAUTHORIZED");
  }
}

export async function verifyAdminRequest(request: Request, options = { requireCsrf: false }) {
  return verifyStaffRequest(request, { ...options, roles: ["admin"] });
}

export function redactForLog(value: unknown): unknown {
  const blocked = new Set([
    "authorization",
    "cookie",
    "password",
    "token",
    "cvv",
    "cvc",
    "card",
    "number",
    "privateMerchantId",
    "payphoneToken",
    "qrPayload",
  ]);

  if (Array.isArray(value)) return value.map(redactForLog);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        blocked.has(key) ? "[REDACTED]" : redactForLog(entry),
      ]),
    );
  }
  return value;
}

export function secureLog(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(message);
    return;
  }
  console.info(message, redactForLog(details));
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }

  console.error("Unhandled API error", redactForLog(error));
  return Response.json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" }, { status: 500 });
}

