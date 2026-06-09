import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  validateFile,
  validatePhone,
  validateEmail,
  validateName,
  validateQuantity,
  sanitizeString,
} from "@/lib/access-drop/validation";
import { addReceipt, getBankList } from "@/lib/access-drop/receiptStore";
import { saveFile } from "@/lib/access-drop/storage";
import { processReceiptImage } from "@/lib/access-drop/ocr";
import type { PaymentMethod, ReceiptRecord } from "@/lib/access-drop/types";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { ApiError } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("comprobante") as File | null;
    const firstName = (formData.get("firstName") as string) || "";
    const lastName = (formData.get("lastName") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const quantityRaw = (formData.get("quantity") as string) || "1";
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || "banco-loja";
    const turnstileToken = (formData.get("cf-turnstile-response") as string) || "";

    await verifyTurnstileToken(request, turnstileToken, {
      variant: "visible",
      action: "ticket_upload",
    });

    const quantity = parseInt(quantityRaw, 10);

    const errors: { field: string; message: string }[] = [];

    const nameErr = validateName(firstName);
    if (nameErr) errors.push(nameErr);

    const lastNameErr = validateName(lastName);
    if (lastNameErr) errors.push({ ...lastNameErr, field: "lastName" });

    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.push(phoneErr);

    const emailErr = validateEmail(email);
    if (emailErr) errors.push(emailErr);

    const qtyErr = validateQuantity(quantity);
    if (qtyErr) errors.push(qtyErr);

    if (!file) {
      errors.push({ field: "comprobante", message: "COMPROBANTE REQUERIDO." });
    } else {
      const fileErr = validateFile({ size: file.size, name: file.name, type: file.type });
      if (fileErr) errors.push(fileErr);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.map((e) => e.message).join(" ") }, { status: 400 });
    }

    const buffer = Buffer.from(await file!.arrayBuffer());

    const { filePath } = saveFile(buffer, file!.name);

    let ocrResult;
    try {
      ocrResult = await processReceiptImage(buffer, file!.name);
    } catch (ocrErr) {
      console.error("OCR processing failed:", ocrErr);
      ocrResult = {
        extractedText: "ERROR AL PROCESAR OCR.",
        confidence: 0,
        isSuspicious: true,
        suspiciousReason: "OCR FALLÓ.",
        rejectionReason: "NO SE PUDO PROCESAR OCR.",
      };
    }

    const record: ReceiptRecord = {
      id: uuidv4(),
      firstName: sanitizeString(firstName.toUpperCase()),
      lastName: sanitizeString(lastName.toUpperCase()),
      phone: phone.replace(/\D/g, ""),
      email: sanitizeString(email),
      documentNumber: "",
      quantity,
      paymentMethod,
      referenceNumber: "",
      filePath,
      originalFileName: file!.name,
      fileSize: file!.size,
      mimeType: file!.type,
      status: "pendiente",
      ocrResult,
      createdAt: new Date().toISOString(),
    };

    addReceipt(record);

    const autoRejected = ocrResult?.rejectionReason;

    return NextResponse.json({
      success: true,
      receiptId: record.id,
      status: autoRejected ? "rechazado" : "pendiente",
      autoRejected: !!autoRejected,
      rejectionReason: autoRejected || null,
      message: autoRejected
        ? "COMPROBANTE RECHAZADO AUTOMÁTICAMENTE. USA UNA IMAGEN CLARA DEL COMPROBANTE."
        : "COMPROBANTE RECIBIDO. PENDIENTE DE REVISIÓN.",
    });
  } catch (err) {
    console.error("Upload error:", err);
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: "ERROR INTERNO AL PROCESAR LA SOLICITUD." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const banks = getBankList();
    return NextResponse.json({ banks });
  } catch (err) {
    console.error("Error fetching bank info:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
