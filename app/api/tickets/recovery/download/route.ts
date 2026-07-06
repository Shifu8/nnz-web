import { NextRequest, NextResponse } from "next/server";
import {
  recordRecoveryLog,
} from "@/lib/access-drop/recoveryStore";
import { getClientIp, hashLookup } from "@/lib/security";
import { authorizeRecoveryToken } from "@/lib/tickets/recoveryAccess";
import { generateTicketImage } from "@/lib/tickets/ticketImage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const serial = request.nextUrl.searchParams.get("serial") || "";
  if (!token) return NextResponse.json({ error: "Token requerido." }, { status: 400 });

  try {
    const { event, payload, ticket } = await authorizeRecoveryToken(token);
    
    let targetSerialNumber = ticket.serialNumber;
    let targetQrPayload = ticket.qrPayload;
    
    if (serial && ticket.serialNumber && ticket.qrPayload) {
      const serials = ticket.serialNumber.split(",");
      const payloads = ticket.qrPayload.split(",");
      const idx = serials.indexOf(serial);
      if (idx !== -1 && payloads[idx]) {
        targetSerialNumber = serial;
        targetQrPayload = payloads[idx];
      }
    }

    const png = await generateTicketImage({
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      serialNumber: targetSerialNumber,
      qrPayload: targetQrPayload,
      quantity: 1, // downloading an individual ticket
      eventTitle: event.title,
      eventCity: event.venue,
      eventDate: event.dateLabel,
      ticketDesign: ticket.ticketDesign,
    });

    await recordRecoveryLog({
      emailHash: payload.emailHash,
      eventId: event.id,
      action: "RECOVERY_DOWNLOAD",
      ipHash: hashLookup(getClientIp(request)),
      userAgentHash: hashLookup(request.headers.get("user-agent") || "unknown"),
      metadata: { serialNumber: targetSerialNumber },
    });

    const isPreview = request.nextUrl.searchParams.get("preview") === "true";
    const responseHeaders: Record<string, string> = {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    };
    if (isPreview) {
      responseHeaders["Content-Disposition"] = `inline; filename="entrada-${targetSerialNumber}.png"`;
    } else {
      responseHeaders["Content-Disposition"] = `attachment; filename="entrada-${targetSerialNumber}.png"`;
    }

    return new NextResponse(new Uint8Array(png), {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[RECOVERY] download failed", error);
    return NextResponse.json({ error: "El enlace expiro o ya no es valido." }, { status: 410 });
  }
}
