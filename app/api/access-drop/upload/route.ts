import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  validatePhone,
  validateEmail,
  validateName,
  validateQuantity,
  sanitizeString,
} from "@/lib/access-drop/validation";
import {
  isReceiptFileValidationError,
  validateReceiptFileBytes,
  validateReceiptFileMetadata,
} from "@/lib/access-drop/fileValidation";
import { addReceipt, getBankList } from "@/lib/access-drop/receiptStore";
import { deleteFile, saveFile } from "@/lib/access-drop/storage";
import { analyzeReceiptImage } from "@/lib/access-drop/receiptAnalysis";
import {
  MAX_FILE_SIZE,
  type PaymentMethod,
  type ReceiptRecord,
} from "@/lib/access-drop/types";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  secureLog,
} from "@/lib/security";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MULTIPART_SIZE = MAX_FILE_SIZE + 1024 * 1024;
const PAYMENT_METHODS: PaymentMethod[] = [
  "banco-loja",
  "banco-pichincha",
  "otros",
];

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      namespace: "receipt-upload",
      limit: 6,
      windowMs: 10 * 60_000,
    });

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_MULTIPART_SIZE) {
      return NextResponse.json(
        {
          error: `EL ARCHIVO SUPERA EL MAXIMO DE ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
          code: "PAYLOAD_TOO_LARGE",
        },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("comprobante");
    const file = fileValue instanceof File ? fileValue : null;
    const firstName = String(formData.get("firstName") || "");
    const lastName = String(formData.get("lastName") || "");
    const phone = String(formData.get("phone") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const quantityRaw = String(formData.get("quantity") || "1");
    const paymentMethodValue = String(formData.get("paymentMethod") || "banco-loja");
    const turnstileToken = String(formData.get("cf-turnstile-response") || "");
    const ticketDesign = String(formData.get("ticketDesign") || "0");

    await verifyTurnstileToken(request, turnstileToken, {
      variant: "visible",
      action: "ticket_upload",
    });

    const quantity = parseInt(quantityRaw, 10);
    const paymentMethod = PAYMENT_METHODS.includes(
      paymentMethodValue as PaymentMethod,
    )
      ? (paymentMethodValue as PaymentMethod)
      : "otros";
    const errors: { field: string; message: string }[] = [];

    const nameError = validateName(firstName);
    if (nameError) errors.push(nameError);

    const lastNameError = validateName(lastName);
    if (lastNameError) errors.push({ ...lastNameError, field: "lastName" });

    const phoneError = validatePhone(phone);
    if (phoneError) errors.push(phoneError);

    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);

    const quantityError = validateQuantity(quantity);
    if (quantityError) errors.push(quantityError);

    if (!file) {
      errors.push({
        field: "comprobante",
        message: "COMPROBANTE REQUERIDO.",
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: errors.map((error) => error.message).join(" "),
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const metadataError = validateReceiptFileMetadata({
      size: file!.size,
      name: file!.name,
      type: file!.type,
    });
    if (metadataError) {
      secureLog("[RECEIPT_UPLOAD] File metadata rejected", {
        reason: metadataError.code,
        declaredMime: file!.type,
        size: file!.size,
      });
      return NextResponse.json(
        { error: metadataError.message, code: metadataError.code },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file!.arrayBuffer());
    const fileValidation = validateReceiptFileBytes(
      { size: file!.size, name: file!.name, type: file!.type },
      buffer,
    );

    if (isReceiptFileValidationError(fileValidation)) {
      secureLog("[RECEIPT_UPLOAD] File rejected", {
        reason: fileValidation.code,
        declaredMime: file!.type,
        size: file!.size,
      });
      return NextResponse.json(
        {
          error: fileValidation.message,
          code: fileValidation.code,
        },
        { status: 415 },
      );
    }

    const analysis = await analyzeReceiptImage(
      buffer,
      fileValidation.detectedMime,
      paymentMethod,
    );

    if (!analysis.isValidReceipt || analysis.rejectionReason) {
      secureLog("[RECEIPT_UPLOAD] Receipt image rejected", {
        reason: analysis.rejectionReason || "not-a-receipt",
        classification: analysis.classification,
        confidence: analysis.aiConfidence,
        validationProvider: analysis.validationProvider,
        matchedProfile: analysis.matchedProfile,
        imageQuality: analysis.imageQuality,
        prohibitedContent: analysis.prohibitedContent,
        financialKeywords: analysis.financialKeywords,
        detectedMime: fileValidation.detectedMime,
        size: file!.size,
      });
      return NextResponse.json(
        {
          error:
            analysis.rejectionReason ||
            "LA IMAGEN NO PARECE UN COMPROBANTE DE PAGO VALIDO.",
          code: "RECEIPT_REJECTED",
        },
        { status: 422 },
      );
    }

    const { filePath } = saveFile(buffer, file!.name);
    const record: ReceiptRecord = {
      id: uuidv4(),
      eventId: getActiveTicketEvent().id,
      firstName: sanitizeString(firstName.toUpperCase()),
      lastName: sanitizeString(lastName.toUpperCase()),
      phone: phone.replace(/\D/g, ""),
      email: sanitizeString(email),
      documentNumber: "",
      quantity,
      paymentMethod,
      referenceNumber: analysis.detectedReference || "",
      filePath,
      originalFileName: file!.name,
      fileSize: file!.size,
      mimeType: fileValidation.detectedMime,
      status: "pendiente",
      ocrResult: analysis,
      createdAt: new Date().toISOString(),
      ticketDesign,
    };

    try {
      addReceipt(record);
    } catch (error) {
      deleteFile(filePath);
      throw error;
    }

    secureLog("[RECEIPT_UPLOAD] Receipt accepted", {
      receiptId: record.id,
      classification: analysis.classification,
      confidence: analysis.aiConfidence,
      validationProvider: analysis.validationProvider,
      matchedProfile: analysis.matchedProfile,
      imageQuality: analysis.imageQuality,
      detectedBank: analysis.detectedBank,
      financialKeywords: analysis.financialKeywords,
    });

    return NextResponse.json({
      success: true,
      receiptId: record.id,
      status: record.status,
      autoRejected: false,
      rejectionReason: null,
      message:
        "COMPROBANTE RECIBIDO. QUEDA PENDIENTE LA CONFIRMACION DEL PAGO.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        error: "ERROR INTERNO AL PROCESAR LA SOLICITUD.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({ banks: getBankList() });
  } catch (error) {
    console.error("Error fetching bank info:", error);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
