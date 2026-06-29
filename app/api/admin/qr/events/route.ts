import { NextResponse } from "next/server";
import { ApiError, assertSameOrigin, enforceRateLimit, handleApiError } from "@/lib/security";
import { loadAllEvents } from "@/lib/admin/events-store";
import { getScansForEvent } from "@/lib/staff/studentScanStore";
import { events as frontendEvents } from "@/frontend/services/nenezData";

export const runtime = "nodejs";

const MONTHS: Record<string, string> = {
  ENE: "01", FEB: "02", MAR: "03", ABR: "04", MAY: "05", JUN: "06",
  JUL: "07", AGO: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

function fromFrontendEvent(fe: any): any {
  let date = "";
  let time = "";
  if (fe.startsAt) {
    const d = new Date(fe.startsAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    date = `${y}-${m}-${day}`;
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    time = `${hh}:${mm}`;
  } else if (fe.dateLabel) {
    const parts = fe.dateLabel.split(" ");
    if (parts.length === 3) {
      const day = parts[0];
      const month = MONTHS[parts[1]] || "01";
      const year = parts[2];
      date = `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }
  return {
    id: fe.id,
    title: fe.title,
    subtitle: fe.subtitle || "",
    location: fe.city || "",
    date,
    time,
    countdownDate: "",
    price: 10,
    imageUrl: fe.poster || "",
    description: fe.description || "",
    lineup: fe.lineup || [],
    status: "active" as const,
    isFeatured: false,
    slug: fe.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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
    enforceRateLimit(request, { namespace: "admin-qr-events", limit: 30, windowMs: 60_000 });
    verifyAdmin(request);

    const adminEvents = loadAllEvents();

    const existingSlugs = new Set(adminEvents.map((e) => e.slug || e.id));

    const scanMap: Record<string, number> = {};
    const careerMap: Record<string, Record<string, number>> = {};
    const allIds = [...existingSlugs, ...frontendEvents.map((e) => e.id)];
    for (const eventId of allIds) {
      if (scanMap[eventId] !== undefined) continue;
      const scans = getScansForEvent(eventId);
      scanMap[eventId] = scans.length;
      const perCareer: Record<string, number> = {};
      for (const scan of scans) {
        const key = scan.career || "SIN CARRERA";
        perCareer[key] = (perCareer[key] || 0) + 1;
      }
      careerMap[eventId] = perCareer;
    }

    // Admin events first, then frontend events whose slug isn't already in admin
    const result: any[] = [
      ...adminEvents.map((event) => {
        const key = event.slug || event.id;
        return {
          ...event,
          totalScans: scanMap[key] || 0,
          scansPerCareer: careerMap[key] || {},
        };
      }),
      ...frontendEvents
        .filter((fe) => !existingSlugs.has(fe.id))
        .map((fe) => ({
          ...fromFrontendEvent(fe),
          totalScans: scanMap[fe.id] || 0,
          scansPerCareer: careerMap[fe.id] || {},
        })),
    ];

    return NextResponse.json({ success: true, events: result });
  } catch (error) {
    return handleApiError(error);
  }
}
