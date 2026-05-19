/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Ruta de API para reclamar un código y generar un Party Pass.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || code.length < 6) {
      return NextResponse.json({ error: "INVALID CODE" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    
    try {
      if (adminDb) {
        // Check if code was already claimed
        const passQuery = await adminDb.collection("passes").where("code", "==", cleanCode).get();
        if (!passQuery.empty) {
          return NextResponse.json({ error: "CODE ALREADY CLAIMED" }, { status: 403 });
        }
      }

      // Generate a new Party Pass
      const passId = `PASS-${uuidv4().slice(0, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days
      
      const payloadObj = {
        type: "DAWGS_PASS",
        passId: passId,
        token: cleanCode,
        eventId: "trap-loud",
        expiresAt: expiresAt,
        used: false
      };
      
      const newPass = {
        id: passId,
        code: cleanCode,
        eventId: "trap-loud",
        expiresAt: expiresAt,
        qrPayload: JSON.stringify(payloadObj),
        used: false,
        createdAt: new Date().toISOString()
      };

      if (adminDb) {
        await adminDb.collection("passes").doc(passId).set(newPass);
      }

      return NextResponse.json({ 
        success: true, 
        partyPass: newPass 
      });
    } catch (dbError) {
      console.warn("Firestore fallback active", dbError);
      
      // Fallback if DB not fully connected
      const passId = `PASS-${uuidv4().slice(0, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      const payloadObj = {
        type: "DAWGS_PASS",
        passId: passId,
        token: cleanCode,
        eventId: "trap-loud",
        expiresAt: expiresAt,
        used: false
      };

      return NextResponse.json({ 
        success: true, 
        partyPass: {
          id: passId,
          code: cleanCode,
          eventId: "trap-loud",
          expiresAt: expiresAt,
          qrPayload: JSON.stringify(payloadObj),
          used: false
        } 
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "INTERNAL SERVER ERROR" }, { status: 500 });
  }
}
