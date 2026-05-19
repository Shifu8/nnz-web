/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Endpoint para recuperar un pase existente mediante el número de teléfono.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Número de teléfono requerido." }, { status: 400 });
    }

    const sanitizedPhone = phone.replace(/[^\d]/g, '');

    if (!adminDb) {
      return NextResponse.json({ error: "Modo demo no soporta recuperación real." }, { status: 400 });
    }

    const dropSnapshot = await adminDb.collection("accessDrops")
      .where("phone", "==", sanitizedPhone)
      .limit(1)
      .get();

    if (dropSnapshot.empty) {
      return NextResponse.json({ error: "No se encontró ningún acceso asociado a este número." }, { status: 404 });
    }

    const dropData = dropSnapshot.docs[0].data();
    const serialNumber = dropData.serialNumber;

    const passSnapshot = await adminDb.collection("partyPasses").doc(serialNumber).get();
    
    if (!passSnapshot.exists) {
      return NextResponse.json({ error: "Error al recuperar los datos del pase." }, { status: 500 });
    }

    const passData = passSnapshot.data();

    return NextResponse.json({
      success: true,
      message: "ACCESO RECUPERADO",
      firstName: dropData.firstName,
      lastName: dropData.lastName,
      serialNumber: dropData.serialNumber,
      qrPayload: passData?.qrPayload
    });

  } catch (error) {
    console.error("API Recover Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
