import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { existsSync } from "fs";

function isAuthorized(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = Buffer.from("admin:dawgs2026").toString("base64");
  return auth === `Bearer ${expected}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file" }, { status: 400 });
    }

    const ext = path.extname(file.name) || ".jpg";
    const fileName = `cover-${uuid()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "covers");

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(dir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/covers/${fileName}`;
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
