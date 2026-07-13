import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeRecoveryEmail,
  recordRecoveryLog,
  recoveryEmailHash,
  verifyRecoveryOtp,
} from "@/lib/access-drop/recoveryStore";
import {
  assertSameOrigin,
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  hashLookup,
  readJson,
  secureLog,
} from "@/lib/security";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";
import { getRecoverableTicket } from "@/lib/tickets/recoveryTicket";
import { createRecoveryToken } from "@/lib/tickets/recoveryToken";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  code: z.string().regex(/^\d{6}$/),
  turnstileToken: z.string().max(4096).optional(),
});

function messageFor(reason: "expired" | "not-found" | "locked" | "invalid"): string {
  if (reason === "expired") return "El codigo expiro. Solicita uno nuevo.";
  if (reason === "locked") return "Se agotaron los 5 intentos. Solicita un codigo nuevo.";
  return "El codigo es incorrecto o ya no es valido.";
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      namespace: "ticket-recovery-verify-ip",
      limit: 25,
      windowMs: 15 * 60_000,
    });

    const body = await readJson(request, verifySchema);
    const email = normalizeRecoveryEmail(body.email);
    const emailHash = recoveryEmailHash(email);
    const event = getActiveTicketEvent();
    const ipHash = hashLookup(getClientIp(request));
    const userAgentHash = hashLookup(request.headers.get("user-agent") || "unknown");

    await verifyTurnstileToken(request, body.turnstileToken, {
      variant: "invisible",
      action: "ticket_recovery_verify",
    });

    const emailLimit = checkRateLimit(emailHash, {
      namespace: "ticket-recovery-verify-email",
      limit: 12,
      windowMs: 15 * 60_000,
    });

    if (!emailLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos. Solicita un codigo nuevo." },
        { status: 429 },
      );
    }

    const result = await verifyRecoveryOtp(email, event.id, body.code);
    if (!result.ok) {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Delay to slow down brute force
      await recordRecoveryLog({
        emailHash,
        eventId: event.id,
        action: "RECOVERY_VERIFY_FAILED",
        ipHash,
        userAgentHash,
        metadata: { reason: result.reason },
      }).catch((error) => {
        secureLog("[RECOVERY] Audit log unavailable", {
          action: "RECOVERY_VERIFY_FAILED",
          reason: error instanceof Error ? error.message : String(error),
        });
      });
      return NextResponse.json({ ok: false, error: messageFor(result.reason) }, { status: 400 });
    }

    const ticket = await getRecoverableTicket(result.ticketSource, result.ticketId, event);
    if (!ticket || recoveryEmailHash(ticket.email) !== emailHash) {
      await recordRecoveryLog({
        emailHash,
        eventId: event.id,
        action: "RECOVERY_VERIFY_FAILED",
        ipHash,
        userAgentHash,
        metadata: { reason: "ticket-not-found" },
      }).catch((error) => {
        secureLog("[RECOVERY] Audit log unavailable", {
          action: "RECOVERY_VERIFY_FAILED",
          reason: error instanceof Error ? error.message : String(error),
        });
      });
      return NextResponse.json(
        { ok: false, error: "La entrada ya no esta disponible para recuperacion." },
        { status: 404 },
      );
    }

    const token = await createRecoveryToken(ticket, event, emailHash);

    await recordRecoveryLog({
      emailHash,
      eventId: event.id,
      action: "RECOVERY_VERIFY_SUCCESS",
      ipHash,
      userAgentHash,
      metadata: { ticketSource: ticket.source, serialNumber: ticket.serialNumber },
    }).catch((error) => {
      secureLog("[RECOVERY] Audit log unavailable", {
        action: "RECOVERY_VERIFY_SUCCESS",
        reason: error instanceof Error ? error.message : String(error),
      });
    });

    return NextResponse.json({
      ok: true,
      success: true,
      token,
      expiresIn: 15 * 60,
      ticket: {
        eventName: event.eventName,
        seriesName: event.title,
        artist: event.artist,
        date: event.dateLabel,
        venue: event.venue,
        ticketCode: ticket.serialNumber,
        qrUrl: `/api/tickets/recovery/qr?token=${encodeURIComponent(token)}`,
        status: ticket.status,
        holderName: `${ticket.firstName} ${ticket.lastName}`.trim(),
        quantity: ticket.quantity,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
