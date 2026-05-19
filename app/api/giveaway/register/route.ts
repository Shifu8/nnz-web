/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Registro seguro para el Live Giveaway.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";
import { v4 as uuidv4 } from "uuid";
import { isBadWord } from "@/lib/badWords";
import { validateEcuadorPhone, getFingerprint } from "@/lib/security";

const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const fingerprint = getFingerprint(ip, userAgent);
    const now = Date.now();

    if (rateLimitMap.has(fingerprint)) {
      const lastReq = rateLimitMap.get(fingerprint)!;
      if (now - lastReq < 15000) {
        return NextResponse.json({ error: "Espera 15 segundos entre intentos." }, { status: 429 });
      }
    }
    rateLimitMap.set(fingerprint, now);

    const body = await request.json();
    const { firstName, lastName, phone } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    if (isBadWord(firstName) || isBadWord(lastName)) {
      return NextResponse.json({ error: "Contenido no permitido." }, { status: 400 });
    }

    const sanitizedPhone = phone.replace(/[^\d]/g, '');
    if (!validateEcuadorPhone(sanitizedPhone)) {
      return NextResponse.json({ error: "Teléfono inválido (Ecuador: 09XXXXXXXX)." }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: true, message: "Modo Demo: Registrado." });
    }

    // Verificar duplicado
    const existing = await adminDb.collection("giveawayParticipants").where("phone", "==", sanitizedPhone).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "Ya estás registrado en el sorteo." }, { status: 409 });
    }

    const id = uuidv4();
    await adminDb.collection("giveawayParticipants").doc(id).set({
      firstName: firstName.toUpperCase(),
      lastName: lastName.toUpperCase(),
      phone: sanitizedPhone,
      fingerprint,
      ip,
      registeredAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "¡Registrado para el sorteo!" });

  } catch (error) {
    console.error("Giveaway Register Error:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
