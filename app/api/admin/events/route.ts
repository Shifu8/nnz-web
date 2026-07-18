import { NextRequest, NextResponse } from "next/server";
import { loadAllEvents, createEvent } from "@/lib/admin/events-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const events = loadAllEvents();
    return NextResponse.json({ success: true, events });
  } catch {
    return NextResponse.json({ error: "Error al cargar eventos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, location, date, time, countdownDate, price, imageUrl, description, slug } = body;

    if (!title || !date || !time || !price) {
      return NextResponse.json(
        { error: "Título, fecha, hora y precio son requeridos." },
        { status: 400 }
      );
    }

    const event = createEvent({
      title,
      subtitle: subtitle || "",
      location: location || "",
      date,
      time,
      countdownDate: countdownDate || date,
      onlineSalesCutoffTime: body.onlineSalesCutoffTime || "14:00",
      price: Number(price),
      imageUrl: imageUrl || "",
      description: description || "",
      lineup: body.lineup || [],
      position: body.position !== undefined ? Number(body.position) : 0,
      slug: body.slug || "",
      status: "active",
      isFeatured: false,
      isAvailable: body.isAvailable ?? true,
      badge: body.badge || "",
      accentColor: body.accentColor || "#ffffff",
      miniImage: body.miniImage || "",
      organizer: body.organizer || "NENEZ",
      venue: body.venue || location || "",
      category: body.category || "Trap / Urban",
      ageRestriction: body.ageRestriction || "18+",
      about: body.about || [],
      detailedLineup: body.detailedLineup || [],
      schedule: body.schedule || [],
      importantInfo: body.importantInfo || [],
      socialLinks: body.socialLinks || {},
      merch: body.merch || [],
      drinks: body.drinks || [],
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err) {
    console.error("Error creating event:", err);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}
