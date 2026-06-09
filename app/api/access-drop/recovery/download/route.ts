import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getReceiptById } from "@/lib/access-drop/receiptStore";
import { consumeRecoveryDownloadToken } from "@/lib/access-drop/recoveryStore";
import { generateTicketPdf } from "@/lib/tickets/ticketPdf";

export const runtime = "nodejs";

async function resolvePdf(receiptId: string): Promise<{ buffer: Buffer; serialNumber: string } | null> {
  const receipt = getReceiptById(receiptId);
  if (!receipt || receipt.status !== "aprobado" || !receipt.serialNumber) return null;

  const filePath = path.join(process.cwd(), "public", "uploads", "tickets", `${receipt.serialNumber}.pdf`);
  if (fs.existsSync(filePath)) {
    return { buffer: fs.readFileSync(filePath), serialNumber: receipt.serialNumber };
  }

  if (!receipt.qrPayload) return null;

  const buffer = await generateTicketPdf({
    firstName: receipt.firstName,
    lastName: receipt.lastName,
    serialNumber: receipt.serialNumber,
    qrPayload: receipt.qrPayload,
    quantity: receipt.quantity,
    eventTitle: "TRAP LOUD",
    eventSubtitle: "YAN BLOCK EXPERIENCE",
    eventDate: "18 JUN 2026",
    eventCity: "San Juan",
  });

  return { buffer, serialNumber: receipt.serialNumber };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ error: "Link invalido." }, { status: 400 });
    }

    const result = consumeRecoveryDownloadToken(token);
    if (!result.ok || !result.receiptId) {
      return NextResponse.json({ error: "Link expirado o invalido." }, { status: 410 });
    }

    const pdf = await resolvePdf(result.receiptId);
    if (!pdf) {
      return NextResponse.json({ error: "Entrada no disponible." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(pdf.buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="entrada-${pdf.serialNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[RECOVERY] download error", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
