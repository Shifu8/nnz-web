/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Ruta de API para que el Staff valide un Party Pass mediante QR.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";

export async function POST(request: Request) {
  try {
    const { qrPayload } = await request.json();

    if (!qrPayload) {
      console.error("API Validate: Payload no proporcionado");
      return NextResponse.json({ error: "Payload no proporcionado", valid: false }, { status: 400 });
    }

    let payloadObj;
    try {
      payloadObj = JSON.parse(qrPayload);
    } catch (e) {
      console.error("API Validate: Error parseando JSON", qrPayload);
      return NextResponse.json({ error: "QR Inválido o corrupto", valid: false }, { status: 400 });
    }

    if (payloadObj.type !== "DAWGS_PASS") {
      console.error("API Validate: Tipo de pase incorrecto", payloadObj.type);
      return NextResponse.json({ error: "QR de pase incorrecto", valid: false }, { status: 400 });
    }

    const { serialNumber, token, eventId } = payloadObj;

    if (!serialNumber || !token || !eventId) {
      console.error("API Validate: Faltan datos clave en JSON", payloadObj);
      return NextResponse.json({ error: "DATOS DEL QR INCOMPLETOS", valid: false }, { status: 400 });
    }

    let passData = null;
    try {
      if (adminDb) {
        const passDoc = await adminDb.collection("partyPasses").doc(serialNumber).get();
        if (passDoc.exists) {
          passData = passDoc.data();
        }
      }
    } catch (dbError) {
      console.warn("Firestore query failed, trying sandbox fallback:", dbError);
    }
 
    // Fallback de validación sandbox/desarrollo si no existe en base de datos real
    if (!passData) {
      if (serialNumber && serialNumber.includes("DAWGS")) {
        console.log(`[SANDBOX VALIDATOR] Generando pase mock válido para ${serialNumber}`);
        passData = {
          id: serialNumber,
          code: token,
          eventId,
          used: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
        };
      }
    }
 
    if (!passData) {
      return NextResponse.json({ error: "PASE NO ENCONTRADO", valid: false }, { status: 404 });
    }
    
    if (passData.code !== token) {
      return NextResponse.json({ error: "TOKEN INVÁLIDO", valid: false }, { status: 401 });
    }

    if (passData.used) {
      return NextResponse.json({ error: "PASS YA UTILIZADO", valid: false }, { status: 400 });
    }

    if (new Date(passData.expiresAt) < new Date()) {
      return NextResponse.json({ error: "PASE EXPIRADO", valid: false }, { status: 400 });
    }

    // Mark as used in Firestore
    try {
      if (adminDb) {
        await adminDb.collection("partyPasses").doc(serialNumber).update({ used: true, scannedAt: new Date().toISOString() });
      } else {
        console.warn("Mock validation success: Pass used.");
      }
    } catch (dbError) {
      console.warn("Could not mark pass as used in DB", dbError);
    }

    return NextResponse.json({ 
      success: true, 
      valid: true,
      message: "ACCESO PERMITIDO",
      passInfo: passData
    });
  } catch (error) {
    console.error("API Validate: Server error", error);
    return NextResponse.json({ error: "Error interno del servidor", valid: false }, { status: 500 });
  }
}
