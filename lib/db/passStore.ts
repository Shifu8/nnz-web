import "server-only";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getDbOrNull } from "@/lib/db/postgres";
import {
  ApiError,
  decryptSensitive,
  encryptSensitive,
  generateSecureQrPayload,
  hashLookup,
  hashToken,
  sanitizeDocument,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
} from "@/lib/security";

type PendingTicketInput = {
  transactionId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  documentNumber: string;
  eventId: string;
  amount: number;
  paymentToken: string;
  ip: string;
  userAgent: string;
  processor?: string;
};

type ActivateTicketInput = Omit<PendingTicketInput, "paymentToken" | "ip" | "userAgent"> & {
  processorTicketNumber: string;
  processorResponse: unknown;
  fromPendingOnly?: boolean;
};

type DeclineTicketInput = {
  transactionId: string;
  reason: string;
  processorResponse?: unknown;
};

export type PassValidationResult =
  | {
      valid: true;
      message: string;
      passInfo: {
        serialNumber: string;
        eventId: string;
        scannedAt: string;
        holderName?: string;
        quantity?: number;
        scanNumber?: number;
        remainingUses?: number;
      };
    }
  | {
      valid: false;
      error: string;
      reason: "not_found" | "invalid_token" | "used" | "expired" | "db_unavailable";
      scannedAt?: string;
    };

export type ActivatedPass = {
  firstName: string;
  lastName: string;
  serialNumber: string;
  qrPayload: string;
  email?: string;
  phone?: string;
};

// ─── Store discriminator ─────────────────────────────────────────────────────

type Store =
  | { kind: "postgres"; db: NonNullable<ReturnType<typeof getDbOrNull>> }
  | { kind: "local-json" };

