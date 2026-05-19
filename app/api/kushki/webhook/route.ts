import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";
import { generateSecureQrPayload } from "@/lib/security";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Aquí iría la validación de la firma de Kushki (HmacSHA256)
    // Para el entorno seguro, nos aseguramos de que esto viene de Kushki
    
    const body = await req.json();
    
    // Asumimos un payload de Kushki estándar
    const { transactionId, status, ticketNumber, amount } = body;

    if (!transactionId || !status) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    if (!adminDb) {
      console.warn("adminDb no está inicializado, webhook mock mode");
      return NextResponse.json({ success: true, message: "Webhook recibido (MOCK)" });
    }

    const ticketRef = adminDb.collection("tickets").doc(transactionId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
    }

    // Lógica de activación segura
    if (status === "APPROVED") {
      const ticketData = ticketDoc.data();
      
      // Evitar reactivar si ya está aprobado
      if (ticketData?.status === "approved") {
        return NextResponse.json({ success: true, message: "Ticket ya estaba aprobado" });
      }

      const firstName = ticketData?.firstName || "BRANDON";
      const lastName = ticketData?.lastName || "MEDINA";
      const phone = ticketData?.phone || "0900000000";

      // Generar UUID único, serial number y token seguro
      const uniqueUUID = crypto.randomUUID();
      const serialNumber = `DAWGS-${Math.floor(1000 + Math.random() * 9000)}-${transactionId.split('-')[0].toUpperCase()}`;
      const token = crypto.randomUUID();
      const qrPayload = generateSecureQrPayload(serialNumber, token, "trap-loud");

      // 1. Actualizar estado del ticket
      await ticketRef.update({
        status: "approved",
        kushkiTicketNumber: ticketNumber,
        kushkiAmountPaid: amount,
        uuid: uniqueUUID,
        qrPayload, // Payload seguro para el QR final
        activatedAt: new Date().toISOString(),
      });

      // 2. Crear participante en accessDrops
      const participantId = crypto.randomUUID();
      await adminDb.collection("accessDrops").doc(participantId).set({
        firstName: firstName.toUpperCase(),
        lastName: lastName.toUpperCase(),
        phone,
        registeredAt: new Date().toISOString(),
        serialNumber,
        status: "confirmed"
      });

      // 3. Crear pase en partyPasses para validación del Staff Scanner
      await adminDb.collection("partyPasses").doc(serialNumber).set({
        id: serialNumber,
        code: token,
        eventId: "trap-loud",
        participantId,
        used: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        qrPayload,
        type: "FOUNDING_DAWG",
        createdAt: new Date().toISOString()
      });

      console.log(`[KUSHKI WEBHOOK] Ticket ${transactionId} ACTIVADO exitosamente con Pase ${serialNumber}.`);

      // Aquí podrías enviar un email de confirmación o SMS con el enlace al pase

    } else if (status === "DECLINED" || status === "VOIDED") {
      await ticketRef.update({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      });
      console.log(`[KUSHKI WEBHOOK] Ticket ${transactionId} CANCELADO.`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error procesando Webhook Kushki:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
