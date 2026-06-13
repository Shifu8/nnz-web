import "server-only";

import { hashLookup } from "@/lib/security";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";
import { getRecoverableTicket } from "@/lib/tickets/recoveryTicket";
import { verifyRecoveryToken } from "@/lib/tickets/recoveryToken";

export async function authorizeRecoveryToken(token: string) {
  const event = getActiveTicketEvent();
  const payload = await verifyRecoveryToken(token, event);
  const ticket = await getRecoverableTicket(payload.ticketSource, payload.ticketId, event);

  if (!ticket || hashLookup(ticket.email) !== payload.emailHash) {
    throw new Error("RECOVERY_TICKET_NOT_FOUND");
  }

  return { event, payload, ticket };
}
