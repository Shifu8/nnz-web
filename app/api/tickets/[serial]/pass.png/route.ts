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
    } else if (store.kind === "supabase") {
      const { data } = await store.supabase
        .from("party_passes")
        .select("qr_payload_encrypted")
        .eq("serial_number", serialNumber)
        .maybeSingle();
      if (!data?.qr_payload_encrypted) {
        return new NextResponse("Not found", { status: 404 });
      }
      qrPayload = decryptSensitive(data.qr_payload_encrypted);
    } else {
      const snap = await store.db
        .collection("partyPasses")
        .where("serialNumber", "==", serialNumber)
        .limit(1)
        .get();
      const doc = snap.docs[0]?.data();
      if (!doc?.qrPayloadEncrypted) {
        return new NextResponse("Not found", { status: 404 });
      }
      qrPayload = decryptSensitive(doc.qrPayloadEncrypted);
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
