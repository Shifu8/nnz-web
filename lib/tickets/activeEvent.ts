import "server-only";

import { loadAllEvents } from "@/lib/admin/events-store";
import type { AdminEvent } from "@/lib/admin/types";

export type ActiveTicketEvent = {
  id: string;
  sourceId: string;
  slug?: string;
  title: string;
  eventName: string;
  artist: string;
  date: string;
  dateLabel: string;
  venue: string;
  time: string;
  imageUrl: string;
  aliases: string[];
};

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${String(parsed.getUTCDate()).padStart(2, "0")} ${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

function toActiveEvent(event: AdminEvent): ActiveTicketEvent {
  const publicId = event.slug || event.id;
  const configuredArtist = process.env.CURRENT_EVENT_ARTIST?.trim();
  const lineup = event.lineup.filter((artist) => artist.trim() && artist.toLowerCase() !== "y mas");

  return {
    id: publicId,
    sourceId: event.id,
    slug: event.slug,
    title: event.title,
    eventName: event.subtitle || event.title,
    artist: configuredArtist || lineup.join(" / ") || event.subtitle || event.title,
    date: event.date,
    dateLabel: formatDateLabel(event.date),
    venue: event.location,
    time: event.time,
    imageUrl: event.imageUrl,
    aliases: Array.from(new Set([publicId, event.id, event.slug].filter(Boolean) as string[])),
  };
}

function selectConfiguredEvent(events: AdminEvent[], eventId: string): AdminEvent | undefined {
  return events.find((event) => event.id === eventId || event.slug === eventId);
}

export function getActiveTicketEvent(): ActiveTicketEvent {
  const events = loadAllEvents();
  const configuredId = process.env.CURRENT_EVENT_ID?.trim() || "trap-loud";
  const configured = selectConfiguredEvent(events, configuredId);

  if (configured) return toActiveEvent(configured);

  const fallback = events
    .filter((event) => event.status === "active")
    .sort((left, right) => (left.position ?? 999) - (right.position ?? 999))[0];

  if (fallback) return toActiveEvent(fallback);

  return {
    id: configuredId,
    sourceId: configuredId,
    slug: configuredId,
    title: process.env.CURRENT_EVENT_TITLE?.trim() || "TRAP LOUD",
    eventName: process.env.CURRENT_EVENT_NAME?.trim() || "YAN BLOCK EXPERIENCE",
    artist: process.env.CURRENT_EVENT_ARTIST?.trim() || "YAN BLOCK / ROA / OMAR COURTZ",
    date: process.env.CURRENT_EVENT_DATE?.trim() || "2026-06-18",
    dateLabel: formatDateLabel(process.env.CURRENT_EVENT_DATE?.trim() || "2026-06-18"),
    venue: process.env.CURRENT_EVENT_VENUE?.trim() || "San Juan",
    time: process.env.CURRENT_EVENT_TIME?.trim() || "21:00",
    imageUrl: "",
    aliases: [configuredId],
  };
}

export function eventMatchesActiveEvent(eventId: string | undefined, event: ActiveTicketEvent): boolean {
  return Boolean(eventId && event.aliases.includes(eventId));
}
