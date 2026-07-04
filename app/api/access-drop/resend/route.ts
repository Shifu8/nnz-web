import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStore } from "@/lib/db/passStore";
import {
  ApiError,
  decryptSensitive,
  encryptSensitive,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  hashLookup,
  readJson,
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
      throw new ApiError(400, "Debe proveer un número de teléfono.");
    }

    const cleanPhone = sanitizePhone(parsed.newPhone);
    if (!validateEcuadorPhone(cleanPhone)) {
      throw new ApiError(400, "Telefono invalido. Usa formato Ecuador 09XXXXXXXX.", "INVALID_PHONE");
    }

    const store = ensureStore();

    if (store.kind === "supabase") {
      const { data: pass, error } = await store.supabase
        .from("party_passes")
        .select("participant_id")
        .eq("serial_number", parsed.serialNumber)
        .maybeSingle();
      if (error || !pass) throw new ApiError(404, "Pase no encontrado.");

      await store.supabase.from("access_drops").update({
        phone_encrypted: encryptSensitive(cleanPhone),
        phone_hash: hashLookup(cleanPhone),
      }).eq("id", pass.participant_id);
    } else {
      const passDoc = await store.db.collection("partyPasses").doc(parsed.serialNumber).get();
      if (!passDoc.exists) throw new ApiError(404, "Pase no encontrado.");
      const pass = passDoc.data() || {};

      await store.db.collection("accessDrops").doc(pass.participantId).update({
        phoneEncrypted: encryptSensitive(cleanPhone),
        phoneHash: hashLookup(cleanPhone),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Número actualizado correctamente.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
