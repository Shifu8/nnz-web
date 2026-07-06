import { NextResponse } from "next/server";
import { ensureStore, readJsonFile, writeJsonFile } from "@/lib/db/passStore";
import { v4 as uuidv4 } from "uuid";

type PassEntry = {
  id: string;
  code: string;
  eventId: string;
  expiresAt: string;
  qrPayload: string;
  used: boolean;
  createdAt: string;
};

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || code.length < 6) {
      return NextResponse.json({ error: "INVALID CODE" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const store = ensureStore();

    if (store.kind === "postgres") {
      try {
        // Check if code was already claimed
        const existing = await store.db`
          SELECT id FROM passes WHERE code = ${cleanCode} LIMIT 1
        `;
        if (existing.length) {
          return NextResponse.json({ error: "CODE ALREADY CLAIMED" }, { status: 403 });
        }

        // Generate a new Party Pass
        const passId = `PASS-${uuidv4().slice(0, 8).toUpperCase()}`;
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days
        const payloadObj = {
          type: "NENEZ_PASS",
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

        // Insert pass
        await store.db`
          INSERT INTO passes (id, code, event_id, expires_at, qr_payload, used, created_at)
          VALUES (${newPass.id}, ${newPass.code}, ${newPass.eventId}, ${newPass.expiresAt}, ${newPass.qrPayload}, ${newPass.used}, ${newPass.createdAt})
        `;

        return NextResponse.json({
          success: true,
          partyPass: newPass
        });
      } catch (dbError: any) {
        console.warn("Postgres passes query failed, falling back to local json", dbError);
      }
    }

    // local-json fallback
    const passes = readJsonFile<PassEntry>("passes");
    const dup = passes.find((p) => p.code === cleanCode);
    if (dup) {
      return NextResponse.json({ error: "CODE ALREADY CLAIMED" }, { status: 403 });
    }

    const passId = `PASS-${uuidv4().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const payloadObj = {
      type: "NENEZ_PASS",
      passId: passId,
      token: cleanCode,
      eventId: "trap-loud",
      expiresAt: expiresAt,
      used: false
    };

    const newPass: PassEntry = {
      id: passId,
      code: cleanCode,
      eventId: "trap-loud",
      expiresAt: expiresAt,
      qrPayload: JSON.stringify(payloadObj),
      used: false,
      createdAt: new Date().toISOString()
    };

    passes.push(newPass);
    writeJsonFile("passes", passes);

    return NextResponse.json({
      success: true,
      partyPass: newPass
    });
  } catch (error) {
    return NextResponse.json({ error: "INTERNAL SERVER ERROR" }, { status: 500 });
  }
}
