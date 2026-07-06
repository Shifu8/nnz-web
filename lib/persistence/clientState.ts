/**
 * Persistencia anti-reload en el cliente (localStorage + sessionStorage).
 */

const PREFIX = "nenez_";

export type StoredTicketPass = {
  firstName: string;
  lastName: string;
  serialNumber: string;
  qrPayload: string;
  transactionId?: string;
  waLink?: string;
};


function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem(key: string, value: unknown, session = false) {
  if (typeof window === "undefined") return;
  const storage = session ? sessionStorage : localStorage;
  storage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

function getItem<T>(key: string, session = false): T | null {
  if (typeof window === "undefined") return null;
  const storage = session ? sessionStorage : localStorage;
  return safeParse<T>(storage.getItem(`${PREFIX}${key}`));
}

function removeItem(key: string, session = false) {
  if (typeof window === "undefined") return;
  const storage = session ? sessionStorage : localStorage;
  storage.removeItem(`${PREFIX}${key}`);
}

/** Ticket activo tras compra aprobada */
export function saveTicketPass(pass: StoredTicketPass) {
  setItem("ticket_pass", pass);
  if (pass.transactionId) {
    setItem("recovery_token", pass.transactionId);
  }
}

export function loadTicketPass(): StoredTicketPass | null {
  return getItem<StoredTicketPass>("ticket_pass");
}

export function clearTicketPass() {
  removeItem("ticket_pass");
}

/** Token de transacción PayPhone (checkout) */
export function saveRecoveryToken(transactionId: string) {
  setItem("recovery_token", transactionId);
}

export function loadRecoveryToken(): string | null {
  return getItem<string>("recovery_token");
}

/** Formulario de compra en progreso */
export function saveCheckoutDraft(data: Record<string, string>) {
  setItem("checkout_draft", data, true);
}

export function loadCheckoutDraft(): Record<string, string> | null {
  return getItem<Record<string, string>>("checkout_draft", true);
}

/** Modal / sección activa en home */
export function saveActiveModal(modal: "access" | null) {
  if (modal) setItem("active_modal", modal, true);
  else removeItem("active_modal", true);
}

export function loadActiveModal(): "access" | null {
  return getItem<"access">("active_modal", true);
}

/** Preview de comprobante (base64) — persiste entre cierres del modal, se borra al recargar */
export function saveReceiptPreview(base64: string) {
  setItem("receipt_preview", base64, true);
}

export function loadReceiptPreview(): string | null {
  return getItem<string>("receipt_preview", true);
}

export function clearReceiptPreview() {
  removeItem("receipt_preview", true);
}
