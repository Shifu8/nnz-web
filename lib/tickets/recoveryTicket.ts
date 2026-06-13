import "server-only";

import { adminDb } from "@/lib/firebase/adminApp";
import { getSupabaseAdmin } from "@/lib/supabase";
import { loadAllReceipts } from "@/lib/access-drop/receiptStore";
import type { ReceiptRecord } from "@/lib/access-drop/types";
import {
  decryptSensitive,
  hashLookup,
  parseSecureQrPayload,
  sanitizeEmail,
  secureLog,
} from "@/lib/security";
import {
  eventMatchesActiveEvent,
  type ActiveTicketEvent,
} from "@/lib/tickets/activeEvent";

export type RecoveryTicketSource = "supabase" | "firestore" | "receipt";

export type RecoveryTicket = {
  id: string;
  source: RecoveryTicketSource;
  eventId: string;
  email: string;
  firstName: string;
  lastName: string;
  serialNumber: string;
  qrPayload: string;
  quantity: number;
  status: "APPROVED";
};

function decryptStoredValue(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  return value.startsWith("v1:") ? decryptSensitive(value) : value;
}

function receiptEventId(receipt: ReceiptRecord): string | undefined {
  if (receipt.eventId) return receipt.eventId;
  if (!receipt.qrPayload) return undefined;

  try {
    return parseSecureQrPayload(receipt.qrPayload).eventId;
  } catch {
    return undefined;
  }
}

function receiptToTicket(receipt: ReceiptRecord, event: ActiveTicketEvent): RecoveryTicket | null {
  const eventId = receiptEventId(receipt);
  if (
    receipt.status !== "aprobado" ||
    !receipt.serialNumber ||
    !receipt.qrPayload ||
    !eventMatchesActiveEvent(eventId, event)
  ) {
    return null;
  }

  return {
    id: receipt.id,
    source: "receipt",
    eventId: event.id,
    email: sanitizeEmail(receipt.email),
    firstName: receipt.firstName,
    lastName: receipt.lastName,
    serialNumber: receipt.serialNumber,
    qrPayload: receipt.qrPayload,
    quantity: Math.max(1, receipt.quantity || 1),
    status: "APPROVED",
  };
}

async function findSupabaseTicket(email: string, event: ActiveTicketEvent): Promise<RecoveryTicket | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tickets")
    .select("id,first_name,last_name,email_encrypted,event_id,serial_number,qr_payload_encrypted,status")
    .eq("email_hash", hashLookup(email))
    .eq("status", "approved")
    .in("event_id", event.aliases)
    .not("serial_number", "is", null)
    .not("qr_payload_encrypted", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`RECOVERY_TICKET_LOOKUP_FAILED:${error.message}`);
  if (!data?.serial_number || !data.qr_payload_encrypted) return null;

  return {
    id: String(data.id),
    source: "supabase",
    eventId: String(data.event_id),
    email: sanitizeEmail(decryptStoredValue(data.email_encrypted)),
    firstName: String(data.first_name || ""),
    lastName: String(data.last_name || ""),
    serialNumber: String(data.serial_number),
    qrPayload: decryptStoredValue(data.qr_payload_encrypted),
    quantity: 1,
    status: "APPROVED",
  };
}

async function getSupabaseTicket(id: string, event: ActiveTicketEvent): Promise<RecoveryTicket | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tickets")
    .select("id,first_name,last_name,email_encrypted,event_id,serial_number,qr_payload_encrypted,status")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw new Error(`RECOVERY_TICKET_READ_FAILED:${error.message}`);
  if (
    !data?.serial_number ||
    !data.qr_payload_encrypted ||
    !eventMatchesActiveEvent(String(data.event_id), event)
  ) {
    return null;
  }

  return {
    id: String(data.id),
    source: "supabase",
    eventId: String(data.event_id),
    email: sanitizeEmail(decryptStoredValue(data.email_encrypted)),
    firstName: String(data.first_name || ""),
    lastName: String(data.last_name || ""),
    serialNumber: String(data.serial_number),
    qrPayload: decryptStoredValue(data.qr_payload_encrypted),
    quantity: 1,
    status: "APPROVED",
  };
}

