import { NextResponse } from "next/server";
import { z } from "zod";
import {
  RECOVERY_MAX_RESENDS_PER_DAY,
  RECOVERY_RESEND_COOLDOWN_MS,
  countRecoveryLogs,
  getLastRecoveryLogAt,
  recordRecoveryLog,
} from "@/lib/access-drop/recoveryStore";
import { sendTicketPdfViaGmailWithLimit } from "@/lib/gmailDelivery";
import {
  assertSameOrigin,
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  hashLookup,
  readJson,
  secureLog,
} from "@/lib/security";
import { authorizeRecoveryToken } from "@/lib/tickets/recoveryAccess";
import { generateTicketPdf } from "@/lib/tickets/ticketPdf";

export const runtime = "nodejs";

const resendSchema = z.object({
  token: z.string().min(40).max(4096),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      namespace: "ticket-recovery-resend-ip",
      limit: 8,
      windowMs: 60 * 60_000,
    });

    const { token } = await readJson(request, resendSchema);
    const { event, payload, ticket } = await authorizeRecoveryToken(token);
    const sentToday = await countRecoveryLogs(payload.emailHash, event.id, "RECOVERY_RESEND");
    if (sentToday >= RECOVERY_MAX_RESENDS_PER_DAY) {
      return NextResponse.json(
        { ok: false, error: "Alcanzaste el limite de 3 reenvios por hoy." },
        { status: 429 },
      );
    }

    const lastSentAt = await getLastRecoveryLogAt(payload.emailHash, event.id, "RECOVERY_RESEND");
    if (lastSentAt) {
      const waitMs = RECOVERY_RESEND_COOLDOWN_MS - (Date.now() - new Date(lastSentAt).getTime());
      if (waitMs > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Espera ${Math.ceil(waitMs / 60_000)} minuto(s) antes de reenviar otra vez.`,
          },
          { status: 429 },
        );
      }
    }

    const pdf = await generateTicketPdf({
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      serialNumber: ticket.serialNumber,
      qrPayload: ticket.qrPayload,
      quantity: ticket.quantity,
      eventTitle: event.title,
      eventSubtitle: event.eventName,
      eventDate: event.dateLabel,
      eventCity: event.venue,
    });

    const delivery = await sendTicketPdfViaGmailWithLimit({
      to: ticket.email,
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      serialNumber: ticket.serialNumber,
      quantity: ticket.quantity,
      pdfBuffer: pdf,
      eventTitle: event.title,
      eventName: event.eventName,
      eventDate: event.dateLabel,
      eventVenue: event.venue,
    });

    if (!delivery.success) {
      console.error("[RECOVERY] resend delivery failed", delivery.reason);
      return NextResponse.json(
        { ok: false, error: "No pudimos reenviar la entrada ahora. Intenta mas tarde." },
        { status: 503 },
      );
    }

    await recordRecoveryLog({
      emailHash: payload.emailHash,
      eventId: event.id,
      action: "RECOVERY_RESEND",
      ipHash: hashLookup(getClientIp(request)),
      userAgentHash: hashLookup(request.headers.get("user-agent") || "unknown"),
      metadata: { serialNumber: ticket.serialNumber, messageId: delivery.messageId },
    }).catch((error) => {
      secureLog("[RECOVERY] Audit log unavailable", {
        action: "RECOVERY_RESEND",
        reason: error instanceof Error ? error.message : String(error),
      });
    });

    return NextResponse.json({
      ok: true,
      success: true,
      message: "La entrada fue reenviada al correo asociado.",
      remainingToday: Math.max(0, RECOVERY_MAX_RESENDS_PER_DAY - sentToday - 1),
    });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("[RECOVERY] resend failed", error);
    return NextResponse.json({ ok: false, error: "El enlace expiro o ya no es valido." }, { status: 410 });
  }
}
