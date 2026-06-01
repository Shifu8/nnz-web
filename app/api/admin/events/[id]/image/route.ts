import { NextRequest, NextResponse } from "next/server";
import { updateEvent } from "@/lib/admin/events-store";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió ninguna imagen" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return NextResponse.json({ error: "Formato no válido. Usa JPG, PNG o WebP." }, { status: 400 });
    }

    const fileName = `event-${uuidv4()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "events");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/uploads/events/${fileName}`;
    const updated = updateEvent(id, { imageUrl });

    if (!updated) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    console.error("Error uploading event image:", err);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
