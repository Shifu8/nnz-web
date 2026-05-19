/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Endpoint seguro para registro de Access Drop con transacciones de Firestore y prevención de duplicados.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";
import { v4 as uuidv4 } from "uuid";
import { isBadWord } from "@/lib/badWords";
import { validateEcuadorPhone, getFingerprint, validateName } from "@/lib/security";

// Basic in-memory rate limiting (Fingerprint -> timestamp)
const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const fingerprint = getFingerprint(ip, userAgent);
    const now = Date.now();
    
    // Rate Limiting: 1 request per 60 seconds per fingerprint (stricter)
    if (rateLimitMap.has(fingerprint)) {
      const lastReq = rateLimitMap.get(fingerprint)!;
      if (now - lastReq < 60000) {
        return NextResponse.json({ error: "Actividad sospechosa detectada. Espera 60 segundos." }, { status: 429 });
      }
    }
    rateLimitMap.set(fingerprint, now);

    const body = await request.json();
    const { firstName, lastName, phone, instagram } = body;

    // 1. Validaciones Básicas
    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!validateName(firstName) || !validateName(lastName)) {
      return NextResponse.json({ error: "Nombre o apellido inválido. Solo letras permitidas." }, { status: 400 });
    }

    if (isBadWord(firstName) || isBadWord(lastName)) {
      return NextResponse.json({ error: "Contenido bloqueado por políticas de seguridad." }, { status: 400 });
    }

    const sanitizedPhone = phone.replace(/[^\d]/g, '');
    if (!validateEcuadorPhone(sanitizedPhone)) {
      return NextResponse.json({ error: "Número inválido. (Ecuador: 09XXXXXXXX)" }, { status: 400 });
    }

    const db = adminDb;
    if (!db) {
      return generateMockSuccess(firstName, lastName, sanitizedPhone);
    }

    // 2. Transacción de Firestore para prevenir duplicados y race conditions
    const result = await db.runTransaction(async (transaction) => {
      // Check phone
      const phoneQuery = db.collection("accessDrops").where("phone", "==", sanitizedPhone).limit(1);
      const phoneSnap = await transaction.get(phoneQuery);
      if (!phoneSnap.empty) return { error: "Este acceso ya fue reclamado." };

      // Check full name
      const nameQuery = db.collection("accessDrops")
        .where("firstName", "==", firstName.toUpperCase())
        .where("lastName", "==", lastName.toUpperCase())
        .limit(1);
      const nameSnap = await transaction.get(nameQuery);
      if (!nameSnap.empty) return { error: "Este acceso ya fue reclamado." };

      // Check fingerprint
      const fpQuery = db.collection("accessDrops").where("fingerprint", "==", fingerprint).limit(1);
      const fpSnap = await transaction.get(fpQuery);
      if (!fpSnap.empty) return { error: "Este acceso ya fue reclamado." };

      // Check total limit (100)
      const countSnap = await db.collection("accessDrops").count().get();
      if (countSnap.data().count >= 100) return { error: "ACCESS DROP AGOTADO." };

      // Create IDs
      const participantId = uuidv4();
      const serialNumber = `DAWGS-${Math.floor(1000 + Math.random() * 9000)}-${uuidv4().split('-')[0].toUpperCase()}`;
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
      
      const qrPayload = JSON.stringify({
        type: "DAWGS_PASS",
        serialNumber,
        token,
        eventId: "trap-loud",
        owner: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
      });

      // Set participant
      const participantRef = db.collection("accessDrops").doc(participantId);
      transaction.set(participantRef, {
        firstName: firstName.toUpperCase(),
        lastName: lastName.toUpperCase(),
        phone: sanitizedPhone,
        instagram: instagram || null,
        fingerprint,
        ip,
        registeredAt: new Date().toISOString(),
        serialNumber,
        status: "confirmed"
      });

      // Set pass
      const passRef = db.collection("partyPasses").doc(serialNumber);
      transaction.set(passRef, {
        id: serialNumber,
        code: token,
        eventId: "trap-loud",
        participantId,
        used: false,
        expiresAt,
        qrPayload,
        type: "FOUNDING_DAWG",
        createdAt: new Date().toISOString()
      });

      return { success: true, qrPayload, serialNumber, firstName, lastName };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "FOUNDING ACCESS CONFIRMED",
      ...result
    });

  } catch (error: any) {
    console.error("API Access Drop Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function generateMockSuccess(firstName: string, lastName: string, phone: string) {
  const serialNumber = `DAWGS-MOCK-${Math.floor(Math.random() * 10000)}`;
  const qrPayload = JSON.stringify({
    type: "DAWGS_PASS",
    serialNumber,
    token: "mock-token",
    eventId: "trap-loud",
    owner: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
  });
  return NextResponse.json({ 
    success: true, 
    message: "FOUNDING ACCESS CONFIRMED (DEMO)",
    qrPayload, 
    serialNumber,
    firstName: firstName.toUpperCase(),
    lastName: lastName.toUpperCase()
  });
}

