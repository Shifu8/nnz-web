import { NextRequest, NextResponse } from "next/server";
import {
  recordRecoveryLog,
} from "@/lib/access-drop/recoveryStore";
import { getClientIp, hashLookup } from "@/lib/security";
import { authorizeRecoveryToken } from "@/lib/tickets/recoveryAccess";
import { generateTicketPdf } from "@/lib/tickets/ticketPdf";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Token requerido." }, { status: 400 });

  try {
    const { event, payload, ticket } = await authorizeRecoveryToken(token);
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

    await recordRecoveryLog({
      emailHash: payload.emailHash,
      eventId: event.id,
      action: "RECOVERY_DOWNLOAD",
      ipHash: hashLookup(getClientIp(request)),
      userAgentHash: hashLookup(request.headers.get("user-agent") || "unknown"),
      metadata: { serialNumber: ticket.serialNumber },
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="entrada-${ticket.serialNumber}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[RECOVERY] download failed", error);
    return NextResponse.json({ error: "El enlace expiro o ya no es valido." }, { status: 410 });
  }
}
