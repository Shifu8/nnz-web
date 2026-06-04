import { NextResponse } from "next/server";
import { ApiError, assertSameOrigin, enforceRateLimit, handleApiError } from "@/lib/security";
import { getScansForEvent } from "@/lib/staff/studentScanStore";

export const runtime = "nodejs";

function verifyAdmin(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) throw new ApiError(401, "No autorizado.", "UNAUTHORIZED");
  const decoded = Buffer.from(auth.replace("Bearer ", ""), "base64").toString("utf-8");
  const [user, pass] = decoded.split(":", 2);
  if (user !== "admin" || pass !== "dawgs2026") {
    throw new ApiError(401, "Credenciales invalidas.", "UNAUTHORIZED");
  }
}

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "admin-qr-export", limit: 10, windowMs: 60_000 });
    verifyAdmin(request);

    const eventId = "trap-loud";
    const scans = getScansForEvent(eventId);

    const headers = ["Fecha", "Carrera", "Documento (ultimos 4)", "Hash"];
    const rows = scans.map((s) => [
      s.scannedAt,
      s.career || "",
      s.documentSuffix || "",
      s.payloadHash,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="carnets-trap-loud-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
