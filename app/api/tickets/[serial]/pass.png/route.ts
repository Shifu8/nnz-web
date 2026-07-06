import { NextResponse } from "next/server";
import { ensureStore, readJsonFile } from "@/lib/db/passStore";
import { decryptSensitive, handleApiError } from "@/lib/security";
import { generateTicketQrPng } from "@/lib/tickets/ticketImage";
import { verifyTicketImageToken } from "@/lib/tickets/ticketImageToken";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ serial: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { serial } = await context.params;
    const serialNumber = decodeURIComponent(serial);
    const token = new URL(request.url).searchParams.get("token") || "";

    if (!verifyTicketImageToken(serialNumber, token)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const store = ensureStore();
    let qrPayload = "";

    if (store.kind === "local-json") {
      const partyPasses = readJsonFile<any>("party_passes");
      const pass = partyPasses.find((p: any) => p.serialNumber === serialNumber || p.serial_number === serialNumber);
      if (!pass?.qrPayloadEncrypted && !pass?.qr_payload_encrypted) {
        return new NextResponse("Not found", { status: 404 });
      }
      qrPayload = decryptSensitive(pass.qrPayloadEncrypted || pass.qr_payload_encrypted);
    } else if (store.kind === "postgres") {
      const [row] = await store.db`
        SELECT qr_payload_encrypted FROM party_passes
        WHERE serial_number = ${serialNumber}
        LIMIT 1
      `;
      if (!row?.qr_payload_encrypted) {
        return new NextResponse("Not found", { status: 404 });
      }
      qrPayload = decryptSensitive(row.qr_payload_encrypted);
    }

    const png = await generateTicketQrPng(qrPayload);
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
