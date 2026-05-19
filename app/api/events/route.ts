/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Ruta de API para obtener los eventos disponibles.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";

export async function GET() {
  try {
    let events: any[] = [];
    try {
      if (adminDb) {
        const snapshot = await adminDb.collection("events").get();
        snapshot.forEach(doc => {
          events.push({ id: doc.id, ...doc.data() });
        });
      } else {
        throw new Error("No adminDb");
      }
    } catch (dbError) {
      console.warn("Firestore not fully configured, returning empty events list.");
    }

    return NextResponse.json({ 
      success: true, 
      events 
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
