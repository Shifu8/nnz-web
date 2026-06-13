export function normalizeEcuadorWhatsAppJid(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("5930")) {
    digits = `593${digits.slice(4)}`;
  } else if (digits.startsWith("0")) {
    digits = `593${digits.slice(1)}`;
  } else if (!digits.startsWith("593")) {
    digits = `593${digits}`;
  }

  if (!/^5939\d{8}$/.test(digits)) return null;
  return `${digits}@s.whatsapp.net`;
}