export function ensureStore(): Store {
  const db = getDbOrNull();
  if (db) return { kind: "postgres", db };
  return { kind: "local-json" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeTicket(input: PendingTicketInput | ActivateTicketInput) {
  return {
    ...input,
    firstName: sanitizeName(input.firstName),
    lastName: sanitizeName(input.lastName),
    phone: sanitizePhone(input.phone),
    email: sanitizeEmail(input.email),
    documentNumber: sanitizeDocument(input.documentNumber),
  };
}

function serialFor(transactionId: string): string {
  return `NENEZ-${crypto.randomInt(1000, 9999)}-${transactionId.split("-")[0].toUpperCase()}`;
}

// ─── JSON file helpers (local-json fallback) ──────────────────────────────────

function getJsonFile(name: string): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${name}.json`);
}

export function readJsonFile<T>(name: string): T[] {
  const file = getJsonFile(name);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T[];
  } catch {
    return [];
  }
}

export function writeJsonFile<T>(name: string, data: T[]): void {
  const file = getJsonFile(name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// ─── assertNoActivePassForPhone ───────────────────────────────────────────────

async function assertNoActivePassForPhone(phoneHash: string, eventId: string) {
  const store = ensureStore();

  if (store.kind === "local-json") {
    const accessDrops = readJsonFile<any>("access_drops");
    const existing = accessDrops.find(
      (ad: any) =>
        (ad.phoneHash === phoneHash || ad.phone_hash === phoneHash) &&
        (ad.eventId === eventId || ad.event_id === eventId) &&
        ad.status === "confirmed",
    );
    if (existing) throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
    return;
  }

  const rows = await store.db`
    SELECT id FROM access_drops
    WHERE phone_hash = ${phoneHash} AND event_id = ${eventId} AND status = 'confirmed'
    LIMIT 1
  `;
  if (rows.length) throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
}

// ─── loadPendingTicketForActivation ──────────────────────────────────────────

async function loadPendingTicketForActivation(transactionId: string): Promise<ActivateTicketInput> {
  const store = ensureStore();

  if (store.kind === "local-json") {
    const tickets = readJsonFile<any>("tickets");
    const data = tickets.find((t: any) => t.id === transactionId);
    if (!data) throw new ApiError(404, "Orden no encontrada.", "TICKET_NOT_FOUND");
    return {
      transactionId,
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      phone: decryptSensitive(data.phoneEncrypted || data.phone_encrypted),
      email: decryptSensitive(data.emailEncrypted || data.email_encrypted),
      documentNumber: decryptSensitive(data.documentEncrypted || data.document_encrypted),
      eventId: data.eventId || data.event_id,
      amount: Number(data.amount),
      processorTicketNumber: String(data.processorTicketNumber || data.processor_ticket_number || transactionId),
      processorResponse: data.processorResponse || data.processor_response || {},
      fromPendingOnly: true,
    };
  }

  const [row] = await store.db`
    SELECT id, status, first_name, last_name, phone_encrypted, email_encrypted,
           document_encrypted, event_id, amount, serial_number, qr_payload_encrypted,
           processor_ticket_number, processor_response
    FROM tickets WHERE id = ${transactionId}
  `;
  if (!row) throw new ApiError(404, "Orden no encontrada.", "TICKET_NOT_FOUND");

  if (row.status !== "pending" && !(row.status === "approved" && row.serial_number)) {
    throw new ApiError(409, "La orden ya fue procesada.", "TICKET_ALREADY_PROCESSED");
  }

  return {
    transactionId,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: decryptSensitive(row.phone_encrypted),
    email: decryptSensitive(row.email_encrypted),
    documentNumber: decryptSensitive(row.document_encrypted),
    eventId: row.event_id,
    amount: Number(row.amount),
    processorTicketNumber: String(row.processor_ticket_number || transactionId),
    processorResponse: row.processor_response || {},
    fromPendingOnly: true,
  };
}

// ─── getActivatedPassByTransactionId ─────────────────────────────────────────

export async function getActivatedPassByTransactionId(transactionId: string): Promise<ActivatedPass | null> {
  const store = ensureStore();

  if (store.kind === "local-json") {
    const tickets = readJsonFile<any>("tickets");
    const data = tickets.find((t: any) => t.id === transactionId && (t.status === "approved" || t.status === "confirmed"));
    if (!data || !(data.serialNumber || data.serial_number) || !(data.qrPayloadEncrypted || data.qr_payload_encrypted)) return null;
    return {
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      serialNumber: data.serialNumber || data.serial_number,
      qrPayload: decryptSensitive(data.qrPayloadEncrypted || data.qr_payload_encrypted),
      email: decryptSensitive(data.emailEncrypted || data.email_encrypted),
      phone: decryptSensitive(data.phoneEncrypted || data.phone_encrypted),
    };
  }

  const [row] = await store.db`
    SELECT first_name, last_name, serial_number, qr_payload_encrypted, phone_encrypted, email_encrypted
    FROM tickets WHERE id = ${transactionId} AND status = 'approved'
  `;
  if (!row?.serial_number || !row.qr_payload_encrypted) return null;
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    serialNumber: row.serial_number,
    qrPayload: decryptSensitive(row.qr_payload_encrypted),
    email: row.email_encrypted ? decryptSensitive(row.email_encrypted) : undefined,
    phone: row.phone_encrypted ? decryptSensitive(row.phone_encrypted) : undefined,
  };
}

// ─── createPendingTicket ──────────────────────────────────────────────────────

export async function createPendingTicket(input: PendingTicketInput) {
  const ticket = normalizeTicket(input) as PendingTicketInput;
  const store = ensureStore();
  const now = new Date().toISOString();
  const phoneHash = hashLookup(ticket.phone);
  const emailHash = hashLookup(ticket.email);
  const documentHash = hashLookup(ticket.documentNumber);

  await assertNoActivePassForPhone(phoneHash, ticket.eventId);

  if (store.kind === "local-json") {
    const tickets = readJsonFile<any>("tickets");
    tickets.push({
      id: ticket.transactionId,
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      phoneHash,
      phoneEncrypted: encryptSensitive(ticket.phone),
      emailHash,
      emailEncrypted: encryptSensitive(ticket.email),
      documentHash,
      documentEncrypted: encryptSensitive(ticket.documentNumber),
      eventId: ticket.eventId,
      amount: ticket.amount,
      status: "pending",
      processor: ticket.processor || "payphone",
      paymentTokenHash: hashToken(ticket.paymentToken),
      ipHash: hashLookup(ticket.ip),
      userAgentHash: hashLookup(ticket.userAgent),
      createdAt: now,
      updatedAt: now,
    });
    writeJsonFile("tickets", tickets);
    return;
  }

  await store.db`
    INSERT INTO tickets (
      id, first_name, last_name, phone_hash, phone_encrypted,
      email_hash, email_encrypted, document_hash, document_encrypted,
      event_id, amount, status, processor, payment_token_hash,
      ip_hash, user_agent_hash, created_at, updated_at
    ) VALUES (
      ${ticket.transactionId}, ${ticket.firstName}, ${ticket.lastName},
      ${phoneHash}, ${encryptSensitive(ticket.phone)},
      ${emailHash}, ${encryptSensitive(ticket.email)},
      ${documentHash}, ${encryptSensitive(ticket.documentNumber)},
      ${ticket.eventId}, ${ticket.amount}, 'pending',
      ${ticket.processor || "payphone"}, ${hashToken(ticket.paymentToken)},
      ${hashLookup(ticket.ip)}, ${hashLookup(ticket.userAgent)},
      ${now}, ${now}
    )
  `;
}

// ─── fulfillApprovedTicketFromWebhook ─────────────────────────────────────────

export async function fulfillApprovedTicketFromWebhook(input: {
  transactionId: string;
  processorTicketNumber: string;
  processorResponse: unknown;
}): Promise<{ fulfilled: boolean; alreadyFulfilled?: boolean }> {
  const store = ensureStore();

  if (store.kind === "local-json") {
    const tickets = readJsonFile<any>("tickets");
    const ticket = tickets.find((t: any) => t.id === input.transactionId);
    if (!ticket) return { fulfilled: false };

    if ((ticket.status === "approved" || ticket.status === "confirmed") && (ticket.serialNumber || ticket.serial_number)) {
      return { fulfilled: false, alreadyFulfilled: true };
    }

    if (ticket.status !== "pending") {
      return { fulfilled: false };
    }

    await activateTicket({
      transactionId: input.transactionId,
      firstName: ticket.firstName || ticket.first_name,
      lastName: ticket.lastName || ticket.last_name,
      phone: decryptSensitive(ticket.phoneEncrypted || ticket.phone_encrypted),
      email: decryptSensitive(ticket.emailEncrypted || ticket.email_encrypted),
      documentNumber: decryptSensitive(ticket.documentEncrypted || ticket.document_encrypted),
      eventId: ticket.eventId || ticket.event_id,
      amount: Number(ticket.amount),
      processorTicketNumber: input.processorTicketNumber,
      processorResponse: input.processorResponse,
    });

    return { fulfilled: true };
  }

  const [ticket] = await store.db`
    SELECT id, status, first_name, last_name, phone_encrypted, email_encrypted,
           document_encrypted, event_id, amount, serial_number
    FROM tickets WHERE id = ${input.transactionId}
  `;
  if (!ticket) return { fulfilled: false };

  if (ticket.status === "approved" && ticket.serial_number) {
    return { fulfilled: false, alreadyFulfilled: true };
  }

  if (ticket.status !== "pending") {
    return { fulfilled: false };
  }

  await activateTicket({
    transactionId: input.transactionId,
    firstName: ticket.first_name,
    lastName: ticket.last_name,
    phone: decryptSensitive(ticket.phone_encrypted),
    email: decryptSensitive(ticket.email_encrypted),
    documentNumber: decryptSensitive(ticket.document_encrypted),
    eventId: ticket.event_id,
    amount: Number(ticket.amount),
    processorTicketNumber: input.processorTicketNumber,
    processorResponse: input.processorResponse,
  });

  return { fulfilled: true };
}

// ─── markTicketDeclined ───────────────────────────────────────────────────────

export async function markTicketDeclined(input: DeclineTicketInput) {
  const store = ensureStore();
  const now = new Date().toISOString();
  const safeReason = input.reason.slice(0, 240);

  if (store.kind === "local-json") {
    const tickets = readJsonFile<any>("tickets");
    const idx = tickets.findIndex((t: any) => t.id === input.transactionId);
    if (idx !== -1) {
      tickets[idx].status = "declined";
      tickets[idx].declineReason = safeReason;
      tickets[idx].processorResponse = input.processorResponse ?? null;
      tickets[idx].updatedAt = now;
      writeJsonFile("tickets", tickets);
    }
    return;
  }

  await store.db`
    UPDATE tickets
    SET status = 'declined', decline_reason = ${safeReason},
        processor_response = ${store.db.json(input.processorResponse as any ?? null)},
        updated_at = ${now}
    WHERE id = ${input.transactionId}
  `;
}

// ─── activateTicket ───────────────────────────────────────────────────────────

export async function activateTicket(input: ActivateTicketInput): Promise<ActivatedPass> {
  const existing = await getActivatedPassByTransactionId(input.transactionId);
  if (existing?.qrPayload) return existing;

  const resolved = input.fromPendingOnly ? await loadPendingTicketForActivation(input.transactionId) : input;
  const merged: ActivateTicketInput = {
    ...resolved,
    ...input,
    firstName: input.firstName || resolved.firstName,
    lastName: input.lastName || resolved.lastName,
    phone: input.phone || resolved.phone,
    email: input.email || resolved.email,
    documentNumber: input.documentNumber || resolved.documentNumber,
    eventId: input.eventId || resolved.eventId,
    amount: input.amount || resolved.amount,
  };

  const ticket = normalizeTicket(merged) as ActivateTicketInput;
  const store = ensureStore();
  const now = new Date().toISOString();
  const serialNumber = serialFor(ticket.transactionId);
  const qrToken = crypto.randomUUID();
  const qrPayload = generateSecureQrPayload(serialNumber, qrToken, ticket.eventId);
  const participantId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const phoneHash = hashLookup(ticket.phone);
  const emailHash = hashLookup(ticket.email);
  const documentHash = hashLookup(ticket.documentNumber);
  const encryptedQrPayload = encryptSensitive(qrPayload);

  if (store.kind === "local-json") {
    const accessDrops = readJsonFile<any>("access_drops");
    const existingDup = accessDrops.find(
      (ad: any) =>
        (ad.phoneHash === phoneHash || ad.phone_hash === phoneHash) &&
        (ad.eventId === ticket.eventId || ad.event_id === ticket.eventId) &&
        ad.status === "confirmed",
    );
    if (existingDup) {
      throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
    }

    const tickets = readJsonFile<any>("tickets");
    const tIdx = tickets.findIndex((t: any) => t.id === ticket.transactionId);
    if (tIdx !== -1) {
      tickets[tIdx].status = "approved";
      tickets[tIdx].processorTicketNumber = ticket.processorTicketNumber;
      tickets[tIdx].processorResponse = ticket.processorResponse;
      tickets[tIdx].serialNumber = serialNumber;
      tickets[tIdx].qrPayloadEncrypted = encryptedQrPayload;
      tickets[tIdx].activatedAt = now;
      tickets[tIdx].updatedAt = now;
      writeJsonFile("tickets", tickets);
    } else {
      tickets.push({
        id: ticket.transactionId,
        firstName: ticket.firstName,
        lastName: ticket.lastName,
        phoneHash,
        phoneEncrypted: encryptSensitive(ticket.phone),
        emailHash,
        emailEncrypted: encryptSensitive(ticket.email),
        documentHash,
        documentEncrypted: encryptSensitive(ticket.documentNumber),
        eventId: ticket.eventId,
        amount: ticket.amount,
        status: "approved",
        processor: ticket.processorTicketNumber ? "payphone" : "admin_manual",
        processorTicketNumber: ticket.processorTicketNumber,
        processorResponse: ticket.processorResponse,
        serialNumber,
        qrPayloadEncrypted: encryptedQrPayload,
        activatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      writeJsonFile("tickets", tickets);
    }

    accessDrops.push({
      id: participantId,
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      phoneHash,
      phoneEncrypted: encryptSensitive(ticket.phone),
      emailHash,
      emailEncrypted: encryptSensitive(ticket.email),
      documentHash,
      documentEncrypted: encryptSensitive(ticket.documentNumber),
      eventId: ticket.eventId,
      serialNumber,
      status: "confirmed",
      registeredAt: now,
    });
    writeJsonFile("access_drops", accessDrops);

    const partyPasses = readJsonFile<any>("party_passes");
    partyPasses.push({
      serialNumber,
      codeHash: hashToken(qrToken),
      eventId: ticket.eventId,
      participantId,
      used: false,
      expiresAt,
      qrPayloadEncrypted: encryptedQrPayload,
      type: "FOUNDING_DAWG",
      createdAt: now,
    });
    writeJsonFile("party_passes", partyPasses);

    return {
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      serialNumber,
      qrPayload,
      email: ticket.email,
      phone: ticket.phone,
    };
  }

  // PostgreSQL — check for duplicate, then insert atomically
  const dupRows = await store.db`
    SELECT id FROM access_drops
    WHERE phone_hash = ${phoneHash} AND event_id = ${ticket.eventId} AND status = 'confirmed'
    LIMIT 1
  `;
  if (dupRows.length) {
    throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
  }

  // Update ticket record
  await store.db`
    UPDATE tickets
    SET status = 'approved',
        processor_ticket_number = ${ticket.processorTicketNumber},
        processor_response = ${store.db.json(ticket.processorResponse as any)},
        serial_number = ${serialNumber},
        qr_payload_encrypted = ${encryptedQrPayload},
        activated_at = ${now},
        updated_at = ${now}
    WHERE id = ${ticket.transactionId}
  `;

  // Insert access_drop
  await store.db`
    INSERT INTO access_drops (
      id, first_name, last_name, phone_hash, phone_encrypted,
      email_hash, email_encrypted, document_hash, document_encrypted,
      event_id, serial_number, status, registered_at
    ) VALUES (
      ${participantId}, ${ticket.firstName}, ${ticket.lastName},
      ${phoneHash}, ${encryptSensitive(ticket.phone)},
      ${emailHash}, ${encryptSensitive(ticket.email)},
      ${documentHash}, ${encryptSensitive(ticket.documentNumber)},
      ${ticket.eventId}, ${serialNumber}, 'confirmed', ${now}
    )
  `;

  // Insert party_pass
  await store.db`
    INSERT INTO party_passes (
      serial_number, code_hash, event_id, participant_id,
      used, expires_at, qr_payload_encrypted, type, created_at
    ) VALUES (
      ${serialNumber}, ${hashToken(qrToken)}, ${ticket.eventId}, ${participantId},
      false, ${expiresAt}, ${encryptedQrPayload}, 'FOUNDING_DAWG', ${now}
    )
  `;

  return {
    firstName: ticket.firstName,
    lastName: ticket.lastName,
    serialNumber,
    qrPayload,
    email: ticket.email,
    phone: ticket.phone,
  };
}

// ─── recordTicketResend ───────────────────────────────────────────────────────

export async function recordTicketResend(input: {
  serialNumber: string;
  channel: "email" | "phone" | "both" | "whatsapp";
  ip: string;
  userAgent: string;
}) {
  const store = ensureStore();
  const now = new Date().toISOString();

  if (store.kind === "local-json") {
    const resends = readJsonFile<any>("ticket_resends");
    resends.push({
      serialNumber: input.serialNumber,
      channel: input.channel,
      ipHash: hashLookup(input.ip),
      userAgentHash: hashLookup(input.userAgent),
      createdAt: now,
    });
    writeJsonFile("ticket_resends", resends);
    return;
  }

  await store.db`
    INSERT INTO ticket_resends (serial_number, channel, ip_hash, user_agent_hash, created_at)
    VALUES (${input.serialNumber}, ${input.channel}, ${hashLookup(input.ip)}, ${hashLookup(input.userAgent)}, ${now})
  `;
}

// ─── countRecentResends ───────────────────────────────────────────────────────

export async function countRecentResends(serialNumber: string, windowMs: number): Promise<number> {
  const store = ensureStore();
  const since = new Date(Date.now() - windowMs).toISOString();

  if (store.kind === "local-json") {
    const resends = readJsonFile<any>("ticket_resends");
    return resends.filter(
      (r: any) =>
        (r.serialNumber === serialNumber || r.serial_number === serialNumber) &&
        (r.createdAt || r.created_at) >= since,
    ).length;
  }

  const [row] = await store.db`
    SELECT COUNT(*) AS cnt FROM ticket_resends
    WHERE serial_number = ${serialNumber} AND created_at >= ${since}
  `;
  return Number(row?.cnt || 0);
}

// ─── recoverPassByPhone ───────────────────────────────────────────────────────

export async function recoverPassByPhone(phone: string): Promise<(ActivatedPass & { used: boolean }) | null> {
  const store = ensureStore();
  const phoneHash = hashLookup(sanitizePhone(phone));

  if (store.kind === "local-json") {
    const accessDrops = readJsonFile<any>("access_drops");
    const access = accessDrops.find(
      (ad: any) =>
        (ad.phoneHash === phoneHash || ad.phone_hash === phoneHash || ad.phone === sanitizePhone(phone)) &&
        ad.status === "confirmed",
    );
    if (!access) return null;

    const partyPasses = readJsonFile<any>("party_passes");
    const pass = partyPasses.find(
      (p: any) => p.serialNumber === (access.serialNumber || access.serial_number) ||
                  p.serial_number === (access.serialNumber || access.serial_number),
    );
    if (!pass) throw new ApiError(500, "No se pudo recuperar el QR.", "DB_ERROR");

    return {
      firstName: access.firstName || access.first_name,
      lastName: access.lastName || access.last_name,
      serialNumber: access.serialNumber || access.serial_number,
      qrPayload: decryptSensitive(pass.qrPayloadEncrypted || pass.qr_payload_encrypted),
      used: Boolean(pass.used),
    };
  }

  const [access] = await store.db`
    SELECT first_name, last_name, serial_number
    FROM access_drops
    WHERE phone_hash = ${phoneHash} AND status = 'confirmed'
    ORDER BY registered_at DESC LIMIT 1
  `;
  if (!access) return null;

  const [pass] = await store.db`
    SELECT qr_payload_encrypted, used FROM party_passes
    WHERE serial_number = ${access.serial_number}
  `;
  if (!pass) throw new ApiError(500, "No se pudo recuperar el QR.", "DB_ERROR");

  return {
    firstName: access.first_name,
    lastName: access.last_name,
    serialNumber: access.serial_number,
    qrPayload: decryptSensitive(pass.qr_payload_encrypted),
    used: Boolean(pass.used),
  };
}

// ─── validatePassOnce ─────────────────────────────────────────────────────────

export async function validatePassOnce(input: {
  serialNumber: string;
  token: string;
  eventId: string;
  staffSessionId: string;
  ip: string;
  userAgent: string;
}): Promise<PassValidationResult> {
  const store = ensureStore();
  const now = new Date().toISOString();
  const tokenHash = hashToken(input.token);

  if (store.kind === "local-json") {
    const partyPasses = readJsonFile<any>("party_passes");
    const passIdx = partyPasses.findIndex(
      (p: any) =>
        (p.serialNumber === input.serialNumber || p.serial_number === input.serialNumber) &&
        (p.eventId === input.eventId || p.event_id === input.eventId) &&
        (p.codeHash === tokenHash || p.code_hash === tokenHash),
    );

    if (passIdx === -1) {
      const pass = partyPasses.find(
        (p: any) => p.serialNumber === input.serialNumber || p.serial_number === input.serialNumber,
      );
      if (!pass) return { valid: false, error: "PASE NO ENCONTRADO", reason: "not_found" };
      if ((pass.codeHash || pass.code_hash) !== tokenHash)
        return { valid: false, error: "QR NO COINCIDE CON ESTE PASE", reason: "invalid_token" };
      if (pass.used)
        return { valid: false, error: "QR YA USADO", reason: "used", scannedAt: pass.scannedAt || pass.scanned_at };
      if (new Date(pass.expiresAt || pass.expires_at) <= new Date())
        return { valid: false, error: "PASE EXPIRADO", reason: "expired" };
      return { valid: false, error: "NO SE PUDO VALIDAR EL PASE", reason: "db_unavailable" };
    }

    const pass = partyPasses[passIdx];
    if (pass.used)
      return { valid: false, error: "QR YA USADO", reason: "used", scannedAt: pass.scannedAt || pass.scanned_at };
    if (new Date(pass.expiresAt || pass.expires_at) <= new Date())
      return { valid: false, error: "PASE EXPIRADO", reason: "expired" };

    partyPasses[passIdx].used = true;
    partyPasses[passIdx].scannedAt = now;
    partyPasses[passIdx].scannedBy = input.staffSessionId;
    partyPasses[passIdx].scanIpHash = hashLookup(input.ip);
    partyPasses[passIdx].scanUserAgentHash = hashLookup(input.userAgent);
    writeJsonFile("party_passes", partyPasses);

    return {
      valid: true,
      message: "ACCESO PERMITIDO",
      passInfo: {
        serialNumber: pass.serialNumber || pass.serial_number,
        eventId: pass.eventId || pass.event_id,
        scannedAt: now,
      },
    };
  }

  // PostgreSQL — atomic UPDATE + RETURNING
  const [updated] = await store.db`
    UPDATE party_passes
    SET used = true, scanned_at = ${now}, scanned_by = ${input.staffSessionId},
        scan_ip_hash = ${hashLookup(input.ip)}, scan_user_agent_hash = ${hashLookup(input.userAgent)}
    WHERE serial_number = ${input.serialNumber}
      AND event_id = ${input.eventId}
      AND code_hash = ${tokenHash}
      AND used = false
      AND expires_at > ${now}
    RETURNING serial_number, event_id, scanned_at
  `;

  if (updated) {
    return {
      valid: true,
      message: "ACCESO PERMITIDO",
      passInfo: {
        serialNumber: updated.serial_number,
        eventId: updated.event_id,
        scannedAt: updated.scanned_at || now,
      },
    };
  }

  // UPDATE matched nothing — find out why
  const [pass] = await store.db`
    SELECT code_hash, used, expires_at, scanned_at FROM party_passes
    WHERE serial_number = ${input.serialNumber}
  `;
  if (!pass) return { valid: false, error: "PASE NO ENCONTRADO", reason: "not_found" };
  if (pass.code_hash !== tokenHash) return { valid: false, error: "QR NO COINCIDE CON ESTE PASE", reason: "invalid_token" };
  if (pass.used)
    return { valid: false, error: "QR YA USADO", reason: "used", scannedAt: pass.scanned_at };
  if (new Date(pass.expires_at) <= new Date())
    return { valid: false, error: "PASE EXPIRADO", reason: "expired" };
  return { valid: false, error: "NO SE PUDO VALIDAR EL PASE", reason: "db_unavailable" };
}
