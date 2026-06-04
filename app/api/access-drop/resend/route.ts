import { NextResponse } from "next/server";
import { z } from "zod";
import { countRecentResends, ensureStore, recordTicketResend } from "@/lib/db/passStore";
import { resendTicketNotifications } from "@/lib/notifications";
import { createWhatsAppDeepLink } from "@/lib/whatsapp";
import {
  ApiError,
  decryptSensitive,
  encryptSensitive,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  hashLookup,
  readJson,
  sanitizeEmail,
  sanitizePhone,
  validateEcuadorPhone,
} from "@/lib/security";

export const runtime = "nodejs";

const resendSchema = z.object({
  serialNumber: z.string().min(8).max(80),
  newPhone: z.string().min(10).max(15).optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, { namespace: "resend-ticket", limit: 3, windowMs: 15 * 60_000 });

    const parsed = await readJson(request, resendSchema);
    if (!parsed.newPhone) {
      throw new ApiError(400, "Debe proveer un n\u00famero de tel\u00e9fono.");
    }

    const cleanPhone = sanitizePhone(parsed.newPhone);
    if (!validateEcuadorPhone(cleanPhone)) {
      throw new ApiError(400, "Telefono invalido. Usa formato Ecuador 09XXXXXXXX.", "INVALID_PHONE");
    }

    const recent = await countRecentResends(parsed.serialNumber, 15 * 60_000);
    if (recent >= 3) {
      throw new ApiError(429, "Demasiados reenv\u00edos. Intenta m\u00e1s tarde.", "RESEND_LIMIT");
    }

    const store = ensureStore();
    let passInfo: {
      first_name?: string;
      last_name?: string;
      firstName?: string;
      lastName?: string;
    } | null = null;

    let qrPayload = "";

    if (store.kind === "supabase") {
      const { data: pass, error } = await store.supabase
        .from("party_passes")
        .select("participant_id,qr_payload_encrypted")
        .eq("serial_number", parsed.serialNumber)
        .maybeSingle();
      if (error || !pass) throw new ApiError(404, "Pase no encontrado.");
      if (pass.qr_payload_encrypted) {
        qrPayload = decryptSensitive(pass.qr_payload_encrypted);
      }

      const { data: access, error: accessErr } = await store.supabase
        .from("access_drops")
        .select("first_name,last_name")
        .eq("id", pass.participant_id)
        .maybeSingle();
      if (accessErr || !access) throw new ApiError(404, "Acceso no encontrado.");
      passInfo = access;

      await store.supabase.from("access_drops").update({
        phone_encrypted: encryptSensitive(cleanPhone),
        phone_hash: hashLookup(cleanPhone),
      }).eq("id", pass.participant_id);
    } else {
      const passDoc = await store.db.collection("partyPasses").doc(parsed.serialNumber).get();
      if (!passDoc.exists) throw new ApiError(404, "Pase no encontrado.");
      const pass = passDoc.data() || {};
      if (pass.qrPayloadEncrypted) {
        qrPayload = decryptSensitive(pass.qrPayloadEncrypted);
      }
      const accessDoc = await store.db.collection("accessDrops").doc(pass.participantId).get();
      if (!accessDoc.exists) throw new ApiError(404, "Acceso no encontrado.");
      passInfo = accessDoc.data() || {};

      await store.db.collection("accessDrops").doc(pass.participantId).update({
        phoneEncrypted: encryptSensitive(cleanPhone),
        phoneHash: hashLookup(cleanPhone),
      });
    }

    const firstName = passInfo.first_name || passInfo.firstName || "DAWGS";
    const lastName = passInfo.last_name || passInfo.lastName || "GUEST";

    if (!qrPayload) throw new ApiError(404, "QR del pase no disponible.");

    await resendTicketNotifications(
      "",
      cleanPhone,
      { firstName, lastName, email: "", phone: cleanPhone, transactionId: "", serialNumber: parsed.serialNumber },
      qrPayload,
    );

    await recordTicketResend({
      serialNumber: parsed.serialNumber,
      channel: "whatsapp",
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    const waLink = createWhatsAppDeepLink(cleanPhone, parsed.serialNumber);

    return NextResponse.json({
      success: true,
      message: "Tu acceso fue reenviado por WhatsApp",
      waLink,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
