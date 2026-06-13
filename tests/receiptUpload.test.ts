import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  detectReceiptImageMime,
  isReceiptFileValidationError,
  validateReceiptFileBytes,
  validateReceiptFileMetadata,
} from "../lib/access-drop/fileValidation";
import {
  analyzeReceiptImage,
  buildReceiptDecision,
} from "../lib/access-drop/receiptAnalysis";
import type { LocalOcrResult } from "../lib/access-drop/ocr";

const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const pngBytes = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

test("detecta firmas binarias JPG y PNG", () => {
  assert.equal(detectReceiptImageMime(jpegBytes), "image/jpeg");
  assert.equal(detectReceiptImageMime(pngBytes), "image/png");
  assert.equal(detectReceiptImageMime(Uint8Array.from([0x25, 0x50, 0x44, 0x46])), null);
});

test("rechaza PDF y MIME declarados no permitidos", () => {
  const pdfError = validateReceiptFileMetadata({
    name: "comprobante.pdf",
    size: 100,
    type: "application/pdf",
  });
  assert.equal(pdfError?.code, "INVALID_EXTENSION");

  const mimeError = validateReceiptFileMetadata({
    name: "comprobante.jpg",
    size: 100,
    type: "application/octet-stream",
  });
  assert.equal(mimeError?.code, "INVALID_DECLARED_MIME");
});

test("rechaza archivos disfrazados aunque la extension y MIME parezcan validos", () => {
  const result = validateReceiptFileBytes(
    { name: "comprobante.jpg", size: 4, type: "image/jpeg" },
    Uint8Array.from([0x25, 0x50, 0x44, 0x46]),
  );

  assert.equal(isReceiptFileValidationError(result), true);
  if (isReceiptFileValidationError(result)) {
    assert.equal(result.code, "INVALID_FILE_SIGNATURE");
  }
});

test("acepta cuando extension, MIME y firma real coinciden", () => {
  const result = validateReceiptFileBytes(
    { name: "comprobante.jpeg", size: jpegBytes.length, type: "image/jpeg" },
    jpegBytes,
  );

  assert.equal(isReceiptFileValidationError(result), false);
  if (!isReceiptFileValidationError(result)) {
    assert.equal(result.detectedMime, "image/jpeg");
  }
});

type VisionInput = NonNullable<
  Parameters<typeof buildReceiptDecision>[0]["vision"]
>;

const goodQuality = {
  width: 591,
  height: 1280,
  megapixels: 0.76,
  blurScore: 600,
  brightness: 190,
  contrast: 80,
  isLowResolution: false,
  isBlurry: false,
  isTooDark: false,
  isTooBright: false,
  isLowContrast: false,
  issues: [],
};

const validVision: VisionInput = {
  isReceipt: true,
  classification: "bank_transfer",
  confidence: 0.94,
  rejectionReason: "",
  prohibitedContent: [],
  visualEvidence: ["Pantalla bancaria con monto y referencia"],
  extractedText:
    "Banco Pichincha Transferencia exitosa Fecha 13/06/2026 Monto USD 10.00 Referencia ABC12345",
  financialKeywords: [
    "banco",
    "transferencia",
    "fecha",
    "monto",
    "usd",
    "referencia",
  ],
  financialFields: {
    bank: "Banco Pichincha",
    transactionType: "Transferencia",
    reference: "ABC12345",
    date: "13/06/2026",
    time: "18:30",
    amount: "10.00",
    currency: "USD",
  },
  imageQuality: {
    isReadable: true,
    isBlurry: false,
    isCropped: false,
    reason: "",
  },
  referenceSimilarity: 0.84,
  referenceNotes: "Comparte estructura y jerarquia con las referencias.",
};

const localOcr: LocalOcrResult = {
  text: validVision.extractedText,
  confidence: 91,
  keywords: ["banco", "transferencia", "fecha", "monto", "usd", "referencia"],
  detectedAmount: "10.00",
  detectedDate: "13/06/2026",
  detectedReference: "ABC12345",
  detectedBank: "Banco Pichincha",
  detectedCurrency: "USD",
};

test("acepta un comprobante con evidencia visual y financiera suficiente", () => {
  const result = buildReceiptDecision({
    vision: validVision,
    localOcr,
    explicitContent: false,
    model: "test-model",
    quality: goodQuality,
  });

  assert.equal(result.isValidReceipt, true);
  assert.equal(result.rejectionReason, undefined);
  assert.equal(result.detectedReference, "ABC12345");
});

