import { z } from "zod";
import {
  assertSameOrigin,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readJson,
  verifyStaffRequest,
} from "@/lib/security";
import { confirmUtplStudentScan } from "@/lib/staff/utplAccess";

export const runtime = "nodejs";

const confirmSchema = z.object({
  qrPayload: z.string().min(1).max(8192),
  careerId: z.string().min(1).max(80),
  genderConfirmed: z.boolean().optional(),
  student: z.object({
    fullName: z.string().optional(),
    documentNumber: z.string().optional(),
    modality: z.string().optional(),
    gender: z.enum(["female", "male", "unknown"]),
  }),
});

const EVENT_ID = "trap-loud";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "pass-confirm", limit: 60, windowMs: 60_000 });
    const staff = await verifyStaffRequest(request, { requireCsrf: true, roles: ["staff", "admin"] });
    const { qrPayload, careerId, genderConfirmed, student } = await readJson(request, confirmSchema);
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    const result = confirmUtplStudentScan({
      qrPayload,
      eventId: EVENT_ID,
      staffSessionId: staff.sessionId,
      ip,
      userAgent,
      student,
      careerId,
      genderConfirmed: genderConfirmed ?? true,
    });

    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
