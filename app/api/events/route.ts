import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadAllEvents, saveAllEvents } from "@/lib/admin/events-store";
import { events as fallbackEvents } from "@/frontend/services/nenezData";
import type { Event } from "@/frontend/types/domain";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eventPublicationSchema } from "@/lib/events/publication";
import { ApiError, assertSameOrigin, enforceRateLimit, readJson } from "@/lib/security";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DEC"];

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "18 SEP 2026";
  try {
    if (dateStr.includes(" ") && (dateStr.includes("SEP") || dateStr.includes("OCT") || dateStr.includes("AGO") || dateStr.includes("JUL") || dateStr.includes("NOV") || dateStr.includes("DEC") || dateStr.includes("ENE") || dateStr.includes("FEB") || dateStr.includes("MAR") || dateStr.includes("ABR") || dateStr.includes("MAY") || dateStr.includes("JUN"))) {
      return dateStr;
    }
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T12:00:00Z");
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = MONTHS[d.getUTCMonth()] || "SEP";
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr || "18 SEP 2026";
  }
}

type EventWithPosition = Event & { position: number };

function toFrontendEvent(adminEvent: any): EventWithPosition {
  const id = adminEvent.slug || adminEvent.id;
  return {
    id,
    title: adminEvent.title,
    subtitle: adminEvent.subtitle || "",
    city: adminEvent.city || adminEvent.location || "Loja",
    date: adminEvent.date,
    address: adminEvent.address || "",
    dateLabel: formatDateLabel(adminEvent.date || adminEvent.dateLabel || ""),
    startsAt: adminEvent.date && adminEvent.time
      ? `${adminEvent.date}T${adminEvent.time}:00-05:00`
      : adminEvent.startsAt || "",
    poster: adminEvent.imageUrl || adminEvent.poster || "/images/4go_red_girl_showcase.jpg",
    lineup: adminEvent.lineup || [],
    description: adminEvent.description || "",
    position: adminEvent.position ?? 999,

    // Extended editorial fields
    organizer: adminEvent.organizer || "4GO",
    organizers: adminEvent.organizers || [],
    venue: adminEvent.venue || `${adminEvent.location || "Cubic Loja"}`,
    time: adminEvent.time || "22:00",
    category: adminEvent.category || "Electronic / House",
    ageRestriction: adminEvent.ageRestriction || "18+",
    status: adminEvent.status === "active"
      ? (adminEvent.isAvailable !== false ? "available" : "coming-soon")
      : "coming-soon",
    about: adminEvent.about || [],
    detailedLineup: adminEvent.detailedLineup || [],
    schedule: adminEvent.schedule || [],
    importantInfo: adminEvent.importantInfo || [],
    socialLinks: adminEvent.socialLinks || {},
    merch: adminEvent.merch || [],
    drinks: adminEvent.drinks || [],
    presales: adminEvent.presales || [],

    // Carousel specific fields
    badge: adminEvent.badge || "NUEVO",
    accentColor: adminEvent.accentColor || "#ffffff",
    miniImage: adminEvent.miniImage || adminEvent.imageUrl || adminEvent.poster || "/images/4go_red_girl_showcase.jpg",
    featuredImage: adminEvent.imageUrl || adminEvent.poster || "/images/4go_red_girl_showcase.jpg",
    price: Number.isFinite(Number(adminEvent.price)) ? Number(adminEvent.price) : 10,
    currency: adminEvent.currency || "USD",
    onlineSalesCutoffTime: adminEvent.onlineSalesCutoffTime || "14:00",
  } as any;
}

function toFrontendEventFromFallback(fe: Event, index: number): EventWithPosition {
  return { ...fe, position: 999 + index + 1 };
}

async function saveBase64Image(dataUri: string, filenameBase: string): Promise<string> {
  if (!dataUri || !dataUri.startsWith("data:image/")) return dataUri;
  try {
    const matches = dataUri.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!matches) throw new Error("Formato de imagen no válido.");
    const buffer = Buffer.from(matches[2], "base64");
    const image = await sharp(buffer, { limitInputPixels: 25_000_000 }).rotate().resize({ width: 2000, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    const outDir = path.join(process.cwd(), "public", "images", "events");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filename = `${filenameBase}.webp`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image);
    return `/images/events/${filename}`;
  } catch (err) {
    console.error("Error saving event poster:", err);
    throw new ApiError(400, "No se pudo guardar el afiche. Usa una imagen JPG, PNG o WebP válida.", "INVALID_POSTER");
  }
}

export async function GET() {
  try {
    const adminEvents = loadAllEvents();
    const existingSlugs = new Set(adminEvents.map((e) => e.slug || e.id));

    const activeAdmin = adminEvents
      .filter((e) => e.status === "active")
      .map(toFrontendEvent);

    const fallbacksNotSaved = fallbackEvents
      .filter((fe) => !existingSlugs.has(fe.id))
      .map((fe, i) => toFrontendEventFromFallback(fe, i));

    const merged = [...activeAdmin, ...fallbacksNotSaved];
    merged.sort((a, b) => a.position - b.position);

    return NextResponse.json({ success: true, events: merged });
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json({ success: false, events: fallbackEvents }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    enforceRateLimit(req, { namespace: "event-publication", limit: 10, windowMs: 60 * 60_000 });
    const body = await readJson(req, eventPublicationSchema, 16 * 1024 * 1024);
    const adminEvents = loadAllEvents();

    const slug = (body.title || "evento")
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${randomUUID().slice(0, 8)}`;

    let posterUrl = body.poster || body.imageUrl || "/images/4go_red_girl_showcase.jpg";
    if (typeof posterUrl === "string" && posterUrl.startsWith("data:image/")) {
      posterUrl = await saveBase64Image(posterUrl, slug);
    }

    const newEvent: any = {
      id: slug,
      slug: slug,
      title: body.title || "Nuevo Evento",
      subtitle: body.subtitle,
      location: body.city,
      date: body.date,
      dateLabel: formatDateLabel(body.date),
      time: body.time,
      price: body.price,
      imageUrl: posterUrl,
      poster: posterUrl,
      miniImage: posterUrl,
      description: body.description || "Evento oficial con acceso asegurado.",
      lineup: body.lineup,
      organizer: body.organizer,
      organizers: body.organizers,
      address: body.address,
      importantInfo: body.importantInfo,
      venue: body.venue,
      category: body.category,
      ageRestriction: body.ageRestriction,
      presales: Array.isArray(body.presales) ? body.presales : [],
      status: "active",
      isFeatured: true,
      isAvailable: true,
      position: 0,
      badge: "NUEVO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Increase position for all other events
    adminEvents.forEach((ev) => {
      if (typeof ev.position === "number") ev.position += 1;
    });

    adminEvents.unshift(newEvent);
    saveAllEvents(adminEvents);

    return NextResponse.json({ success: true, event: toFrontendEvent(newEvent) });
  } catch (err: any) {
    console.error("POST /api/events error:", err);
    if (err instanceof ApiError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    return NextResponse.json({ error: "No se pudo guardar tu evento. Inténtalo de nuevo." }, { status: 500 });
  }
}
