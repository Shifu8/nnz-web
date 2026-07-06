import "server-only";

import { getDbOrNull } from "@/lib/db/postgres";
import { readJsonFile } from "@/lib/db/passStore";
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

export type RecoveryTicketSource = "postgres" | "receipt";

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
  ticketDesign?: string;
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
    ticketDesign: receipt.ticketDesign,
  };
}

async function findPostgresTicket(email: string, event: ActiveTicketEvent): Promise<RecoveryTicket | null> {
  const db = getDbOrNull();
  if (!db) {
    // local-json fallback
    const tickets = readJsonFile<any>("tickets");
    const data = tickets.find(
      (t: any) =>
        t.emailHash === hashLookup(email) &&
        t.status === "approved" &&
        eventMatchesActiveEvent(t.eventId || t.event_id, event) &&
        (t.serialNumber || t.serial_number) &&
        (t.qrPayloadEncrypted || t.qr_payload_encrypted)
    );
    if (!data) return null;
    return {
      id: data.id,
      source: "postgres",
      eventId: data.eventId || data.event_id,
      email: sanitizeEmail(decryptStoredValue(data.emailEncrypted || data.email_encrypted)),
      firstName: String(data.firstName || data.first_name || ""),
      lastName: String(data.lastName || data.last_name || ""),
      serialNumber: data.serialNumber || data.serial_number,
      qrPayload: decryptStoredValue(data.qrPayloadEncrypted || data.qr_payload_encrypted),
      quantity: 1,
      status: "APPROVED",
    };
  }

  const rows = await db`
    SELECT id, first_name, last_name, email_encrypted, event_id, serial_number, qr_payload_encrypted, status
    FROM tickets
    WHERE email_hash = ${hashLookup(email)}
      AND status = 'approved'
      AND event_id IN (${event.aliases})
      AND serial_number IS NOT NULL
      AND qr_payload_encrypted IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const data = rows[0];
  if (!data?.serial_number || !data.qr_payload_encrypted) return null;

  return {
    id: String(data.id),
    source: "postgres",
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

async function getPostgresTicket(id: string, event: ActiveTicketEvent): Promise<RecoveryTicket | null> {
  const db = getDbOrNull();
  if (!db) {
    // local-json fallback
    const tickets = readJsonFile<any>("tickets");
    const data = tickets.find((t: any) => t.id === id);
    if (
      !data ||
      data.status !== "approved" ||
      !(data.serialNumber || data.serial_number) ||
      !(data.qrPayloadEncrypted || data.qr_payload_encrypted) ||
      !eventMatchesActiveEvent(data.eventId || data.event_id, event)
    ) {
      return null;
    }
    return {
      id: data.id,
      source: "postgres",
      eventId: data.eventId || data.event_id,
      email: sanitizeEmail(decryptStoredValue(data.emailEncrypted || data.email_encrypted)),
      firstName: String(data.firstName || data.first_name || ""),
      lastName: String(data.lastName || data.last_name || ""),
      serialNumber: data.serialNumber || data.serial_number,
      qrPayload: decryptStoredValue(data.qrPayloadEncrypted || data.qr_payload_encrypted),
      quantity: 1,
      status: "APPROVED",
    };
  }

  const [data] = await db`
    SELECT id, first_name, last_name, email_encrypted, event_id, serial_number, qr_payload_encrypted, status
    FROM tickets
    WHERE id = ${id} AND status = 'approved'
  `;

  if (
    !data?.serial_number ||
    !data.qr_payload_encrypted ||
    !eventMatchesActiveEvent(String(data.event_id), event)
  ) {
    return null;
  }

  return {
    id: String(data.id),
    source: "postgres",
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
    (await tryTicketSource("postgres", () => findPostgresTicket(email, event))) ||
    findReceiptTicket(email, event)
  );
}

export async function getRecoverableTicket(
  source: RecoveryTicketSource,
  id: string,
  event: ActiveTicketEvent,
): Promise<RecoveryTicket | null> {
  if (source === "postgres") return getPostgresTicket(id, event);

  const receipt = loadAllReceipts().find((item) => item.id === id);
  return receipt ? receiptToTicket(receipt, event) : null;
}
