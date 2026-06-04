import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/adminApp";
import { v4 as uuidv4 } from "uuid";
import { isBadWord } from "@/lib/badWords";
import {
  encryptSensitive,
  generateSecureQrPayload,
  getClientIp,
  getFingerprint,
  handleApiError,
  hashLookup,
  hashToken,
  sanitizeInstagram,
  sanitizeName,
  sanitizePhone,
  validateEcuadorPhone,
  validateName,
} from "@/lib/security";

export const runtime = "nodejs";

const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const fingerprint = getFingerprint(ip, userAgent);
    const now = Date.now();

    if (rateLimitMap.has(fingerprint)) {
      const lastReq = rateLimitMap.get(fingerprint)!;
      if (now - lastReq < 60_000) {
        return NextResponse.json({ error: "Actividad sospechosa detectada. Espera 60 segundos." }, { status: 429 });
      }
    }
    rateLimitMap.set(fingerprint, now);

    const body = await request.json();
    const firstName = sanitizeName(body.firstName);
    const lastName = sanitizeName(body.lastName);
    const phone = sanitizePhone(body.phone);
    const instagram = sanitizeInstagram(body.instagram);

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!validateName(firstName) || !validateName(lastName)) {
      return NextResponse.json({ error: "Nombre o apellido invalido. Solo letras permitidas." }, { status: 400 });
    }

    if (isBadWord(firstName) || isBadWord(lastName)) {
      return NextResponse.json({ error: "Contenido bloqueado por politicas de seguridad." }, { status: 400 });
    }

    if (!validateEcuadorPhone(phone)) {
      return NextResponse.json({ error: "Numero invalido. (Ecuador: 09XXXXXXXX)" }, { status: 400 });
    }

    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Base de datos no configurada. No se generan QRs demo." }, { status: 503 });
    }

    const phoneHash = hashLookup(phone);
    const result = await db.runTransaction(async (transaction) => {
      const phoneQuery = db.collection("accessDrops").where("phoneHash", "==", phoneHash).limit(1);
      const phoneSnap = await transaction.get(phoneQuery);
      if (!phoneSnap.empty) return { error: "Este acceso ya fue reclamado." };

      const legacyPhoneQuery = db.collection("accessDrops").where("phone", "==", phone).limit(1);
      const legacyPhoneSnap = await transaction.get(legacyPhoneQuery);
      if (!legacyPhoneSnap.empty) return { error: "Este acceso ya fue reclamado." };

      const nameQuery = db
        .collection("accessDrops")
        .where("firstName", "==", firstName)
        .where("lastName", "==", lastName)
        .limit(1);
      const nameSnap = await transaction.get(nameQuery);
      if (!nameSnap.empty) return { error: "Este acceso ya fue reclamado." };

      const fpQuery = db.collection("accessDrops").where("fingerprint", "==", fingerprint).limit(1);
      const fpSnap = await transaction.get(fpQuery);
      if (!fpSnap.empty) return { error: "Este acceso ya fue reclamado." };

      const countSnap = await db.collection("accessDrops").count().get();
      if (countSnap.data().count >= 100) return { error: "ACCESS DROP AGOTADO." };

      const participantId = uuidv4();
      const serialNumber = `DAWGS-${Math.floor(1000 + Math.random() * 9000)}-${uuidv4().split("-")[0].toUpperCase()}`;
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
      const qrPayload = generateSecureQrPayload(serialNumber, token, "trap-loud");

      const participantRef = db.collection("accessDrops").doc(participantId);
      transaction.set(participantRef, {
        firstName,
        lastName,
        phoneHash,
        phoneEncrypted: encryptSensitive(phone),
        instagram,
        fingerprint,
        ipHash: hashLookup(ip),
        eventId: "trap-loud",
        registeredAt: new Date().toISOString(),
        serialNumber,
        status: "confirmed",
      });

      const passRef = db.collection("partyPasses").doc(serialNumber);
      transaction.set(passRef, {
        id: serialNumber,
        codeHash: hashToken(token),
        eventId: "trap-loud",
        participantId,
        used: false,
        expiresAt,
        qrPayloadEncrypted: encryptSensitive(qrPayload),
        type: "FOUNDING_DAWG",
        createdAt: new Date().toISOString(),
      });

      return { success: true, qrPayload, serialNumber, firstName, lastName };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: "FOUNDING ACCESS CONFIRMED",
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
