import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AdminEvent } from "./types";

const EVENTS_METADATA_PATH = "data/events.json";

function getMetadataFile(): string {
  return path.join(process.cwd(), EVENTS_METADATA_PATH);
}

export function ensureEventsDir(): void {
  const dir = path.dirname(getMetadataFile());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadAllEvents(): AdminEvent[] {
  const metaFile = getMetadataFile();
  if (!fs.existsSync(metaFile)) return [];
  try {
    const raw = fs.readFileSync(metaFile, "utf-8");
    return JSON.parse(raw) as AdminEvent[];
  } catch {
    return [];
  }
}

export function saveAllEvents(events: AdminEvent[]): void {
  const metaFile = getMetadataFile();
  ensureEventsDir();
  fs.writeFileSync(metaFile, JSON.stringify(events, null, 2), "utf-8");
}

export function getEventById(id: string): AdminEvent | null {
  const events = loadAllEvents();
  return events.find((e) => e.id === id) || null;
}

export function createEvent(data: Omit<AdminEvent, "id" | "createdAt" | "updatedAt">): AdminEvent {
  const events = loadAllEvents();
  const now = new Date().toISOString();
  const maxPos = events.reduce((m, e) => Math.max(m, e.position ?? 0), -1);
  const event: AdminEvent = {
    ...data,
    position: data.position ?? maxPos + 1,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  events.push(event);
  saveAllEvents(events);
  return event;
}

export function setEventPosition(id: string, newPosition: number): boolean {
  const all = loadAllEvents();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return false;

  // Remove the event, re-index all events sequentially
  const [moved] = all.splice(idx, 1);
  const events = all.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Clamp newPosition
  newPosition = Math.max(0, Math.min(newPosition, events.length));

  // Insert at the target position
  events.splice(newPosition, 0, moved);

  // Re-assign sequential positions
  events.forEach((e, i) => { e.position = i; e.updatedAt = new Date().toISOString(); });

  saveAllEvents(events);
  return true;
}

export function updateEvent(id: string, data: Partial<Omit<AdminEvent, "id" | "createdAt">>): AdminEvent | null {
  const events = loadAllEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...data, updatedAt: new Date().toISOString() };
  saveAllEvents(events);
  return events[idx];
}

export function deleteEvent(id: string): boolean {
  const events = loadAllEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  events.splice(idx, 1);
  saveAllEvents(events);
  return true;
}
