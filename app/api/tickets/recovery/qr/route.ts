import { NextRequest, NextResponse } from "next/server";
import { authorizeRecoveryToken } from "@/lib/tickets/recoveryAccess";
import { generateTicketQrPng } from "@/lib/tickets/ticketImage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) return new NextResponse("Token required", { status: 400 });

  try {
    const { ticket } = await authorizeRecoveryToken(token);
    const png = await generateTicketQrPng(ticket.qrPayload);
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
