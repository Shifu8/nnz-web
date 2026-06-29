import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/adminApp";
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

async function loadPendingTicketForActivation(transactionId: string): Promise<ActivateTicketInput> {
  const store = ensureStore();

  if (store.kind === "supabase") {
    const { data, error } = await store.supabase
      .from("tickets")
      .select(
        "id,status,first_name,last_name,phone_encrypted,email_encrypted,document_encrypted,event_id,amount,serial_number,qr_payload_encrypted",
      )
      .eq("id", transactionId)
      .maybeSingle();
    if (error || !data) throw new ApiError(404, "Orden no encontrada.", "TICKET_NOT_FOUND");

    if (data.status === "approved" && data.serial_number && data.qr_payload_encrypted) {
      return {
        transactionId,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: decryptSensitive(data.phone_encrypted),
        email: decryptSensitive(data.email_encrypted),
        documentNumber: decryptSensitive(data.document_encrypted),
        eventId: data.event_id,
        amount: Number(data.amount),
        processorTicketNumber: transactionId,
        processorResponse: {},
        fromPendingOnly: true,
      };
    }

    if (data.status !== "pending") {
      throw new ApiError(409, "La orden ya fue procesada.", "TICKET_ALREADY_PROCESSED");
    }

    return {
      transactionId,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: decryptSensitive(data.phone_encrypted),
      email: decryptSensitive(data.email_encrypted),
      documentNumber: decryptSensitive(data.document_encrypted),
      eventId: data.event_id,
      amount: Number(data.amount),
      processorTicketNumber: transactionId,
      processorResponse: {},
      fromPendingOnly: true,
    };
  }

  const doc = await store.db.collection("tickets").doc(transactionId).get();
  if (!doc.exists) throw new ApiError(404, "Orden no encontrada.", "TICKET_NOT_FOUND");
  const data = doc.data() || {};

  if (data.status === "approved" && data.serialNumber) {
    return {
      transactionId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: decryptSensitive(data.phoneEncrypted),
      email: decryptSensitive(data.emailEncrypted),
      documentNumber: decryptSensitive(data.documentEncrypted),
      eventId: data.eventId,
      amount: Number(data.amount),
      processorTicketNumber: String(data.processorTicketNumber || transactionId),
      processorResponse: data.processorResponse || {},
      fromPendingOnly: true,
    };
  }

  if (data.status !== "pending") {
    throw new ApiError(409, "La orden ya fue procesada.", "TICKET_ALREADY_PROCESSED");
  }

  return {
    transactionId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: decryptSensitive(data.phoneEncrypted),
    email: decryptSensitive(data.emailEncrypted),
    documentNumber: decryptSensitive(data.documentEncrypted),
    eventId: data.eventId,
    amount: Number(data.amount),
    processorTicketNumber: transactionId,
    processorResponse: {},
    fromPendingOnly: true,
  };
}

export async function getActivatedPassByTransactionId(transactionId: string): Promise<ActivatedPass | null> {
  const store = ensureStore();

  if (store.kind === "supabase") {
    const { data } = await store.supabase
      .from("tickets")
      .select("first_name,last_name,serial_number,qr_payload_encrypted,status,phone_encrypted,email_encrypted")
      .eq("id", transactionId)
      .eq("status", "approved")
      .maybeSingle();
    if (!data?.serial_number || !data.qr_payload_encrypted) return null;
    return {
      firstName: data.first_name,
      lastName: data.last_name,
      serialNumber: data.serial_number,
      qrPayload: decryptSensitive(data.qr_payload_encrypted),
      email: decryptSensitive(data.email_encrypted),
      phone: decryptSensitive(data.phone_encrypted),
    };
  }

  const doc = await store.db.collection("tickets").doc(transactionId).get();
  const data = doc.data();
  if (!doc.exists || data?.status !== "approved" || !data.serialNumber) return null;
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    serialNumber: data.serialNumber,
    qrPayload: data.qrPayloadEncrypted ? decryptSensitive(data.qrPayloadEncrypted) : "",
    email: decryptSensitive(data.emailEncrypted),
    phone: decryptSensitive(data.phoneEncrypted),
  };
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  if (url.includes("your-project-id") || serviceKey === "your-supabase-service-role-key") return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function ensureStore() {
  const supabase = getSupabase();
  if (supabase) return { kind: "supabase" as const, supabase };
  if (adminDb) return { kind: "firestore" as const, db: adminDb };
  throw new ApiError(503, "Base de datos no configurada. Configura Supabase o Firebase Admin.", "DB_UNAVAILABLE");
}

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

