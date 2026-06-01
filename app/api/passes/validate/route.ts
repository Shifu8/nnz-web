import { z } from "zod";
import { validatePassOnce, type PassValidationResult } from "@/lib/db/passStore";
import { validateLocalReceiptPassOnce } from "@/lib/staff/localReceiptPasses";
import { checkUtplStudentAccess } from "@/lib/staff/utplAccess";
import { loadCareers } from "@/lib/staff/careerStore";
import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  parseSecureQrPayload,
  readJson,
  verifyStaffRequest,
} from "@/lib/security";

export const runtime = "nodejs";

const careerIds = loadCareers().map((c) => c.id);
const careerEnum = careerIds.length > 0 ? z.enum(careerIds as [string, ...string[]]) : z.string();

const validateSchema = z.object({
  qrPayload: z.string().min(1).max(8192),
  scanType: z.enum(["ticket", "student"]).default("ticket"),
  visualText: z.string().max(6000).optional(),
  manualCareerId: careerEnum.optional(),
  manualGenderConfirmed: z.boolean().optional(),
});

const EVENT_ID = "trap-loud";

async function validateTicketScan(input: {
  qrPayload: string;
  staffSessionId: string;
  ip: string;
  userAgent: string;
}): Promise<PassValidationResult & { kind: "ticket"; status: "allowed" | "rejected" }> {
  const payload = parseSecureQrPayload(input.qrPayload);
  let dbResult: PassValidationResult | null = null;
  let dbUnavailable = false;

  try {
    dbResult = await validatePassOnce({
      serialNumber: payload.serialNumber,
      token: payload.token,
      eventId: payload.eventId,
      staffSessionId: input.staffSessionId,
      ip: input.ip,
      userAgent: input.userAgent,
    });
  } catch (error) {
    if (error instanceof ApiError && ["DB_UNAVAILABLE", "DB_ERROR"].includes(error.code)) {
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  if (dbResult?.valid || (dbResult && dbResult.reason !== "not_found")) {
    return { ...dbResult, kind: "ticket", status: dbResult.valid ? "allowed" : "rejected" };
  }

  const localResult = validateLocalReceiptPassOnce({
    qrPayload: input.qrPayload,
    staffSessionId: input.staffSessionId,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  if (localResult.valid || localResult.reason !== "not_found" || dbUnavailable) {
    return { ...localResult, kind: "ticket", status: localResult.valid ? "allowed" : "rejected" };
  }

  if (dbResult) return { ...dbResult, kind: "ticket", status: "rejected" };
  return { ...localResult, kind: "ticket", status: "rejected" };
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "pass-validate", limit: 120, windowMs: 60_000 });
    const staff = await verifyStaffRequest(request, { requireCsrf: true, roles: ["staff", "admin"] });
    const { qrPayload, scanType, visualText, manualCareerId, manualGenderConfirmed } = await readJson(request, validateSchema);
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const shouldValidateTicket = scanType === "ticket";

    if (shouldValidateTicket) {
      const result = await validateTicketScan({
        qrPayload,
        staffSessionId: staff.sessionId,
        ip,
        userAgent,
      });

      return Response.json(result, { status: result.valid ? 200 : 400 });
    }

    const result = checkUtplStudentAccess({
      qrPayload,
      eventId: EVENT_ID,
      visualText,
    });

    return Response.json(result, { status: result.valid ? 200 : 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
