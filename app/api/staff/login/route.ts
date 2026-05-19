/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Ruta de API para validar la contraseña de STAFF.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const validPassword = process.env.STAFF_PASSWORD || "DAWGS-STAFF-2026";

    if (password !== validPassword) {
      return NextResponse.json({ error: "ACCESO DENEGADO" }, { status: 401 });
    }

    // Create a staff session in Firestore (mocked for simplicity if DB not fully connected)
    const sessionId = `staff-session-${Date.now()}`;
    
    try {
      if (adminDb) {
        await adminDb.collection("staffSessions").doc(sessionId).set({
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours
        });
      } else {
        console.warn("Firestore fallback active, using local mock session.");
      }
    } catch (dbError) {
      console.warn("Firestore error, skipping session creation.", dbError);
    }

    return NextResponse.json({ 
      success: true, 
      sessionToken: sessionId 
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
