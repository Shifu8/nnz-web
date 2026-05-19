import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, phone, eventId = "trap-loud", amount = 10 } = await req.json();

    if (!firstName || !phone) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Generar un ID de transacción interno único
    const transactionId = crypto.randomUUID();

    // Crear el ticket en estado PENDING
    const ticketRef = adminDb?.collection("tickets").doc(transactionId);
    
    if (ticketRef) {
      await ticketRef.set({
        firstName,
        lastName,
        phone,
        eventId,
        amount,
        status: "pending", // Estados: pending, approved, used, cancelled
        createdAt: new Date().toISOString(),
        kushkiToken: null,
      });
    } else {
      console.warn("adminDb no está inicializado, simulando creación de ticket");
    }

    // Aquí iría la llamada real a la API de Kushki para iniciar el pago
    // Por ahora, simulamos un "Smartlink" o Token
    const mockKushkiUrl = `https://checkout.kushkipagos.com/sandbox/smartlink/${transactionId}`;

    return NextResponse.json({ 
      success: true, 
      transactionId, 
      paymentUrl: mockKushkiUrl,
      message: "Transacción iniciada correctamente"
    });

  } catch (error: any) {
    console.error("Error en Kushki initiate:", error);
    return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 });
  }
}
