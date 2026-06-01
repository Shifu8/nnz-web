/**
 * Registro seguro para el Live Giveaway (Supabase o Firebase).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { registerGiveawayEntry } from "@/lib/db/giveawayStore";
import { isBadWord } from "@/lib/badWords";
import { getGiveawaySchedule } from "@/lib/giveaway/schedule";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readJson,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  validateEcuadorPhone,
} from "@/lib/security";

export const runtime = "nodejs";

const registerSchema = z.object({
  firstName: z.string().min(2).max(40),
  lastName: z.string().min(2).max(40),
  phone: z.string().min(10).max(15),
  email: z.string().email().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, { namespace: "giveaway-register", limit: 5, windowMs: 60_000 });

    const schedule = getGiveawaySchedule();
    const isDemo = process.env.NEXT_PUBLIC_PAYPHONE_DEMO_MODE === "true";
    if (schedule.phase !== "open" && !isDemo) {
      throw new ApiError(403, "El sorteo no esta abierto.", "GIVEAWAY_CLOSED");
    }

    const body = await readJson(request, registerSchema);
    const firstName = sanitizeName(body.firstName);
    const lastName = sanitizeName(body.lastName);
    const phone = sanitizePhone(body.phone);
    const email = body.email ? sanitizeEmail(body.email) : undefined;

    if (isBadWord(firstName) || isBadWord(lastName)) {
      throw new ApiError(400, "Contenido no permitido.", "BAD_WORD");
    }

    if (!validateEcuadorPhone(phone)) {
      throw new ApiError(400, "Telefono invalido (Ecuador: 09XXXXXXXX).", "INVALID_PHONE");
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    try {
      const { id } = await registerGiveawayEntry({
        firstName,
        lastName,
        phone,
        email,
        ip,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Registrado para el sorteo.",
        participantId: id,
      });
    } catch (err: unknown) {
      let msg = "";
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        msg = String((err as { message: unknown }).message);
      }
      if (msg === "DUPLICATE_PHONE") {
        throw new ApiError(409, "Este telefono ya esta registrado.", "DUPLICATE_PHONE");
      }
      if (msg === "DUPLICATE_EMAIL") {
        throw new ApiError(409, "Este correo ya esta registrado.", "DUPLICATE_EMAIL");
      }
      throw new ApiError(500, "Error interno del servidor.", "INTERNAL_ERROR");
    }
  } catch (error) {
    return handleApiError(error);
  }
}
