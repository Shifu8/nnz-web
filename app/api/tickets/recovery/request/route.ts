import { NextResponse } from "next/server";
import { z } from "zod";
import { sendRecoveryOtpViaGmail } from "@/lib/gmailDelivery";
import {
  RECOVERY_MAX_OTPS_PER_DAY,
  countRecoveryLogs,
  createRecoveryOtp,
  invalidateRecoveryOtp,
  normalizeRecoveryEmail,
  recordRecoveryLog,
  recoveryEmailHash,
} from "@/lib/access-drop/recoveryStore";
import {
  assertSameOrigin,
  ApiError,
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  getFingerprint,
  handleApiError,
  hashLookup,
  readJson,
  secureLog,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";
import { findRecoverableTicketByEmail } from "@/lib/tickets/recoveryTicket";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  turnstileToken: z.string().max(4096).optional(),
});

function genericOk() {
  return NextResponse.json({
    ok: true,
    success: true,
    message: "Código enviado. Si tu compra con este correo ya fue aprobada, recibirás el PIN de 6 dígitos en tu bandeja de entrada.",
  });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      namespace: "ticket-recovery-request-ip",
      limit: 10,
      windowMs: 60 * 60_000,
    });

    const body = await readJson(request, requestSchema);
    const email = normalizeRecoveryEmail(body.email);
    const emailHash = recoveryEmailHash(email);
    const event = getActiveTicketEvent();
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipHash = hashLookup(ip);
    const userAgentHash = hashLookup(userAgent);

    const emailLimit = checkRateLimit(emailHash, {
      namespace: "ticket-recovery-request-email",
      limit: 5,
      windowMs: 60 * 60_000,
    });

    await verifyTurnstileToken(request, body.turnstileToken, {
      variant: "invisible",
      action: "ticket_recovery",
    });

    await recordRecoveryLog({
      emailHash,
      eventId: event.id,
      action: "RECOVERY_REQUEST",
      ipHash,
      userAgentHash,
      metadata: { fingerprint: getFingerprint(ip, userAgent) },
    }).catch((error) => {
      secureLog("[RECOVERY] Audit log unavailable", {
        action: "RECOVERY_REQUEST",
        reason: error instanceof Error ? error.message : String(error),
      });
    });

    if (!emailLimit.allowed) return genericOk();

    const ticket = await findRecoverableTicketByEmail(email, event);
    if (!ticket) {
      hashLookup(`missing:${email}:${event.id}`);
      return genericOk();
    }

    const sentToday = await countRecoveryLogs(emailHash, event.id, "RECOVERY_OTP_SENT");
    if (sentToday >= RECOVERY_MAX_OTPS_PER_DAY) return genericOk();

    const otp = await createRecoveryOtp({
      email,
      eventId: event.id,
      ticketId: ticket.id,
      ticketSource: ticket.source,
    });

    const delivery = await sendRecoveryOtpViaGmail(email, otp.code);
    if (!delivery.success) {
      await invalidateRecoveryOtp(otp.id).catch(() => undefined);
      secureLog("[RECOVERY] OTP delivery failed", {
        emailHash,
        eventId: event.id,
        reason: delivery.reason,
      });
      return genericOk();
    }

    await recordRecoveryLog({
      emailHash,
      eventId: event.id,
      action: "RECOVERY_OTP_SENT",
      ipHash,
      userAgentHash,
      metadata: { ticketSource: ticket.source },
    }).catch((error) => {
      secureLog("[RECOVERY] Audit log unavailable", {
        action: "RECOVERY_OTP_SENT",
        reason: error instanceof Error ? error.message : String(error),
      });
    });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("[RECOVERY] request failed", error);
  }

  return genericOk();
}