async function assertNoActivePassForPhone(phoneHash: string, eventId: string) {
  const store = ensureStore();

  if (store.kind === "supabase") {
    const { data, error } = await store.supabase
      .from("access_drops")
      .select("id")
      .eq("phone_hash", phoneHash)
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .limit(1);
    if (error) {
      if (process.env.PAYPHONE_DEMO_MODE === "true") return;
      throw new ApiError(500, "No se pudo verificar disponibilidad.", "DB_ERROR");
    }
    if (data?.length) throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
    return;
  }

  const existing = await store.db
    .collection("accessDrops")
    .where("phoneHash", "==", phoneHash)
    .where("eventId", "==", eventId)
    .where("status", "==", "confirmed")
    .limit(1)
    .get();
  if (!existing.empty) throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
}

export async function createPendingTicket(input: PendingTicketInput) {
  const ticket = normalizeTicket(input) as PendingTicketInput;
  const store = ensureStore();
  const now = new Date().toISOString();
  const phoneHash = hashLookup(ticket.phone);
  const emailHash = hashLookup(ticket.email);
  const documentHash = hashLookup(ticket.documentNumber);

  await assertNoActivePassForPhone(phoneHash, ticket.eventId);

  const record = {
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
  };

  if (store.kind === "supabase") {
    const { error } = await store.supabase.from("tickets").insert({
      id: record.id,
      first_name: record.firstName,
      last_name: record.lastName,
      phone_hash: record.phoneHash,
      phone_encrypted: record.phoneEncrypted,
      email_hash: record.emailHash,
      email_encrypted: record.emailEncrypted,
      document_hash: record.documentHash,
      document_encrypted: record.documentEncrypted,
      event_id: record.eventId,
      amount: record.amount,
      status: record.status,
      processor: record.processor,
      payment_token_hash: record.paymentTokenHash,
      ip_hash: record.ipHash,
      user_agent_hash: record.userAgentHash,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    });
    if (error) {
      if (process.env.PAYPHONE_DEMO_MODE === "true") return;
      throw new ApiError(500, "No se pudo registrar la orden.", "DB_ERROR");
    }
    return;
  }

  await store.db.collection("tickets").doc(ticket.transactionId).set(record, { merge: false });
}

