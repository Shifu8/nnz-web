/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Obtiene los últimos participantes del sorteo con teléfonos ocultos.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ participants: [] });
    }

    const snapshot = await adminDb.collection("giveawayParticipants")
      .orderBy("registeredAt", "desc")
      .limit(10)
      .get();

    const participants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        // Mask phone: 0987******
        phone: data.phone.slice(0, 4) + "******"
      };
    });

    return NextResponse.json({ participants });

  } catch (error) {
    console.error("Giveaway Participants Error:", error);
    return NextResponse.json({ participants: [] });
  }
}
