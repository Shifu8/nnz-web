import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  handleApiError,
  readJson,
} from "@/lib/security";
import { ensureStore, readJsonFile, writeJsonFile } from "@/lib/db/passStore";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const clearSchema = z.object({
  scope: z.enum(["entry", "carnet", "all"]),
  eventId: z.string().optional(),
});

const SCANS_PATH = path.join(process.cwd(), "data", "utpl-student-scans.json");

function verifyAdmin(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) throw new ApiError(401, "No autorizado.", "UNAUTHORIZED");
  const decoded = Buffer.from(auth.replace("Bearer ", ""), "base64").toString("utf-8");
  const [user, pass] = decoded.split(":", 2);
  if (user !== "admin" || pass !== "nenez2026") {
    throw new ApiError(401, "Credenciales invalidas.", "UNAUTHORIZED");
  }
}

async function clearEntryPasses(eventId: string): Promise<number> {
  const store = ensureStore();
  let count = 0;

  if (store.kind === "postgres") {
    try {
      const updated = await store.db`
        UPDATE party_passes
        SET used = false,
            scanned_at = null,
            scanned_by = null,
            scan_ip_hash = null,
            scan_user_agent_hash = null
        WHERE event_id = ${eventId} AND used = true
        RETURNING serial_number
      `;
      count = updated.length;
    } catch (error) {
      throw new ApiError(500, "Error al reiniciar pases en base de datos.", "DB_ERROR");
    }
  } else if (store.kind === "local-json") {
    const partyPasses = readJsonFile<any>("party_passes");
    partyPasses.forEach((p: any) => {
      if ((p.eventId === eventId || p.event_id === eventId) && p.used) {
        p.used = false;
        p.scannedAt = null;
        p.scanned_at = null;
        p.scannedBy = null;
        p.scanned_by = null;
        p.scanIpHash = null;
        p.scan_ip_hash = null;
        p.scanUserAgentHash = null;
        p.scan_user_agent_hash = null;
        count++;
      }
    });
    if (count > 0) {
      writeJsonFile("party_passes", partyPasses);
    }
  }

  return count;
}

function clearCarnetScans(eventId: string): number {
  if (!fs.existsSync(SCANS_PATH)) return 0;

  const scans = JSON.parse(fs.readFileSync(SCANS_PATH, "utf-8"));
  const filtered = scans.filter((s: { eventId?: string }) => s.eventId !== eventId);
  const removed = scans.length - filtered.length;
  fs.writeFileSync(SCANS_PATH, JSON.stringify(filtered, null, 2), "utf-8");
  return removed;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "admin-qr-clear", limit: 10, windowMs: 60_000 });
    verifyAdmin(request);

    const { scope, eventId: bodyEventId } = await readJson(request, clearSchema);
    const eventId = bodyEventId || "trap-loud";

    let entryCleared = 0;
    let carnetCleared = 0;

    if (scope === "entry" || scope === "all") {
      entryCleared = await clearEntryPasses(eventId);
    }

    if (scope === "carnet" || scope === "all") {
      carnetCleared = clearCarnetScans(eventId);
    }

    return NextResponse.json({
      success: true,
      message: `Pases de entrada reiniciados: ${entryCleared}, carnets limpiados: ${carnetCleared}`,
      entryCleared,
      carnetCleared,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
