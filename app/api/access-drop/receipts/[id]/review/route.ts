import { NextRequest, NextResponse } from "next/server";
import { getReceiptById, updateReceiptStatus, loadAllReceipts, saveAllReceipts } from "@/lib/access-drop/receiptStore";
import type { ReceiptRecord, ReceiptStatus } from "@/lib/access-drop/types";
import { REJECTION_REASONS } from "@/lib/access-drop/types";
import { generateTicketImage } from "@/lib/tickets/ticketImage";
import { sendTicketPdfViaGmailWithLimit } from "@/lib/gmailDelivery";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";

export const runtime = "nodejs";

function generateSerial(): string {
  return `NENEZ-${crypto.randomInt(1000, 9999)}-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

function generateQrPayload(serialNumber: string, eventId: string): string {
  return JSON.stringify({
    type: "NENEZ_PASS",
    serialNumber,
    token: crypto.randomUUID(),
    eventId,
    issuedAt: new Date().toISOString(),
    v: 1,
  });
}

function patchReceipt(id: string, patch: Partial<ReceiptRecord>): ReceiptRecord | null {
  const receipts = loadAllReceipts();
  const idx = receipts.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  receipts[idx] = { ...receipts[idx], ...patch };
  saveAllReceipts(receipts);
  return receipts[idx];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reviewedBy, rejectionReason } = body as {
      status: ReceiptStatus;
      reviewedBy?: string;
      rejectionReason?: string;
    };

    if (!status || !["aprobado", "rechazado"].includes(status)) {
      return NextResponse.json(
        { error: "ESTADO INVÁLIDO. DEBE SER 'aprobado' O 'rechazado'." },
        { status: 400 }
      );
    }

    if (status === "rechazado" && !rejectionReason) {
      return NextResponse.json(
        { error: "MOTIVO DE RECHAZO REQUERIDO." },
        { status: 400 }
      );
    }

    const existing = getReceiptById(id);
    if (!existing) {
      console.warn(`[REVIEW_API] Receipt not found for ID: "${id}". Resolved DB path: ${path.join(process.cwd(), "data", "receipts.json")}. Total receipts loaded: ${loadAllReceipts().length}`);
      return NextResponse.json({ error: "COMPROBANTE NO ENCONTRADO." }, { status: 404 });
    }

    if (existing.status !== "pendiente") {
      return NextResponse.json({ error: "ESTE COMPROBANTE YA FUE REVISADO." }, { status: 409 });
    }

    const reasonLabel = rejectionReason
      ? REJECTION_REASONS.find((r) => r.id === rejectionReason)?.label || rejectionReason
      : undefined;

    const updated = updateReceiptStatus(id, status, reviewedBy, rejectionReason);
    if (!updated) {
      return NextResponse.json({ error: "ERROR AL ACTUALIZAR." }, { status: 500 });
    }

    if (status === "aprobado") {
      try {
        const event = getActiveTicketEvent();
        const eventId = existing.eventId || event.id;
        const quantity = Math.max(1, existing.quantity || 1);

        const serials: string[] = [];
        const qrPayloads: string[] = [];
        const pngBuffers: Buffer[] = [];

        const ticketsDir = path.join(process.cwd(), "public", "uploads", "tickets");
        if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });

        for (let i = 0; i < quantity; i++) {
          const serialNumber = generateSerial();
          const qrPayload = generateQrPayload(serialNumber, eventId);

          serials.push(serialNumber);
          qrPayloads.push(qrPayload);

          const pngBuffer = await generateTicketImage({
            firstName: existing.firstName,
            lastName: existing.lastName,
            serialNumber,
            qrPayload,
            quantity: 1,
            eventTitle: event.title,
            eventCity: event.venue,
            eventDate: event.dateLabel,
            ticketDesign: existing.ticketDesign,
          });

          pngBuffers.push(pngBuffer);

          const pngFileName = `${serialNumber}.png`;
          const pngPath = path.join(ticketsDir, pngFileName);
          fs.writeFileSync(pngPath, pngBuffer);
        }

        const serialsString = serials.join(",");
        const qrPayloadsString = qrPayloads.join(",");

        patchReceipt(id, {
          eventId,
          serialNumber: serialsString,
          qrPayload: qrPayloadsString,
          deliveryChannel: "gmail",
          deliveryStatus: "ticket-generated",
        });

        const gmailResult = await sendTicketPdfViaGmailWithLimit({
          to: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          serialNumber: serialsString,
          quantity: existing.quantity,
          pdfBuffer: pngBuffers,
          eventTitle: event.title,
          eventName: event.eventName,
          eventDate: event.dateLabel,
          eventVenue: event.venue,
        });

        patchReceipt(id, {
          deliveryChannel: gmailResult.success ? "gmail" : "none",
          deliveryStatus: `email:${gmailResult.success ? gmailResult.messageId || "ok" : gmailResult.reason || "failed"}`,
          emailSentAt: gmailResult.success ? new Date().toISOString() : undefined,
        });

        console.log(
          `[TICKET] ${serialsString} generado. Gmail: ${gmailResult.success ? "ok" : gmailResult.reason || "no enviado"}.`,
        );
      } catch (ticketErr) {
        console.error("[TICKET] Error generando o enviando ticket:", ticketErr);
      }
    }

    return NextResponse.json({
      success: true,
      receipt: updated,
      message:
        status === "aprobado"
          ? "COMPROBANTE APROBADO. EL USUARIO RECIBIRÁ SU ENTRADA POR EMAIL."
          : `COMPROBANTE RECHAZADO: ${reasonLabel || "Sin motivo"}.`,
    });
  } catch (err) {
    console.error("Error reviewing receipt:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
