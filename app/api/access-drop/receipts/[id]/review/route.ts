import { NextRequest, NextResponse } from "next/server";
import { getReceiptById, updateReceiptStatus, loadAllReceipts, saveAllReceipts } from "@/lib/access-drop/receiptStore";
import type { ReceiptRecord, ReceiptStatus } from "@/lib/access-drop/types";
import { REJECTION_REASONS } from "@/lib/access-drop/types";
import { generateTicketPdf } from "@/lib/tickets/ticketPdf";
import { sendRejectionViaWhatsApp, sendWhatsAppText } from "@/lib/whatsapp";
import { sendTicketPdfViaGmailWithLimit } from "@/lib/gmailDelivery";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";

export const runtime = "nodejs";

function generateSerial(): string {
  return `DAWGS-${crypto.randomInt(1000, 9999)}-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

function generateQrPayload(serialNumber: string, eventId: string): string {
  return JSON.stringify({
    type: "DAWGS_PASS",
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
        const serialNumber = generateSerial();
        const qrPayload = generateQrPayload(serialNumber, eventId);

        const pdfBuffer = await generateTicketPdf({
          firstName: existing.firstName,
          lastName: existing.lastName,
          serialNumber,
          qrPayload,
          quantity: existing.quantity,
          eventTitle: event.title,
          eventSubtitle: event.eventName,
          eventDate: event.dateLabel,
          eventCity: event.venue,
        });

        const ticketsDir = path.join(process.cwd(), "public", "uploads", "tickets");
        if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });

        const pdfFileName = `${serialNumber}.pdf`;
        const pdfPath = path.join(ticketsDir, pdfFileName);
        fs.writeFileSync(pdfPath, pdfBuffer);

        patchReceipt(id, {
          eventId,
          serialNumber,
          qrPayload,
          deliveryChannel: "none",
          deliveryStatus: "ticket-generated",
        });

        const gmailResult = await sendTicketPdfViaGmailWithLimit({
          to: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          serialNumber,
          quantity: existing.quantity,
          pdfBuffer,
          eventTitle: event.title,
          eventName: event.eventName,
          eventDate: event.dateLabel,
          eventVenue: event.venue,
        });

        const waResult = await sendWhatsAppText(
          existing.phone,
          `DAWGS TRAP LOUD\n\nHola ${existing.firstName}, compra aprobada. Revisa tu Gmail para guardar tu entrada.\n\nSi no aparece, puede que el correo este mal escrito: entra a Recuperar entrada en la web.`,
        );

        patchReceipt(id, {
          deliveryChannel: gmailResult.success ? "gmail" : "none",
          deliveryStatus: `email:${gmailResult.success ? gmailResult.messageId || "ok" : gmailResult.reason || "failed"}; whatsapp:${waResult?.success ? `queued:${waResult.messageId || "ok"}` : waResult?.error || "failed"}`,
          emailSentAt: gmailResult.success ? new Date().toISOString() : undefined,
          whatsappQueuedAt: waResult?.success ? new Date().toISOString() : undefined,
        });

        console.log(
          `[TICKET] ${serialNumber} generado. Gmail: ${gmailResult.success ? "ok" : gmailResult.reason || "no enviado"}. WA confirm: ${waResult?.success}.`,
        );
      } catch (ticketErr) {
        console.error("[TICKET] Error generando o enviando ticket:", ticketErr);
      }
    }

    if (status === "rechazado" && reasonLabel) {
      try {
        const waResult = await sendRejectionViaWhatsApp(
          existing.phone,
          existing.firstName,
          reasonLabel,
        );
        console.log(`[REJECT] Notificación enviada a ${existing.phone}. WA: ${waResult?.success}`);
      } catch (rejectErr) {
        console.error("[REJECT] Error enviando notificación:", rejectErr);
      }
    }

    return NextResponse.json({
      success: true,
      receipt: updated,
      message:
        status === "aprobado"
          ? "COMPROBANTE APROBADO. EL USUARIO RECIBIRÁ SU ACCESO."
          : `COMPROBANTE RECHAZADO: ${reasonLabel || "Sin motivo"}. SE NOTIFICÓ AL USUARIO.`,
    });
  } catch (err) {
    console.error("Error reviewing receipt:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