test("rechaza personas aunque la imagen tambien contenga texto financiero", () => {
  const result = buildReceiptDecision({
    vision: {
      ...validVision,
      prohibitedContent: ["person", "selfie"],
    },
    localOcr,
    explicitContent: false,
    model: "test-model",
    quality: goodQuality,
  });

  assert.equal(result.isValidReceipt, false);
  assert.match(result.rejectionReason || "", /personas/i);
});

test("rechaza una imagen sin suficientes terminos financieros", () => {
  const result = buildReceiptDecision({
    vision: {
      ...validVision,
      financialKeywords: [],
      extractedText: "Imagen bonita sin datos de pago",
      financialFields: {
        bank: null,
        transactionType: null,
        reference: null,
        date: null,
        time: null,
        amount: null,
        currency: null,
      },
    },
    localOcr: {
      text: "",
      confidence: 0,
      keywords: [],
    },
    explicitContent: false,
    model: "test-model",
    quality: goodQuality,
  });

  assert.equal(result.isValidReceipt, false);
  assert.match(result.rejectionReason || "", /INFORMACION FINANCIERA/);
});

test("acepta el formato de Banco de Loja usando los patrones de referencia", () => {
  const text = [
    "BANCO DE LOJA",
    "Envio exitoso",
    "16/04/2026",
    "Monto transferido $50,00",
    "Desde cuenta de ahorros",
    "Para Banco de Loja",
    "Costo de transaccion: $0,00",
    "Nro. comprobante: 110225887",
  ].join("\n");

  const result = buildReceiptDecision({
    localOcr: {
      text,
      confidence: 86,
      keywords: [],
    },
    explicitContent: false,
    quality: goodQuality,
    expectedPaymentMethod: "banco-loja",
  });

  assert.equal(result.isValidReceipt, true);
  assert.equal(result.matchedProfile, "banco-loja");
  assert.equal(result.classification, "bank_transfer");
});

test("acepta el formato Pichincha Deuna usando los patrones de referencia", () => {
  const text = [
    "BANCO PICHINCHA DEUNA",
    "Pago exitoso con Deuna",
    "$ 1,00",
    "El 29 de mayo de 2026",
    "Cuenta destino 7524",
    "Banco destino Deuna",
    "Cuenta origen 5907",
    "N de comprobante 32561683",
    "Verificar la transaccion con este QR",
  ].join("\n");

  const result = buildReceiptDecision({
    localOcr: {
      text,
      confidence: 88,
      keywords: [],
    },
    explicitContent: false,
    quality: goodQuality,
    expectedPaymentMethod: "banco-pichincha",
  });

  assert.equal(result.isValidReceipt, true);
  assert.equal(result.matchedProfile, "pichincha-deuna");
  assert.equal(result.classification, "banking_app_screenshot");
});

test("acepta una foto clara de un deposito fisico", () => {
  const text = [
    "BANCO PICHINCHA",
    "COMPROBANTE DE DEPOSITO EN EFECTIVO",
    "Agencia Loja",
    "Cuenta 2200012345",
    "Depositante Brandon Medina",
    "Fecha 13/06/2026",
    "Valor USD 25.00",
    "Recibo 99887766",
  ].join("\n");

  const result = buildReceiptDecision({
    localOcr: {
      text,
      confidence: 66,
      keywords: [],
    },
    explicitContent: false,
    quality: goodQuality,
  });

  assert.equal(result.isValidReceipt, true);
  assert.equal(result.matchedProfile, "deposito-fisico");
  assert.equal(result.classification, "bank_deposit");
});

test("rechaza una foto borrosa aunque tenga palabras financieras", () => {
  const result = buildReceiptDecision({
    localOcr,
    explicitContent: false,
    quality: {
      ...goodQuality,
      blurScore: 4,
      isBlurry: true,
      issues: ["imagen borrosa"],
    },
  });

  assert.equal(result.isValidReceipt, false);
  assert.match(result.rejectionReason || "", /BORROSA/);
});

test("valida el ejemplo real de Banco de Loja con calidad y OCR", async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const image = readFileSync(
    new URL(
      "../app/api/access-drop/example-transfers/75c05386-df2c-4903-bb9c-b3c96e0bd668.jpg",
      import.meta.url,
    ),
  );
  try {
    const result = await analyzeReceiptImage(
      image,
      "image/jpeg",
      "banco-loja",
    );

    assert.equal(result.imageQuality.isBlurry, false);
    assert.ok(result.confidence >= 28);
    assert.equal(result.isValidReceipt, true);
    assert.equal(result.matchedProfile, "banco-loja");
    assert.equal(result.detectedBank, "Banco de Loja");
    assert.equal(result.validationProvider, "local-ocr+quality+profiles");
  } finally {
    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  }
});
