import { NextResponse } from "next/server";
import { ensureStore, readJsonFile, writeJsonFile } from "@/lib/db/passStore";
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

    const store = ensureStore();
    const phoneHash = hashLookup(phone);

    if (store.kind === "postgres") {
      const result = await store.db.begin(async (sql) => {
        // Check duplicate phone
        const [dupPhone] = await sql`
          SELECT id FROM access_drops
          WHERE phone_hash = ${phoneHash} AND status = 'confirmed'
          LIMIT 1
        `;
        if (dupPhone) return { error: "Este acceso ya fue reclamado." };

        // Check duplicate name
        const [dupName] = await sql`
          SELECT id FROM access_drops
          WHERE first_name = ${firstName} AND last_name = ${lastName} AND status = 'confirmed'
          LIMIT 1
        `;
        if (dupName) return { error: "Este acceso ya fue reclamado." };

        // Check limit of 100
        const [countRow] = await sql`
          SELECT COUNT(*) as count FROM access_drops WHERE status = 'confirmed'
        `;
        if (Number(countRow?.count || 0) >= 100) return { error: "ACCESS DROP AGOTADO." };

        const participantId = uuidv4();
        const serialNumber = `NENEZ-${Math.floor(1000 + Math.random() * 9000)}-${uuidv4().split("-")[0].toUpperCase()}`;
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
        const qrPayload = generateSecureQrPayload(serialNumber, token, "trap-loud");

        // Insert access_drop
        await sql`
          INSERT INTO access_drops (
            id, first_name, last_name, phone_hash, phone_encrypted,
            event_id, serial_number, status, registered_at
          ) VALUES (
            ${participantId}, ${firstName}, ${lastName},
            ${phoneHash}, ${encryptSensitive(phone)},
            'trap-loud', ${serialNumber}, 'confirmed', ${new Date().toISOString()}
          )
        `;

        // Insert party_pass
        await sql`
          INSERT INTO party_passes (
            serial_number, code_hash, event_id, participant_id,
            used, expires_at, qr_payload_encrypted, type, created_at
          ) VALUES (
            ${serialNumber}, ${hashToken(token)}, 'trap-loud', ${participantId},
            false, ${expiresAt}, ${encryptSensitive(qrPayload)}, 'FOUNDING_DAWG', ${new Date().toISOString()}
          )
        `;

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
    }

    // local-json fallback
    const accessDrops = readJsonFile<any>("access_drops");
    const dupPhone = accessDrops.find((ad: any) => ad.phoneHash === phoneHash && ad.status === "confirmed");
    if (dupPhone) return NextResponse.json({ error: "Este acceso ya fue reclamado." }, { status: 409 });

    const dupName = accessDrops.find(
      (ad: any) => ad.firstName === firstName && ad.lastName === lastName && ad.status === "confirmed"
    );
    if (dupName) return NextResponse.json({ error: "Este acceso ya fue reclamado." }, { status: 409 });

    if (accessDrops.filter((ad: any) => ad.status === "confirmed").length >= 100) {
      return NextResponse.json({ error: "ACCESS DROP AGOTADO." }, { status: 409 });
    }

    const participantId = uuidv4();
    const serialNumber = `NENEZ-${Math.floor(1000 + Math.random() * 9000)}-${uuidv4().split("-")[0].toUpperCase()}`;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    const qrPayload = generateSecureQrPayload(serialNumber, token, "trap-loud");

    accessDrops.push({
      id: participantId,
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
    writeJsonFile("access_drops", accessDrops);

    const partyPasses = readJsonFile<any>("party_passes");
    partyPasses.push({
      serialNumber,
      codeHash: hashToken(token),
      eventId: "trap-loud",
      participantId,
      used: false,
      expiresAt,
      qrPayloadEncrypted: encryptSensitive(qrPayload),
      type: "FOUNDING_DAWG",
      createdAt: new Date().toISOString(),
    });
    writeJsonFile("party_passes", partyPasses);

    return NextResponse.json({
      success: true,
      message: "FOUNDING ACCESS CONFIRMED",
      qrPayload,
      serialNumber,
      firstName,
      lastName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
