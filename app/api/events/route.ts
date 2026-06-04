import { NextResponse } from "next/server";
import { loadAllEvents } from "@/lib/admin/events-store";
import { events as fallbackEvents } from "@/frontend/services/dawgsData";
import type { Event } from "@/frontend/types/domain";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DEC"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

type EventWithPosition = Event & { position: number };

function toFrontendEvent(adminEvent: any): EventWithPosition {
  const id = adminEvent.slug || adminEvent.id;
  return {
    id,
    title: adminEvent.title,
    subtitle: adminEvent.subtitle || "",
    city: adminEvent.location || "",
    dateLabel: formatDateLabel(adminEvent.date || adminEvent.dateLabel || ""),
    startsAt: adminEvent.date && adminEvent.time
      ? `${adminEvent.date}T${adminEvent.time}:00-05:00`
      : adminEvent.startsAt || "",
    poster: adminEvent.imageUrl || adminEvent.poster || "",
    lineup: adminEvent.lineup || [],
    description: adminEvent.description || "",
    position: adminEvent.position ?? 999,
  };
}

function toFrontendEventFromFallback(fe: Event, index: number): EventWithPosition {
  return { ...fe, position: 999 + index + 1 };
}

export async function GET() {
  try {
    const adminEvents = loadAllEvents();
    const existingSlugs = new Set(adminEvents.map((e) => e.slug || e.id));

    let merged: EventWithPosition[];

    if (adminEvents.length === 0) {
      merged = fallbackEvents.map((fe, i) => toFrontendEventFromFallback(fe, i));
    } else {
      // Admin events with their position
      const fromAdmin = adminEvents
        .filter((e) => e.status === "active")
        .map(toFrontendEvent);
      // Fallback events whose slug isn't in admin yet
      const fromFallback = fallbackEvents
        .filter((fe) => !existingSlugs.has(fe.id))
        .map((fe, i) => toFrontendEventFromFallback(fe, i));
      merged = [...fromAdmin, ...fromFallback];
    }

    merged.sort((a, b) => a.position - b.position);

    return NextResponse.json({ success: true, events: merged });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
