import "server-only";

import crypto from "crypto";
import { getDbOrNull } from "@/lib/db/postgres";
import { readJsonFile, writeJsonFile } from "@/lib/db/passStore";
import { generateTicketQrPng } from "../utils/qr";
import { secureLog } from "./security";

export interface TicketInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventId: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventId: string;
  status: "valid" | "used" | "revoked";
  qrCode: string;
  createdAt: string;
}

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

function generateSerial(transactionId: string): string {
  const short = transactionId.split("-")[0].toUpperCase().slice(0, 4);
  const num = crypto.randomInt(1000, 9999);
  return `NENEZ-${num}-${short}`;
}

export async function createTicket(input: TicketInput): Promise<Ticket> {
  const id = crypto.randomUUID();
  const ticketCode = generateTicketCode();
  const serialNumber = generateSerial(id);

  const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://nenez.vercel.app"}/ticket/${ticketCode}`;
  const qrPng = await generateTicketQrPng(ticketUrl);
  const qrBase64 = qrPng.toString("base64");
  const qrDataUri = `data:image/png;base64,${qrBase64}`;

  const now = new Date().toISOString();
  const db = getDbOrNull();

  if (db) {
    try {
      await db`
        INSERT INTO web_tickets (
          id, ticket_code, serial_number, first_name, last_name,
          email, phone, event_id, status, qr_code, created_at, updated_at
        ) VALUES (
          ${id}, ${ticketCode}, ${serialNumber}, ${input.firstName}, ${input.lastName},
          ${input.email}, ${input.phone}, ${input.eventId}, 'valid', ${qrDataUri}, ${now}, ${now}
        )
      `;
    } catch (error: any) {
      secureLog("[TICKET] DB insert error", { error: error.message });
      throw new Error("No se pudo crear el ticket en la base de datos.");
    }
  } else {
    // local-json fallback
    const tickets = readJsonFile<any>("web_tickets");
    tickets.push({
      id,
      ticket_code: ticketCode,
      serial_number: serialNumber,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      event_id: input.eventId,
      status: "valid",
      qr_code: qrDataUri,
      created_at: now,
      updated_at: now,
    });
    writeJsonFile("web_tickets", tickets);
  }

  secureLog("[TICKET] Created", { id, ticketCode, serialNumber });

  return {
    id,
    ticketCode,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    eventId: input.eventId,
    status: "valid",
    qrCode: qrDataUri,
    createdAt: now,
  };
}

export async function getTicketByCode(ticketCode: string): Promise<Ticket | null> {
  const db = getDbOrNull();

  if (db) {
    const [row] = await db`
      SELECT id, ticket_code, first_name, last_name, email, phone, event_id, status, qr_code, created_at
      FROM web_tickets
      WHERE ticket_code = ${ticketCode}
      LIMIT 1
    `;
    if (!row) return null;
    return {
      id: String(row.id),
      ticketCode: String(row.ticket_code),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      email: String(row.email),
      phone: String(row.phone),
      eventId: String(row.event_id),
      status: String(row.status) as Ticket["status"],
      qrCode: String(row.qr_code),
      createdAt: String(row.created_at),
    };
  }

  // local-json fallback
  const tickets = readJsonFile<any>("web_tickets");
  const row = tickets.find((t: any) => t.ticket_code === ticketCode);
  if (!row) return null;
  return {
    id: String(row.id),
    ticketCode: String(row.ticket_code),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    phone: String(row.phone),
    eventId: String(row.event_id),
    status: String(row.status) as Ticket["status"],
    qrCode: String(row.qr_code),
    createdAt: String(row.created_at),
  };
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const db = getDbOrNull();

  if (db) {
    const [row] = await db`
      SELECT id, ticket_code, first_name, last_name, email, phone, event_id, status, qr_code, created_at
      FROM web_tickets
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!row) return null;
    return {
      id: String(row.id),
      ticketCode: String(row.ticket_code),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      email: String(row.email),
      phone: String(row.phone),
      eventId: String(row.event_id),
      status: String(row.status) as Ticket["status"],
      qrCode: String(row.qr_code),
      createdAt: String(row.created_at),
    };
  }

  // local-json fallback
  const tickets = readJsonFile<any>("web_tickets");
  const row = tickets.find((t: any) => t.id === id);
  if (!row) return null;
  return {
    id: String(row.id),
    ticketCode: String(row.ticket_code),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    phone: String(row.phone),
    eventId: String(row.event_id),
    status: String(row.status) as Ticket["status"],
    qrCode: String(row.qr_code),
    createdAt: String(row.created_at),
  };
}

export async function validateTicket(ticketCode: string): Promise<{ valid: boolean; ticket?: Ticket; error?: string }> {
  const db = getDbOrNull();
  let data: any = null;

  if (db) {
    const [row] = await db`
      SELECT id, ticket_code, first_name, last_name, email, phone, event_id, status, qr_code, created_at
      FROM web_tickets
      WHERE ticket_code = ${ticketCode}
      LIMIT 1
    `;
    data = row;
  } else {
    // local-json fallback
    const tickets = readJsonFile<any>("web_tickets");
    data = tickets.find((t: any) => t.ticket_code === ticketCode);
  }

  if (!data) {
    return { valid: false, error: "Ticket no encontrado." };
  }

  if (data.status === "used") {
    return { valid: false, error: "Este ticket ya fue usado." };
  }

  if (data.status === "revoked") {
    return { valid: false, error: "Este ticket fue revocado." };
  }

  return {
    valid: true,
    ticket: {
      id: String(data.id),
      ticketCode: String(data.ticket_code),
      firstName: String(data.first_name),
      lastName: String(data.last_name),
      email: String(data.email),
      phone: String(data.phone),
      eventId: String(data.event_id),
      status: String(data.status) as Ticket["status"],
      qrCode: String(data.qr_code),
      createdAt: String(data.created_at),
    },
  };
}

export async function markTicketUsed(ticketCode: string): Promise<void> {
  const now = new Date().toISOString();
  const db = getDbOrNull();

  if (db) {
    await db`
      UPDATE web_tickets
      SET status = 'used', updated_at = ${now}
      WHERE ticket_code = ${ticketCode} AND status = 'valid'
    `;
  } else {
    // local-json fallback
    const tickets = readJsonFile<any>("web_tickets");
    const idx = tickets.findIndex((t: any) => t.ticket_code === ticketCode && t.status === "valid");
    if (idx === -1) {
      throw new Error("No se pudo marcar el ticket como usado.");
    }
    tickets[idx].status = "used";
    tickets[idx].updated_at = now;
    writeJsonFile("web_tickets", tickets);
  }

  secureLog("[TICKET] Marked as used", { ticketCode });
}
