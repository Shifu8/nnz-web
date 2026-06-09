const COMMON_EMAIL_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com"] as const;

const DOMAIN_FIXES: Record<string, string> = {
  "gmail.cm": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.con": "gmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
};

export const emailDomains = COMMON_EMAIL_DOMAINS;

export function cleanEmailInput(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[^a-z0-9._%+\-@]/g, "")
    .slice(0, 80);
}

export function isValidEmailInput(value: string): boolean {
  return /^[^\s@]{1,48}@[^\s@]{2,40}\.[^\s@]{2,12}$/.test(value);
}

export function getEmailSuggestion(value: string): string | null {
  const [, domain = ""] = value.split("@");
  if (!domain) return null;
  return DOMAIN_FIXES[domain] || null;
}

export function getEmailHint(value: string): { tone: "idle" | "ok" | "warn"; text: string } {
  if (!value) {
    return { tone: "idle", text: "Usa el correo donde quieres recibir tu entrada." };
  }

  const suggestion = getEmailSuggestion(value);
  if (suggestion) {
    return { tone: "warn", text: `Revisa el dominio: quisiste decir ${suggestion}?` };
  }

  if (!value.includes("@")) {
    return { tone: "idle", text: "Agrega @gmail.com, @outlook.com u otro correo activo." };
  }

  if (!isValidEmailInput(value)) {
    return { tone: "warn", text: "Escribe solo un correo valido, sin espacios ni texto extra." };
  }

  return { tone: "ok", text: "Formato listo para recibir la entrada." };
}

export function applyEmailSuggestion(value: string): string {
  const [local, domain = ""] = value.split("@");
  const suggestion = DOMAIN_FIXES[domain];
  if (!local || !suggestion) return value;
  return `${local}@${suggestion}`;
}
