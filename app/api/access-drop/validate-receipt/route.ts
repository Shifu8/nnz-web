import { NextRequest, NextResponse } from "next/server";
import {
  validateReceiptFileBytes,
  isReceiptFileValidationError,
  validateReceiptFileMetadata,
} from "@/lib/access-drop/fileValidation";
import { analyzeReceiptImage } from "@/lib/access-drop/receiptAnalysis";
import { MAX_FILE_SIZE } from "@/lib/access-drop/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
      return NextResponse.json({ isValid: false, rejectionReason: `EL ARCHIVO SUPERA EL MAXIMO DE ${MAX_FILE_SIZE / 1024 / 1024} MB.` }, { status: 413 });
    }

    const formData = await request.formData();
    const fileValue = formData.get("comprobante");
    const file = fileValue instanceof File ? fileValue : null;
    if (!file) {
      return NextResponse.json({ isValid: false, rejectionReason: "COMPROBANTE REQUERIDO." }, { status: 400 });
    }

    const metadataError = validateReceiptFileMetadata({ size: file.size, name: file.name, type: file.type });
    if (metadataError) {
      return NextResponse.json({ isValid: false, rejectionReason: metadataError.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileValidation = validateReceiptFileBytes({ size: file.size, name: file.name, type: file.type }, buffer);
    if (isReceiptFileValidationError(fileValidation)) {
      return NextResponse.json({ isValid: false, rejectionReason: fileValidation.message }, { status: 415 });
    }

    const analysis = await analyzeReceiptImage(buffer, fileValidation.detectedMime);

    if (!analysis.isValidReceipt || analysis.rejectionReason) {
      return NextResponse.json({ isValid: false, rejectionReason: analysis.rejectionReason || "LA IMAGEN NO PARECE UN COMPROBANTE DE PAGO VALIDO." }, { status: 422 });
    }

    return NextResponse.json({ isValid: true, rejectionReason: null });
  } catch (error) {
    console.error("[VALIDATE_RECEIPT] Error:", error);
    return NextResponse.json({ isValid: false, rejectionReason: "ERROR AL VALIDAR LA IMAGEN." }, { status: 500 });
  }
}
