import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  isReceiptFileValidationError,
  validateReceiptFileBytes,
  validateReceiptFileMetadata,
} from "@/lib/access-drop/fileValidation";
import {
  assertSameOrigin,
  handleApiError,
  secureLog,
  verifyAdminRequest,
} from "@/lib/security";

export const runtime = "nodejs";

const EXAMPLES_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "example-transfers",
);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await verifyAdminRequest(request, { requireCsrf: true });

    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;

    if (!file) {
      return NextResponse.json(
        { error: "ARCHIVO REQUERIDO.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const metadataError = validateReceiptFileMetadata({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (metadataError) {
      return NextResponse.json(
        { error: metadataError.message, code: metadataError.code },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateReceiptFileBytes(
      { name: file.name, size: file.size, type: file.type },
      buffer,
    );
    if (isReceiptFileValidationError(validation)) {
      return NextResponse.json(
        { error: validation.message, code: validation.code },
        { status: 415 },
      );
    }

    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const bank = String(formData.get("bank") || "desconocido")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40) || "desconocido";
    const extension = validation.detectedMime === "image/png" ? ".png" : ".jpg";
    const fileName = `ejemplo-${bank}-${crypto.randomUUID()}${extension}`;
    fs.writeFileSync(path.join(EXAMPLES_DIR, fileName), buffer);

    secureLog("[RECEIPT_REFERENCE] Example added", {
      fileName,
      bank,
      size: buffer.length,
      mime: validation.detectedMime,
    });

    return NextResponse.json({
      success: true,
      fileName,
      bank,
      message: "EJEMPLO DE TRANSFERENCIA GUARDADO.",
      url: `/uploads/example-transfers/${fileName}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    if (!fs.existsSync(EXAMPLES_DIR)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs
      .readdirSync(EXAMPLES_DIR)
      .filter((name) => /\.(?:jpe?g|png)$/i.test(name))
      .map((name) => {
        const stat = fs.statSync(path.join(EXAMPLES_DIR, name));
        return {
          name,
          size: stat.size,
          url: `/uploads/example-transfers/${name}`,
          createdAt: stat.birthtime.toISOString(),
        };
      });

    return NextResponse.json({ files });
  } catch (error) {
    return handleApiError(error);
  }
}
