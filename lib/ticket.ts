import crypto from "crypto";
import { requireSupabase } from "./supabase";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (requireSupabase().from("tickets") as any);

export async function createTicket(input: TicketInput): Promise<Ticket> {
  const id = crypto.randomUUID();
  const ticketCode = generateTicketCode();
  const serialNumber = generateSerial(id);

  const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://nenez.vercel.app"}/ticket/${ticketCode}`;
  const qrPng = await generateTicketQrPng(ticketUrl);
  const qrBase64 = qrPng.toString("base64");
  const qrDataUri = `data:image/png;base64,${qrBase64}`;

  const now = new Date().toISOString();

  const { error } = await db().insert({
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

  if (error) {
    secureLog("[TICKET] DB insert error", { error: error.message });
    throw new Error("No se pudo crear el ticket en la base de datos.");
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
  const { data, error } = await db()
    .select("*")
    .eq("ticket_code", ticketCode)
    .maybeSingle();

  if (error || !data) return null;

  return {
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
  };
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const { data, error } = await db()
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
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
  };
}

export async function validateTicket(ticketCode: string): Promise<{ valid: boolean; ticket?: Ticket; error?: string }> {
  const { data, error } = await db()
    .select("*")
    .eq("ticket_code", ticketCode)
    .maybeSingle();

  if (error || !data) {
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

  const { error } = await db()
    .update({ status: "used", updated_at: now })
    .eq("ticket_code", ticketCode)
    .eq("status", "valid");

  if (error) {
    throw new Error("No se pudo marcar el ticket como usado.");
  }

  secureLog("[TICKET] Marked as used", { ticketCode });
}
