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

export type StoredGiveawayState = {
  registered: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phase?: string;
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

/** Estado del giveaway */
export function saveGiveawayState(state: StoredGiveawayState) {
  setItem("giveaway_state", state);
}

export function loadGiveawayState(): StoredGiveawayState | null {
  return getItem<StoredGiveawayState>("giveaway_state");
}

/** Modal / sección activa en home */
export function saveActiveModal(modal: "access" | null) {
  if (modal) setItem("active_modal", modal, true);
  else removeItem("active_modal", true);
}

export function loadActiveModal(): "access" | null {
  return getItem<"access">("active_modal", true);
}

/** Countdown giveaway sincronizado */
export function saveGiveawaySchedule(data: {
  openAt: string;
  closeAt: string;
  phase: string;
  serverTime: string;
}) {
  setItem("giveaway_schedule", data);
}

export function loadGiveawaySchedule(): {
  openAt: string;
  closeAt: string;
  phase: string;
  serverTime: string;
} | null {
  return getItem("giveaway_schedule");
}
