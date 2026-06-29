import "server-only";

import { jwtVerify, SignJWT } from "jose";
import type { ActiveTicketEvent } from "@/lib/tickets/activeEvent";
import type { RecoveryTicket, RecoveryTicketSource } from "@/lib/tickets/recoveryTicket";

const encoder = new TextEncoder();
const ISSUER = "nenez-ticket-recovery";
const AUDIENCE = "nenez-ticket-holder";

export type RecoveryTokenPayload = {
  ticketId: string;
  ticketSource: RecoveryTicketSource;
  eventId: string;
  emailHash: string;
};

function recoverySecret(): Uint8Array {
  const value =
    process.env.TICKET_RECOVERY_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.QR_HASH_SECRET?.trim();

  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("TICKET_RECOVERY_SECRET is required in production.");
  }

  return encoder.encode(value || "dev-only-nenez-ticket-recovery-secret");
}

export async function createRecoveryToken(
  ticket: RecoveryTicket,
  event: ActiveTicketEvent,
  emailHash: string,
): Promise<string> {
  return new SignJWT({
    ticketId: ticket.id,
    ticketSource: ticket.source,
    eventId: event.id,
    emailHash,
  } satisfies RecoveryTokenPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(ticket.serialNumber)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime("15m")
    .sign(recoverySecret());
}

export async function verifyRecoveryToken(
  token: string,
  event: ActiveTicketEvent,
): Promise<RecoveryTokenPayload> {
  const { payload } = await jwtVerify(token, recoverySecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const ticketId = payload.ticketId;
  const ticketSource = payload.ticketSource;
  const eventId = payload.eventId;
  const emailHash = payload.emailHash;

  if (
    typeof ticketId !== "string" ||
    !["supabase", "firestore", "receipt"].includes(String(ticketSource)) ||
    eventId !== event.id ||
    typeof emailHash !== "string"
  ) {
    throw new Error("INVALID_RECOVERY_TOKEN");
  }

  return {
    ticketId,
    ticketSource: ticketSource as RecoveryTicketSource,
    eventId,
    emailHash,
  };
}
