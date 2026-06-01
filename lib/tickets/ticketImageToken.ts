import crypto from "crypto";

function signingSecret(): string {
  return process.env.QR_HASH_SECRET || "dev-ticket-image-secret";
}

export function createTicketImageToken(serialNumber: string, ttlMs = 1000 * 60 * 60 * 24 * 7): string {
  const exp = Date.now() + ttlMs;
  const payload = `${serialNumber}.${exp}`;
  const sig = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyTicketImageToken(serialNumber: string, token: string): boolean {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;

  try {
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const [serial, expRaw] = payload.split(".");
    const exp = Number(expRaw);
    if (serial !== serialNumber || !Number.isFinite(exp) || exp < Date.now()) return false;

    const expected = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function ticketImagePublicUrl(serialNumber: string): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!base || base.includes("localhost")) return null;
  const token = createTicketImageToken(serialNumber);
  return `${base}/api/tickets/${encodeURIComponent(serialNumber)}/pass.png?token=${encodeURIComponent(token)}`;
}
