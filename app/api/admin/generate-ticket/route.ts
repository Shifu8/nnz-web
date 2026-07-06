import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import {
  verifyAdminRequest,
  handleApiError,
  ApiError,
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
} from "@/lib/security";
import { ensureStore, readJsonFile, writeJsonFile } from "@/lib/db/passStore";
import { recordAdminLog } from "@/lib/db/adminLogs";
import { encryptSensitive, hashLookup, hashToken, generateSecureQrPayload } from "@/lib/security";
import { generateTicketImage } from "@/lib/tickets/ticketImage";
import { sendTicketPdfViaGmailWithLimit } from "@/lib/gmailDelivery";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";

const EVENT_ID = "trap-loud";

const generateSchema = z.object({
  firstName: z.string().min(2).max(40),
  lastName: z.string().min(2).max(40),
  phone: z.string().max(15).optional(),
  email: z.string().max(120).optional(),
  quantity: z.number().int().min(1).max(50).optional(),
  ticketDesign: z.string().optional(),
  deliveryChannel: z.enum(["email"]).optional(),
});

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = generateSchema.parse(body);

    const firstName = sanitizeName(parsed.firstName);
    const lastName = sanitizeName(parsed.lastName);
    const quantity = parsed.quantity || 1;
    const deliveryChannel = parsed.deliveryChannel || "email";

    const phone = sanitizePhone(parsed.phone ?? "");
    const emailProvided = parsed.email && parsed.email.trim().length > 0;
    const email = emailProvided
      ? sanitizeEmail(parsed.email!)
      : `vip+${crypto.randomUUID().slice(0, 8)}@nenez.local`;

    const documentNumber = "9999999999";
    const store = ensureStore();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const phoneHash = hashLookup(phone);
    const emailHash = hashLookup(email);
    const documentHash = hashLookup(documentNumber);

    const serials: string[] = [];
    const qrPayloads: string[] = [];
    const pngBuffers: Buffer[] = [];

    const event = getActiveTicketEvent();
    const eventId = EVENT_ID;

    if (store.kind === "postgres" && phone !== "") {
      const existing = await store.db`
        SELECT id FROM access_drops
        WHERE phone_hash = ${phoneHash}
          AND event_id = ${eventId}
          AND status = 'confirmed'
        LIMIT 1
      `;

      if (existing.length) {
        throw new ApiError(409, "Este telefono ya tiene un ticket activo.");
      }
    }

    for (let i = 0; i < quantity; i++) {
      const transactionId = crypto.randomUUID();
      const participantId = crypto.randomUUID();
      const serialNumber = `NENEZ-${crypto.randomInt(1000, 9999)}-${transactionId.split("-")[0].toUpperCase()}`;
      const qrToken = crypto.randomUUID();
      const qrPayload = generateSecureQrPayload(serialNumber, qrToken, eventId);
      const encryptedQrPayload = encryptSensitive(qrPayload);

      serials.push(serialNumber);
      qrPayloads.push(qrPayload);

      if (store.kind === "local-json") {
        const tickets = readJsonFile<any>("tickets");
        tickets.push({
          id: transactionId,
          firstName,
          lastName,
          phoneHash,
          phoneEncrypted: encryptSensitive(phone),
          emailHash,
          emailEncrypted: encryptSensitive(email),
          documentHash,
          documentEncrypted: encryptSensitive(documentNumber),
          eventId,
          amount: 0,
          status: "approved",
          processor: "admin_manual",
          serialNumber,
          qrPayloadEncrypted: encryptedQrPayload,
          activatedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        writeJsonFile("tickets", tickets);

        const accessDrops = readJsonFile<any>("access_drops");
        accessDrops.push({
          id: participantId,
          firstName,
          lastName,
          phoneHash,
          phoneEncrypted: encryptSensitive(phone),
          emailHash,
          emailEncrypted: encryptSensitive(email),
          documentHash,
          documentEncrypted: encryptSensitive(documentNumber),
          eventId,
          serialNumber,
          status: "confirmed",
          registeredAt: now,
        });
        writeJsonFile("access_drops", accessDrops);

        const partyPasses = readJsonFile<any>("party_passes");
        partyPasses.push({
          serialNumber,
          codeHash: hashToken(qrToken),
          eventId,
          participantId,
          used: false,
          expiresAt,
          qrPayloadEncrypted: encryptedQrPayload,
          type: "ADMIN_GUEST",
          createdAt: now,
        });
        writeJsonFile("party_passes", partyPasses);
      } else if (store.kind === "postgres") {
        const ticketPhone = phone || `vip-phone-${transactionId}`;
        const ticketPhoneHash = hashLookup(ticketPhone);
        const ticketPhoneEncrypted = encryptSensitive(ticketPhone);

        try {
          await store.db`
            INSERT INTO tickets (
              id, first_name, last_name, phone_hash, phone_encrypted,
              email_hash, email_encrypted, document_hash, document_encrypted,
              event_id, amount, status, processor, serial_number,
              qr_payload_encrypted, activated_at, created_at, updated_at
            ) VALUES (
              ${transactionId}, ${firstName}, ${lastName}, ${ticketPhoneHash}, ${ticketPhoneEncrypted},
              ${emailHash}, ${encryptSensitive(email)}, ${documentHash}, ${encryptSensitive(documentNumber)},
              ${eventId}, 0, 'approved', 'admin_manual', ${serialNumber},
              ${encryptedQrPayload}, ${now}, ${now}, ${now}
            )
          `;

          await store.db`
            INSERT INTO access_drops (
              id, first_name, last_name, phone_hash, phone_encrypted,
              email_hash, email_encrypted, document_hash, document_encrypted,
              event_id, serial_number, status, registered_at
            ) VALUES (
              ${participantId}, ${firstName}, ${lastName}, ${ticketPhoneHash}, ${ticketPhoneEncrypted},
              ${emailHash}, ${encryptSensitive(email)}, ${documentHash}, ${encryptSensitive(documentNumber)},
              ${eventId}, ${serialNumber}, 'confirmed', ${now}
            )
          `;

          await store.db`
            INSERT INTO party_passes (
              serial_number, code_hash, event_id, participant_id,
              used, expires_at, qr_payload_encrypted, type, created_at
            ) VALUES (
              ${serialNumber}, ${hashToken(qrToken)}, ${eventId}, ${participantId},
              false, ${expiresAt}, ${encryptedQrPayload}, 'ADMIN_GUEST', ${now}
            )
          `;
        } catch (dbErr: any) {
          throw new ApiError(500, `Error al guardar ticket #${i + 1}: ${dbErr.message}`, "DB_ERROR");
        }
      }

      // Generate ticket image
      const pngBuffer = await generateTicketImage({
        firstName,
        lastName,
        serialNumber,
        qrPayload,
        quantity: 1,
        eventTitle: event.title,
        eventCity: event.venue,
        eventDate: event.dateLabel,
        ticketDesign: parsed.ticketDesign || "1",
      });
      pngBuffers.push(pngBuffer);
    }

    const serialsString = serials.join(",");

    let emailSent = false;
    let emailError = "";

    if (emailProvided && deliveryChannel === "email") {
      try {
        const gmailResult = await sendTicketPdfViaGmailWithLimit({
          to: email,
          firstName,
          lastName,
          serialNumber: serialsString,
          quantity,
          pdfBuffer: pngBuffers,
          eventTitle: event.title,
          eventName: event.eventName,
          eventDate: event.dateLabel,
          eventVenue: event.venue,
        });
        emailSent = gmailResult.success;
        if (!gmailResult.success) {
          emailError = gmailResult.reason || "Error desconocido enviando correo";
        }
      } catch (err: any) {
        emailError = err.message || "Error enviando correo";
      }
    }

    await recordAdminLog("admin_generate_ticket", {
      serialNumber: serialsString,
      firstName,
      lastName,
      quantity,
      emailSent,
      emailError,
    });

    return NextResponse.json({
      success: true,
      serialNumber: serialsString,
      emailSent,
      emailError,
      instructions: `Ticket(s) generado(s) para ${firstName} ${lastName}. Serie: ${serialsString}. Gmail: ${emailSent ? "Enviado con éxito" : emailError ? `Error: ${emailError}` : "No solicitado"}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
