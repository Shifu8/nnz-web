import crypto from "crypto";

export function uuid(): string {
  return crypto.randomUUID();
}

export function shortCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

export function serialNumber(prefix = "NENEZ"): string {
  const num = crypto.randomInt(1000, 9999);
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${num}-${suffix}`;
}

export function randomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}
