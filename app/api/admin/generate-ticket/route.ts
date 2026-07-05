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
  deliveryChannel: z.enum(["both", "email", "whatsapp"]).optional(),
});

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = generateSchema.parse(body);

    const firstName = sanitizeName(parsed.firstName);
    const lastName = sanitizeName(parsed.lastName);
    const quantity = parsed.quantity || 1;
    const deliveryChannel = parsed.deliveryChannel || "both";

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

    if (store.kind === "supabase" && phone !== "") {
      const { data: existing } = await store.supabase
        .from("access_drops")
        .select("id")
        .eq("phone_hash", phoneHash)
        .eq("event_id", eventId)
        .eq("status", "confirmed")
        .limit(1);

      if (existing?.length) {
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
      } else if (store.kind === "supabase") {
        await store.supabase.from("tickets").insert({
          id: transactionId,
          first_name: firstName,
          last_name: lastName,
          phone_hash: phoneHash,
          phone_encrypted: encryptSensitive(phone),
          email_hash: emailHash,
          email_encrypted: encryptSensitive(email),
          document_hash: documentHash,
          document_encrypted: encryptSensitive(documentNumber),
          event_id: eventId,
          amount: 0,
          status: "approved",
          processor: "admin_manual",
          serial_number: serialNumber,
          qr_payload_encrypted: encryptedQrPayload,
          activated_at: now,
          created_at: now,
          updated_at: now,
        });

        await store.supabase.from("access_drops").insert({
          id: participantId,
          first_name: firstName,
          last_name: lastName,
          phone_hash: phoneHash,
          phone_encrypted: encryptSensitive(phone),
          email_hash: emailHash,
          email_encrypted: encryptSensitive(email),
          document_hash: documentHash,
          document_encrypted: encryptSensitive(documentNumber),
          event_id: eventId,
          serial_number: serialNumber,
          status: "confirmed",
          registered_at: now,
        });

        await store.supabase.from("party_passes").insert({
          serial_number: serialNumber,
          code_hash: hashToken(qrToken),
          event_id: eventId,
          participant_id: participantId,
          used: false,
          expires_at: expiresAt,
          qr_payload_encrypted: encryptedQrPayload,
          type: "ADMIN_GUEST",
          created_at: now,
        });
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

    if (emailProvided && (deliveryChannel === "email" || deliveryChannel === "both")) {
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
