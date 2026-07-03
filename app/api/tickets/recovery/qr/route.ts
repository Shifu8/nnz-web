import { NextRequest, NextResponse } from "next/server";
import { authorizeRecoveryToken } from "@/lib/tickets/recoveryAccess";
import { generateTicketQrPng } from "@/lib/tickets/ticketImage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const serial = request.nextUrl.searchParams.get("serial") || "";
  if (!token) return new NextResponse("Token required", { status: 400 });

  try {
    const { ticket } = await authorizeRecoveryToken(token);
    
    let qrPayload = ticket.qrPayload;
    if (serial && ticket.serialNumber && ticket.qrPayload) {
      const serials = ticket.serialNumber.split(",");
      const payloads = ticket.qrPayload.split(",");
      const idx = serials.indexOf(serial);
      if (idx !== -1 && payloads[idx]) {
        qrPayload = payloads[idx];
      }
    }

    const png = await generateTicketQrPng(qrPayload);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Expired or invalid recovery link", { status: 410 });
  }
}
