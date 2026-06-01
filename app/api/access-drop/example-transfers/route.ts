import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EXAMPLES_DIR = path.join(process.cwd(), "public", "uploads", "example-transfers");

export async function POST(request: NextRequest) {
  try {
    if (!fs.existsSync(EXAMPLES_DIR)) {
      fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ARCHIVO REQUERIDO." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".pdf"].includes(ext)) {
      return NextResponse.json({ error: "FORMATO NO SOPORTADO. JPG, PNG O PDF." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "ARCHIVO MUY GRANDE. MÁXIMO 10MB." }, { status: 400 });
    }

    const bank = (formData.get("bank") as string) || "desconocido";
    const fileName = `ejemplo-${bank}-${Date.now()}${ext}`;
    const filePath = path.join(EXAMPLES_DIR, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    console.log(`[EXAMPLE TRANSFER] Saved: ${fileName} (${(buffer.length / 1024).toFixed(1)}KB, banco: ${bank})`);

    return NextResponse.json({
      success: true,
      fileName,
      bank,
      message: "EJEMPLO DE TRANSFERENCIA GUARDADO.",
      url: `/uploads/example-transfers/${fileName}`,
    });
  } catch (err) {
    console.error("Error saving example transfer:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(EXAMPLES_DIR)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(EXAMPLES_DIR).map((name) => {
      const stat = fs.statSync(path.join(EXAMPLES_DIR, name));
      return {
        name,
        size: stat.size,
        url: `/uploads/example-transfers/${name}`,
        createdAt: stat.birthtime.toISOString(),
      };
    });

    return NextResponse.json({ files });
  } catch (err) {
    console.error("Error listing example transfers:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
