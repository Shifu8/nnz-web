/**
 * Módulo OCR para comprobantes de pago.
 * Usa Tesseract.js para extraer texto de imágenes.
 * NO aprueba pagos automáticamente — solo filtra y ayuda al admin.
 */

import { createWorker } from "tesseract.js";
import path from "path";
import { OcrResult } from "./types";

const MIN_CONFIDENCE = 30;
const MIN_TEXT_LENGTH = 15;
const SUSPICIOUS_KEYWORDS = ["test", "prueba", "demo", "fake", "falso", "sample", "placeholder"];

const AMOUNT_PATTERNS = [
  /\$?\s?(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{2}))/,
  /total[:\s]*\$?\s?(\d+[.,]?\d*)/i,
  /monto[:\s]*\$?\s?(\d+[.,]?\d*)/i,
  /valor[:\s]*\$?\s?(\d+[.,]?\d*)/i,
  /\b(\d+[.,]\d{2})\b/,
];

const DATE_PATTERNS = [
  /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
  /fecha[:\s]*([\d/.-]+)/i,
];

const REFERENCE_PATTERNS = [
  /(?:ref|referencia|número|no\.?)[:\s]*([A-Z0-9-]{5,30})/i,
  /(?:comprobante|voucher|ticket)[:\s]*([A-Z0-9-]{5,30})/i,
  /\b([A-Z0-9]{6,20})\b/,
];

const BANK_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: "Banco Pichincha", patterns: [/pichincha/i, /pichincha/i] },
  { name: "Banco Loja", patterns: [/banco\s*loja/i, /loja/i] },
  { name: "Banco Guayaquil", patterns: [/guayaquil/i] },
  { name: "Banco del Pacífico", patterns: [/pac[íi]fico/i] },
  { name: "Banco Bolivariano", patterns: [/bolivariano/i] },
  { name: "Banco Internacional", patterns: [/internacional/i] },
  { name: "Produbanco", patterns: [/produbanco/i] },
  { name: "Banco de Machala", patterns: [/machala/i] },
];

const RECEIPT_PATTERNS = [
  /transferencia/i,
  /dep[óo]sito/i,
  /pago/i,
  /banco/i,
  /cuenta/i,
  /total/i,
  /monto/i,
  /comprobante/i,
  /referencia/i,
  /confirmaci[óo]n/i,
  /estado\s*de\s*cuenta/i,
  /movimiento/i,
  /abono/i,
  /d[ée]bito/i,
  /cr[ée]dito/i,
  /beneficiario/i,
  /ordenante/i,
];

export async function processReceiptImage(
  imageBuffer: Buffer,
  fileName: string
): Promise<OcrResult> {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );
  const worker = await createWorker("spa", undefined, { workerPath });
  const { data } = await worker.recognize(imageBuffer);
  await worker.terminate();

  const extractedText = data.text?.trim() || "";
  const confidence = Math.round(data.confidence || 0);

  const result: OcrResult = {
    extractedText,
    confidence,
    isSuspicious: false,
  };

  if (extractedText.length < MIN_TEXT_LENGTH) {
    result.isSuspicious = true;
    result.suspiciousReason = "ARCHIVO SIN TEXTO VÁLIDO. POSIBLE ARCHIVO BASURA.";
    result.rejectionReason = "ARCHIVO RECHAZADO AUTOMÁTICAMENTE: NO CONTIENE TEXTO DE COMPROBANTE.";
    return result;
  }

  const lower = extractedText.toLowerCase();
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (lower.includes(kw)) {
      result.isSuspicious = true;
      result.suspiciousReason = `ARCHIVO MARCADO SOSPECHOSO: CONTIENE "${kw.toUpperCase()}"`;
      break;
    }
  }

  const receiptScore = RECEIPT_PATTERNS.reduce((score, pattern) => {
    return pattern.test(extractedText) ? score + 1 : score;
  }, 0);

  if (receiptScore < 2) {
    result.isSuspicious = true;
    result.suspiciousReason = result.suspiciousReason
      ? `${result.suspiciousReason}. PARECE NO SER UN COMPROBANTE REAL.`
      : "PARECE NO SER UN COMPROBANTE REAL. ESCASAS PALABRAS CLAVE DETECTADAS.";
    result.rejectionReason = "ARCHIVO RECHAZADO AUTOMÁTICAMENTE: NO SE DETECTARON PATRONES DE COMPROBANTE.";
  }

  if (confidence < MIN_CONFIDENCE) {
    result.isSuspicious = true;
    result.suspiciousReason = result.suspiciousReason
      ? `${result.suspiciousReason}. BAJA CONFIANZA OCR (${confidence}%).`
      : `BAJA CONFIANZA OCR (${confidence}%).`;
  }

  for (const pattern of AMOUNT_PATTERNS) {
    const match = extractedText.match(pattern);
    if (match && match[1]) {
      result.detectedAmount = match[1].replace(/,/g, "");
      break;
    }
  }

  for (const pattern of DATE_PATTERNS) {
    const match = extractedText.match(pattern);
    if (match && match[1]) {
      result.detectedDate = match[1];
      break;
    }
  }

  for (const pattern of REFERENCE_PATTERNS) {
    const match = extractedText.match(pattern);
    if (match && match[1]) {
      result.detectedReference = match[1];
      break;
    }
  }

  for (const bank of BANK_PATTERNS) {
    if (bank.patterns.some((p) => p.test(extractedText))) {
      result.detectedBank = bank.name;
      break;
    }
  }

  return result;
}