async function findFirestoreTicket(email: string, event: ActiveTicketEvent): Promise<RecoveryTicket | null> {
  if (!adminDb) return null;

  const snapshot = await adminDb
    .collection("tickets")
    .where("emailHash", "==", hashLookup(email))
    .where("status", "==", "approved")
    .limit(10)
    .get();

  const match = snapshot.docs.find((doc) => eventMatchesActiveEvent(doc.data().eventId, event));
  if (!match) return null;

  const data = match.data();
  if (!data.serialNumber || !data.qrPayloadEncrypted) return null;

  return {
    id: match.id,
    source: "firestore",
    eventId: String(data.eventId),
    email: sanitizeEmail(decryptStoredValue(data.emailEncrypted)),
    firstName: String(data.firstName || ""),
    lastName: String(data.lastName || ""),
    serialNumber: String(data.serialNumber),
    qrPayload: decryptStoredValue(data.qrPayloadEncrypted),
    quantity: 1,
    status: "APPROVED",
  };
}

async function getFirestoreTicket(id: string, event: ActiveTicketEvent): Promise<RecoveryTicket | null> {
  if (!adminDb) return null;

  const snapshot = await adminDb.collection("tickets").doc(id).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() || {};
  if (
    data.status !== "approved" ||
    !data.serialNumber ||
    !data.qrPayloadEncrypted ||
    !eventMatchesActiveEvent(data.eventId, event)
  ) {
    return null;
  }

  return {
    id: snapshot.id,
    source: "firestore",
    eventId: String(data.eventId),
    email: sanitizeEmail(decryptStoredValue(data.emailEncrypted)),
    firstName: String(data.firstName || ""),
    lastName: String(data.lastName || ""),
    serialNumber: String(data.serialNumber),
    qrPayload: decryptStoredValue(data.qrPayloadEncrypted),
    quantity: 1,
    status: "APPROVED",
  };
}

function findReceiptTicket(email: string, event: ActiveTicketEvent): RecoveryTicket | null {
  return loadAllReceipts()
    .filter((receipt) => sanitizeEmail(receipt.email) === email)
    .sort(
      (left, right) =>
        new Date(right.reviewedAt || right.createdAt).getTime() -
        new Date(left.reviewedAt || left.createdAt).getTime(),
    )
    .map((receipt) => receiptToTicket(receipt, event))
    .find((ticket): ticket is RecoveryTicket => Boolean(ticket)) || null;
}

async function tryTicketSource(
  source: Exclude<RecoveryTicketSource, "receipt">,
  lookup: () => Promise<RecoveryTicket | null>,
): Promise<RecoveryTicket | null> {
  try {
    return await lookup();
  } catch (error) {
    secureLog("[RECOVERY] Ticket source unavailable", {
      source,
      reason: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function findRecoverableTicketByEmail(
  rawEmail: string,
  event: ActiveTicketEvent,
): Promise<RecoveryTicket | null> {
  const email = sanitizeEmail(rawEmail);
  return (
    (await tryTicketSource("supabase", () => findSupabaseTicket(email, event))) ||
    (await tryTicketSource("firestore", () => findFirestoreTicket(email, event))) ||
    findReceiptTicket(email, event)
  );
}

export async function getRecoverableTicket(
  source: RecoveryTicketSource,
  id: string,
  event: ActiveTicketEvent,
): Promise<RecoveryTicket | null> {
  if (source === "supabase") return getSupabaseTicket(id, event);
  if (source === "firestore") return getFirestoreTicket(id, event);

  const receipt = loadAllReceipts().find((item) => item.id === id);
  return receipt ? receiptToTicket(receipt, event) : null;
}
