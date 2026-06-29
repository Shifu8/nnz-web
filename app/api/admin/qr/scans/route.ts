import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  handleApiError,
  readJson,
} from "@/lib/security";
import { deleteScanByHash, getScansForEvent } from "@/lib/staff/studentScanStore";

export const runtime = "nodejs";

const deleteSchema = z.object({
  payloadHash: z.string().min(1, "payloadHash requerido"),
});

function verifyAdmin(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) throw new ApiError(401, "No autorizado.", "UNAUTHORIZED");
  const decoded = Buffer.from(auth.replace("Bearer ", ""), "base64").toString("utf-8");
  const [user, pass] = decoded.split(":", 2);
  if (user !== "admin" || pass !== "nenez2026") {
    throw new ApiError(401, "Credenciales invalidas.", "UNAUTHORIZED");
  }
}

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "admin-qr-scans", limit: 30, windowMs: 60_000 });
    verifyAdmin(request);

    const eventId = "trap-loud";
    const scans = getScansForEvent(eventId);

    const list = scans.map((s) => ({
      payloadHash: s.payloadHash,
      scannedAt: s.scannedAt,
      career: s.career || null,
      careerId: s.careerId || null,
      documentSuffix: s.documentSuffix || null,
    }));

    return NextResponse.json({ success: true, scans: list });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "admin-qr-delete", limit: 60, windowMs: 60_000 });
    verifyAdmin(request);

    const { payloadHash } = await readJson(request, deleteSchema);
    const eventId = "trap-loud";

    const deleted = deleteScanByHash(payloadHash, eventId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Escaneo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Escaneo eliminado" });
  } catch (error) {
    return handleApiError(error);
  }
}
