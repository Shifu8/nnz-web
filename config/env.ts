export function getEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export function getBoolEnv(name: string, fallback = false): boolean {
  const val = process.env[name]?.trim()?.toLowerCase();
  if (val === undefined || val === "") return fallback;
  return val === "true" || val === "1";
}

export const ENV = {
  SITE_URL: getEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),

  SMTP_HOST: getEnv("SMTP_HOST", "smtp.gmail.com"),
  SMTP_PORT: parseInt(getEnv("SMTP_PORT", "587"), 10),
  SMTP_USER: getEnv("SMTP_USER", getEnv("GMAIL_USER")),
  SMTP_PASS: getEnv("SMTP_PASS", getEnv("GMAIL_PASS")),
  SMTP_FROM: getEnv("SMTP_FROM", "DAWGS <mrshifu879@gmail.com>"),

  WHATSAPP_TOKEN: getEnv("WHATSAPP_ACCESS_TOKEN"),
  WHATSAPP_PHONE_ID: getEnv("WHATSAPP_PHONE_NUMBER_ID"),
  WHATSAPP_VERIFY: getEnv("WHATSAPP_VERIFY_TOKEN"),

  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
} as const;
