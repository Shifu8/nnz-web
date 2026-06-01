import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent, createEvent, loadAllEvents, setEventPosition } from "@/lib/admin/events-store";
import { events as frontendEvents } from "@/frontend/services/dawgsData";

const MONTHS: Record<string, string> = {
  ENE: "01", FEB: "02", MAR: "03", ABR: "04", MAY: "05", JUN: "06",
  JUL: "07", AGO: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

function parseFrontendDate(fe: any): { date: string; time: string } {
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
  return { date, time };
}

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, event });
  } catch {
    return NextResponse.json({ error: "Error al cargar evento" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    let existing = getEventById(id);

    // If event doesn't exist by id, look up by slug
    if (!existing && body.slug) {
      const all = loadAllEvents();
      existing = all.find((e) => e.slug === body.slug) || null;
    }

    // If event doesn't exist in admin store, look up frontend fallback data by slug
    const lookupSlug = body.slug || id;
    if (!existing && lookupSlug) {
      const fe = frontendEvents.find((e) => e.id === lookupSlug);
      if (fe) {
        const { date, time } = parseFrontendDate(fe);
        const fullEvent = {
          title: fe.title,
          subtitle: fe.subtitle || "",
          slug: lookupSlug,
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
          position: body.position !== undefined ? Number(body.position) : 0,
        };
        const created = createEvent(fullEvent);
        if (body.position !== undefined) {
          setEventPosition(created.id, Number(body.position));
        }
        const reloaded = loadAllEvents();
        const updated = reloaded.find((e) => e.id === created.id);
        return NextResponse.json({ success: true, event: updated });
      }
    }

    if (existing) {
      const positionChanged = body.position !== undefined && Number(body.position) !== (existing.position ?? 0);
      // Save all fields except position (setEventPosition handles that)
      const updateFields: any = {
        title: body.title ?? existing.title,
        subtitle: body.subtitle ?? existing.subtitle,
        location: body.location ?? existing.location,
        date: body.date ?? existing.date,
        time: body.time ?? existing.time,
        countdownDate: body.countdownDate ?? existing.countdownDate,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        imageUrl: body.imageUrl ?? existing.imageUrl,
        description: body.description ?? existing.description,
        lineup: body.lineup ?? existing.lineup,
        status: body.status ?? existing.status,
        isFeatured: body.isFeatured ?? existing.isFeatured,
        slug: body.slug ?? existing.slug,
      };
      if (!positionChanged && body.position !== undefined) {
        updateFields.position = Number(body.position);
      }
      updateEvent(existing.id, updateFields);
      if (positionChanged) {
        setEventPosition(existing.id, Number(body.position));
      }
      const reloaded = loadAllEvents();
      const updated = reloaded.find((e) => e.id === existing.id);
      return NextResponse.json({ success: true, event: updated });
    }

    // Event doesn't exist — create it
    const created = createEvent(body);

    return NextResponse.json({ success: true, event: created });
  } catch (err) {
    console.error("Error updating event:", err);
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteEvent(id);
    if (!deleted) {
      // Try as slug
      const bySlug = loadAllEvents().find((e) => e.slug === id);
      if (bySlug) {
        deleteEvent(bySlug.id);
        return NextResponse.json({ success: true, message: "Evento eliminado" });
      }
      // Fallback event never imported — silently succeed
      return NextResponse.json({ success: true, message: "Evento eliminado" });
    }
    return NextResponse.json({ success: true, message: "Evento eliminado" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 });
  }
}