export async function fulfillApprovedTicketFromWebhook(input: {
  transactionId: string;
  processorTicketNumber: string;
  processorResponse: unknown;
}): Promise<{ fulfilled: boolean; alreadyFulfilled?: boolean }> {
  const store = ensureStore();

  if (store.kind === "supabase") {
    const { data: ticket, error } = await store.supabase
      .from("tickets")
      .select(
        "id,status,first_name,last_name,phone_encrypted,email_encrypted,document_encrypted,event_id,amount,serial_number",
      )
      .eq("id", input.transactionId)
      .maybeSingle();

    if (error) throw new ApiError(500, "No se pudo consultar la orden.", "DB_ERROR");
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

  const ticketDoc = await store.db.collection("tickets").doc(input.transactionId).get();
  if (!ticketDoc.exists) return { fulfilled: false };

  const ticket = ticketDoc.data() || {};
  if (ticket.status === "approved" && ticket.serialNumber) {
    return { fulfilled: false, alreadyFulfilled: true };
  }

  if (ticket.status !== "pending") {
    return { fulfilled: false };
  }

  await activateTicket({
    transactionId: input.transactionId,
    firstName: ticket.firstName,
    lastName: ticket.lastName,
    phone: decryptSensitive(ticket.phoneEncrypted),
    email: decryptSensitive(ticket.emailEncrypted),
    documentNumber: decryptSensitive(ticket.documentEncrypted),
    eventId: ticket.eventId,
    amount: Number(ticket.amount),
    processorTicketNumber: input.processorTicketNumber,
    processorResponse: input.processorResponse,
  });

  return { fulfilled: true };
}

export async function markTicketDeclined(input: DeclineTicketInput) {
  const store = ensureStore();
  const now = new Date().toISOString();
  const safeReason = input.reason.slice(0, 240);

  if (store.kind === "supabase") {
    await store.supabase
      .from("tickets")
      .update({
        status: "declined",
        decline_reason: safeReason,
        processor_response: input.processorResponse ?? null,
        updated_at: now,
      })
      .eq("id", input.transactionId);
    return;
  }

  await store.db.collection("tickets").doc(input.transactionId).set(
    {
      status: "declined",
      declineReason: safeReason,
      processorResponse: input.processorResponse ?? null,
      updatedAt: now,
    },
    { merge: true },
  );
}

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

  if (store.kind === "supabase") {
    const { data: existingDup, error: dupError } = await store.supabase
      .from("access_drops")
      .select("id")
      .eq("phone_hash", phoneHash)
      .eq("event_id", ticket.eventId)
      .eq("status", "confirmed")
      .limit(1);
    if (!dupError && existingDup?.length) {
      throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
    }

    const { error: ticketError } = await store.supabase
      .from("tickets")
      .update({
        status: "approved",
        processor_ticket_number: ticket.processorTicketNumber,
        processor_response: ticket.processorResponse,
        serial_number: serialNumber,
        qr_payload_encrypted: encryptedQrPayload,
        activated_at: now,
        updated_at: now,
      })
      .eq("id", ticket.transactionId);
    if (ticketError) {
      if (process.env.PAYPHONE_DEMO_MODE === "true") return { firstName: ticket.firstName, lastName: ticket.lastName, serialNumber, qrPayload, email: ticket.email, phone: ticket.phone };
      throw new ApiError(500, "Pago aprobado, pero no se pudo activar el ticket.", "DB_ERROR");
    }

    const { error: accessError } = await store.supabase.from("access_drops").insert({
      id: participantId,
      first_name: ticket.firstName,
      last_name: ticket.lastName,
      phone_hash: phoneHash,
      phone_encrypted: encryptSensitive(ticket.phone),
      email_hash: emailHash,
      email_encrypted: encryptSensitive(ticket.email),
      document_hash: documentHash,
      document_encrypted: encryptSensitive(ticket.documentNumber),
      event_id: ticket.eventId,
      serial_number: serialNumber,
      status: "confirmed",
      registered_at: now,
    });
    if (accessError) {
      if (process.env.PAYPHONE_DEMO_MODE === "true") return { firstName: ticket.firstName, lastName: ticket.lastName, serialNumber, qrPayload, email: ticket.email, phone: ticket.phone };
      throw new ApiError(500, "Pago aprobado, pero no se pudo crear el acceso.", "DB_ERROR");
    }

    const { error: passError } = await store.supabase.from("party_passes").insert({
      serial_number: serialNumber,
      code_hash: hashToken(qrToken),
      event_id: ticket.eventId,
      participant_id: participantId,
      used: false,
      expires_at: expiresAt,
      qr_payload_encrypted: encryptedQrPayload,
      type: "FOUNDING_DAWG",
      created_at: now,
    });
    if (passError) {
      if (process.env.PAYPHONE_DEMO_MODE === "true") return { firstName: ticket.firstName, lastName: ticket.lastName, serialNumber, qrPayload, email: ticket.email, phone: ticket.phone };
      throw new ApiError(500, "Pago aprobado, pero no se pudo crear el QR.", "DB_ERROR");
    }

    return {
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      serialNumber,
      qrPayload,
      email: ticket.email,
      phone: ticket.phone,
    };
  }

  await store.db.runTransaction(async (transaction) => {
    const duplicateQuery = store.db
      .collection("accessDrops")
      .where("phoneHash", "==", phoneHash)
      .where("eventId", "==", ticket.eventId)
      .where("status", "==", "confirmed")
      .limit(1);
    const duplicate = await transaction.get(duplicateQuery);
    if (!duplicate.empty) {
      throw new ApiError(409, "Este telefono ya tiene un ticket activo.", "DUPLICATE_TICKET");
    }

    const ticketRef = store.db.collection("tickets").doc(ticket.transactionId);
    const accessRef = store.db.collection("accessDrops").doc(participantId);
    const passRef = store.db.collection("partyPasses").doc(serialNumber);

    transaction.set(
      ticketRef,
      {
        status: "approved",
        processorTicketNumber: ticket.processorTicketNumber,
        processorResponse: ticket.processorResponse,
        serialNumber,
        qrPayloadEncrypted: encryptedQrPayload,
        activatedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    transaction.set(accessRef, {
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

    transaction.set(passRef, {
      id: serialNumber,
      codeHash: hashToken(qrToken),
      eventId: ticket.eventId,
      participantId,
      used: false,
      expiresAt,
      qrPayloadEncrypted: encryptedQrPayload,
      type: "FOUNDING_DAWG",
      createdAt: now,
    });
  });

  return {
    firstName: ticket.firstName,
    lastName: ticket.lastName,
    serialNumber,
    qrPayload,
    email: ticket.email,
    phone: ticket.phone,
  };
}

export async function recordTicketResend(input: {
  serialNumber: string;
  channel: "email" | "phone" | "both" | "whatsapp";
  ip: string;
  userAgent: string;
}) {
  const store = ensureStore();
  const now = new Date().toISOString();
  const record = {
    serial_number: input.serialNumber,
    channel: input.channel,
    ip_hash: hashLookup(input.ip),
    user_agent_hash: hashLookup(input.userAgent),
    created_at: now,
  };

  if (store.kind === "supabase") {
    await store.supabase.from("ticket_resends").insert(record);
    return;
  }

  await store.db.collection("ticketResends").add({
    serialNumber: input.serialNumber,
    channel: input.channel,
    ipHash: record.ip_hash,
    userAgentHash: record.user_agent_hash,
    createdAt: now,
  });
}

export async function countRecentResends(serialNumber: string, windowMs: number): Promise<number> {
  const store = ensureStore();
  const since = new Date(Date.now() - windowMs).toISOString();

  if (store.kind === "supabase") {
    const { count, error } = await store.supabase
      .from("ticket_resends")
      .select("serial_number", { count: "exact", head: true })
      .eq("serial_number", serialNumber)
      .gte("created_at", since);
    if (error) return 0;
    return count || 0;
  }

  const snap = await store.db
    .collection("ticketResends")
    .where("serialNumber", "==", serialNumber)
    .where("createdAt", ">=", since)
    .get();
  return snap.size;
}

export async function recoverPassByPhone(phone: string): Promise<(ActivatedPass & { used: boolean }) | null> {
  const store = ensureStore();
  const phoneHash = hashLookup(sanitizePhone(phone));

  if (store.kind === "supabase") {
    const { data: access, error } = await store.supabase
      .from("access_drops")
      .select("first_name,last_name,serial_number")
      .eq("phone_hash", phoneHash)
      .eq("status", "confirmed")
      .order("registered_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new ApiError(500, "No se pudo recuperar el acceso.", "DB_ERROR");
    if (!access) return null;

    const { data: pass, error: passError } = await store.supabase
      .from("party_passes")
      .select("qr_payload_encrypted,used")
      .eq("serial_number", access.serial_number)
      .maybeSingle();
    if (passError || !pass) throw new ApiError(500, "No se pudo recuperar el QR.", "DB_ERROR");

    return {
      firstName: access.first_name,
      lastName: access.last_name,
      serialNumber: access.serial_number,
      qrPayload: decryptSensitive(pass.qr_payload_encrypted),
      used: Boolean(pass.used),
    };
  }

  let accessSnap = await store.db
    .collection("accessDrops")
    .where("phoneHash", "==", phoneHash)
    .where("status", "==", "confirmed")
    .limit(1)
    .get();

  if (accessSnap.empty) {
    accessSnap = await store.db.collection("accessDrops").where("phone", "==", sanitizePhone(phone)).limit(1).get();
  }

  if (accessSnap.empty) return null;

  const access = accessSnap.docs[0].data();
  const passDoc = await store.db.collection("partyPasses").doc(access.serialNumber).get();
  if (!passDoc.exists) throw new ApiError(500, "No se pudo recuperar el QR.", "DB_ERROR");

  const pass = passDoc.data() || {};
  return {
    firstName: access.firstName,
    lastName: access.lastName,
    serialNumber: access.serialNumber,
    qrPayload: pass.qrPayloadEncrypted ? decryptSensitive(pass.qrPayloadEncrypted) : pass.qrPayload,
    used: Boolean(pass.used),
  };
}

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

  if (store.kind === "supabase") {
    const { data, error } = await store.supabase
      .from("party_passes")
      .update({
        used: true,
        scanned_at: now,
        scanned_by: input.staffSessionId,
        scan_ip_hash: hashLookup(input.ip),
        scan_user_agent_hash: hashLookup(input.userAgent),
      })
      .eq("serial_number", input.serialNumber)
      .eq("event_id", input.eventId)
      .eq("code_hash", tokenHash)
      .eq("used", false)
      .gt("expires_at", now)
      .select("serial_number,event_id,scanned_at")
      .maybeSingle();

    if (error) throw new ApiError(500, "No se pudo validar el pase.", "DB_ERROR");
    if (data) {
      return {
        valid: true,
        message: "ACCESO PERMITIDO",
        passInfo: { serialNumber: data.serial_number, eventId: data.event_id, scannedAt: data.scanned_at || now },
      };
    }

    const { data: pass } = await store.supabase
      .from("party_passes")
      .select("code_hash,used,expires_at,scanned_at")
      .eq("serial_number", input.serialNumber)
      .maybeSingle();

    if (!pass) return { valid: false, error: "PASE NO ENCONTRADO", reason: "not_found" };
    if (pass.code_hash !== tokenHash) return { valid: false, error: "QR NO COINCIDE CON ESTE PASE", reason: "invalid_token" };
    if (pass.used) return { valid: false, error: "QR YA USADO", reason: "used", scannedAt: pass.scanned_at };
    if (new Date(pass.expires_at) <= new Date()) return { valid: false, error: "PASE EXPIRADO", reason: "expired" };
    return { valid: false, error: "NO SE PUDO VALIDAR EL PASE", reason: "db_unavailable" };
  }

  const passRef = store.db.collection("partyPasses").doc(input.serialNumber);

  return store.db.runTransaction(async (transaction) => {
    const passDoc = await transaction.get(passRef);
    if (!passDoc.exists) return { valid: false, error: "PASE NO ENCONTRADO", reason: "not_found" };

    const pass = passDoc.data() || {};
    const storedHash = pass.codeHash;
    const legacyToken = pass.code;

    if (storedHash ? storedHash !== tokenHash : legacyToken !== input.token) {
      return { valid: false, error: "QR NO COINCIDE CON ESTE PASE", reason: "invalid_token" };
    }

    if (pass.used) {
      return { valid: false, error: "QR YA USADO", reason: "used", scannedAt: pass.scannedAt };
    }

    if (new Date(pass.expiresAt) <= new Date()) {
      return { valid: false, error: "PASE EXPIRADO", reason: "expired" };
    }

    transaction.update(passRef, {
      used: true,
      scannedAt: now,
      scannedBy: input.staffSessionId,
      scanIpHash: hashLookup(input.ip),
      scanUserAgentHash: hashLookup(input.userAgent),
    });

    return {
      valid: true,
      message: "ACCESO PERMITIDO",
      passInfo: {
        serialNumber: input.serialNumber,
        eventId: input.eventId,
        scannedAt: now,
      },
    };
  });
}
