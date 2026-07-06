import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { loadAllCustomDesigns, saveAllCustomDesigns } from "@/lib/tickets/designsServer";

export const runtime = "nodejs";

function getWorkspaceRootDir(): string {
  let dir = process.cwd();
  if (path.basename(dir) === "frontend") {
    dir = path.dirname(dir);
  }
  let currentSearch = process.cwd();
  for (let i = 0; i < 3; i++) {
    if (fs.existsSync(path.join(currentSearch, "public"))) {
      dir = currentSearch;
      break;
    }
    currentSearch = path.dirname(currentSearch);
  }
  return dir;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const all = loadAllCustomDesigns();
    if (eventId) {
      const filtered = all.filter((d) => d.eventId === eventId);
      return NextResponse.json({ success: true, designs: filtered });
    }
    return NextResponse.json({ success: true, designs: all });
  } catch (err) {
    console.error("[DESIGNS_API] Error loading designs:", err);
    return NextResponse.json({ success: false, error: "Error al cargar diseños." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const eventId = formData.get("eventId") as string;
    const name = formData.get("name") as string;
    const badge = formData.get("badge") as string;
    const accentColor = formData.get("accentColor") as string;
    const file = formData.get("image") as File | null;

    if (!eventId || !name || !badge || !accentColor || !file) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save image to public/uploads/ticket-designs/
    const rootDir = getWorkspaceRootDir();
    const uploadDir = path.join(rootDir, "public", "uploads", "ticket-designs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const designId = uuidv4();
    const ext = path.extname(file.name).toLowerCase() || ".png";
    const fileName = `${designId}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const relativePhotoPath = `/uploads/ticket-designs/${fileName}`;

    // Add to database
    const all = loadAllCustomDesigns();
    all.push({
      id: designId,
      eventId,
      name,
      photo: relativePhotoPath,
      accentColor,
      shadowColor: `${accentColor}40`, // 25% opacity shadow
      badge,
    });
    saveAllCustomDesigns(all);

    return NextResponse.json({ success: true, message: "Diseño agregado con éxito." });
  } catch (err) {
    console.error("[DESIGNS_API] Error creating design:", err);
    return NextResponse.json({ success: false, error: "Error al crear diseño." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido." }, { status: 400 });
    }

    const all = loadAllCustomDesigns();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Diseño no encontrado." }, { status: 404 });
    }

    const targetDesign = all[idx];

    // Delete image file if it exists
    const rootDir = getWorkspaceRootDir();
    const absoluteImagePath = path.join(rootDir, "public", targetDesign.photo.replace(/^\//, ""));
    if (fs.existsSync(absoluteImagePath)) {
      try {
        fs.unlinkSync(absoluteImagePath);
      } catch (err) {
        console.warn(`[DESIGNS_API] Failed to delete image file: ${absoluteImagePath}`, err);
      }
    }

    all.splice(idx, 1);
    saveAllCustomDesigns(all);

    return NextResponse.json({ success: true, message: "Diseño eliminado con éxito." });
  } catch (err) {
    console.error("[DESIGNS_API] Error deleting design:", err);
    return NextResponse.json({ success: false, error: "Error al eliminar diseño." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const eventId = formData.get("eventId") as string;
    const name = formData.get("name") as string;
    const badge = formData.get("badge") as string;
    const accentColor = formData.get("accentColor") as string;
    const file = formData.get("image") as File | null;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido para editar." }, { status: 400 });
    }

    const all = loadAllCustomDesigns();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Diseño no encontrado." }, { status: 404 });
    }

    const target = all[idx];

    if (file && file.size > 0) {
      const rootDir = getWorkspaceRootDir();
      const absoluteOldImagePath = path.join(rootDir, "public", target.photo.replace(/^\//, ""));
      if (fs.existsSync(absoluteOldImagePath)) {
        try {
          fs.unlinkSync(absoluteOldImagePath);
        } catch {}
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadDir = path.join(rootDir, "public", "uploads", "ticket-designs");
      const ext = path.extname(file.name).toLowerCase() || ".png";
      const fileName = `${id}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);
      target.photo = `/uploads/ticket-designs/${fileName}`;
    }

    if (eventId) target.eventId = eventId;
    if (name) target.name = name;
    if (badge) target.badge = badge;
    if (accentColor) {
      target.accentColor = accentColor;
      target.shadowColor = `${accentColor}40`;
    }

    saveAllCustomDesigns(all);

    return NextResponse.json({ success: true, message: "Diseño actualizado con éxito." });
  } catch (err) {
    console.error("[DESIGNS_API] Error updating design:", err);
    return NextResponse.json({ success: false, error: "Error al actualizar diseño." }, { status: 500 });
  }
}
