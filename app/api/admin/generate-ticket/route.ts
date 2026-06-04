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
import { ensureStore } from "@/lib/db/passStore";
import { recordAdminLog } from "@/lib/db/adminLogs";
import { createWhatsAppDeepLink } from "@/lib/whatsapp";
import { encryptSensitive, hashLookup, hashToken, generateSecureQrPayload } from "@/lib/security";

const EVENT_ID = "trap-loud";

const generateSchema = z
  .object({
    firstName: z.string().min(2).max(40),
    lastName: z.string().min(2).max(40),
    phone: z.string().max(15),
    email: z.string().max(120).optional(),
  });

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = generateSchema.parse(body);

    const firstName = sanitizeName(parsed.firstName);
    const lastName = sanitizeName(parsed.lastName);
    const transactionId = crypto.randomUUID();

    const phone = sanitizePhone(parsed.phone ?? "");
    const email = sanitizeEmail(parsed.email ?? `vip+${transactionId.slice(0, 8)}@dawgs.local`);
    const documentNumber = "9999999999";
    const store = ensureStore();
    const now = new Date().toISOString();

    const serialNumber = `DAWGS-${crypto.randomInt(1000, 9999)}-${transactionId.split("-")[0].toUpperCase()}`;
    const qrToken = crypto.randomUUID();
    const qrPayload = generateSecureQrPayload(serialNumber, qrToken, EVENT_ID);
    const participantId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const phoneHash = hashLookup(phone);
    const emailHash = hashLookup(email);
    const documentHash = hashLookup(documentNumber);
    const encryptedQrPayload = encryptSensitive(qrPayload);

    if (store.kind === "supabase") {
      const { data: existing } = await store.supabase
        .from("access_drops")
        .select("id")
        .eq("phone_hash", phoneHash)
        .eq("event_id", EVENT_ID)
        .eq("status", "confirmed")
        .limit(1);

      if (existing?.length) {
        throw new ApiError(409, "Este telefono ya tiene un ticket activo.");
      }

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
        event_id: EVENT_ID,
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
        event_id: EVENT_ID,
        serial_number: serialNumber,
        status: "confirmed",
        registered_at: now,
      });

      await store.supabase.from("party_passes").insert({
        serial_number: serialNumber,
        code_hash: hashToken(qrToken),
        event_id: EVENT_ID,
        participant_id: participantId,
        used: false,
        expires_at: expiresAt,
        qr_payload_encrypted: encryptedQrPayload,
        type: "ADMIN_GUEST",
        created_at: now,
      });
    }

    const waLink = createWhatsAppDeepLink(phone, serialNumber);

    await recordAdminLog("admin_generate_ticket", {
      serialNumber,
      firstName,
      lastName,
      waLink,
    });

    return NextResponse.json({
      success: true,
      serialNumber,
      waLink,
      instructions: "Comparte este enlace con el usuario para que reciba su ticket por WhatsApp autom\u00e1ticamente.",
      waConfigured: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
