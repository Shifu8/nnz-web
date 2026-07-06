import { NextResponse } from "next/server";
import { ApiError, assertSameOrigin, enforceRateLimit, handleApiError } from "@/lib/security";
import { getScansForEvent } from "@/lib/staff/studentScanStore";
import { ensureStore, readJsonFile } from "@/lib/db/passStore";

export const runtime = "nodejs";

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
    enforceRateLimit(request, { namespace: "admin-qr-stats", limit: 30, windowMs: 60_000 });
    verifyAdmin(request);

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId") || "trap-loud";
    const scans = getScansForEvent(eventId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scannedToday = scans.filter((s) => new Date(s.scannedAt) >= today).length;

    const perCareer: Record<string, number> = {};
    for (const scan of scans) {
      const key = scan.career || "SIN CARRERA";
      perCareer[key] = (perCareer[key] || 0) + 1;
    }

    let entradasUsadas = 0;
    try {
      const store = ensureStore();
      if (store.kind === "postgres") {
        const [row] = await store.db`
          SELECT COUNT(*) as count FROM party_passes
          WHERE event_id = ${eventId} AND used = true
        `;
        entradasUsadas = Number(row?.count || 0);
      } else if (store.kind === "local-json") {
        const partyPasses = readJsonFile<any>("party_passes");
        entradasUsadas = partyPasses.filter(
          (p: any) => (p.eventId === eventId || p.event_id === eventId) && p.used
        ).length;
      }
    } catch {
      // DB not configured — entradasUsadas stays 0
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalEscaneos: scans.length,
        escaneadosHoy: scannedToday,
        entradasUsadas,
        porCarrera: perCareer,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
