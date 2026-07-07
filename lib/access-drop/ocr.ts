import path from "path";
import { createWorker } from "tesseract.js";
import { prepareImageForOcr } from "./imageQuality";

export type FinancialTextAnalysis = {
  keywords: string[];
  detectedAmount?: string;
  detectedDate?: string;
  detectedTime?: string;
  detectedReference?: string;
  detectedBank?: string;
  detectedCurrency?: string;
};

export type LocalOcrResult = FinancialTextAnalysis & {
  text: string;
  confidence: number;
};

const FINANCIAL_KEYWORDS = [
  { label: "banco", pattern: /\bbanco\b/i },
  { label: "transferencia", pattern: /\btransfer(?:encia|ido|ir)\b/i },
  { label: "deposito", pattern: /\bdep[oó]sit(?:o|ado|ar)\b/i },
  { label: "pago", pattern: /\bpago\b|\benv[ií]o\b/i },
  { label: "comprobante", pattern: /\b(?:comprobante|voucher|recibo)\b/i },
  { label: "referencia", pattern: /\b(?:referencia|ref\.?)\b/i },
  { label: "transaccion", pattern: /\btransacci[oó]n\b/i },
  { label: "fecha", pattern: /\bfecha\b/i },
  { label: "hora", pattern: /\bhora\b/i },
  { label: "monto", pattern: /\bmonto\b/i },
  { label: "valor", pattern: /\bvalor\b/i },
  { label: "usd", pattern: /\bUSD\b|\$\s*\d/i },
  { label: "cuenta", pattern: /\b(?:cuenta|cta\.?)\b/i },
  { label: "exitoso", pattern: /\bexitos[oa]\b|\brealizad[oa]\b|\baprobado\b/i },
] as const;

const BANK_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "Banco Pichincha", pattern: /\bpichincha\b/i },
  { name: "Deuna", pattern: /\bdeuna\b/i },
  { name: "Banco de Loja", pattern: /\b(?:banco\s+de\s+loja|banco\s+loja)\b/i },
  { name: "Banco Guayaquil", pattern: /\bguayaquil\b/i },
  { name: "Banco del Pacifico", pattern: /\bpac[ií]fico\b/i },
  { name: "Banco Bolivariano", pattern: /\bbolivariano\b/i },
  { name: "Banco Internacional", pattern: /\binternacional\b/i },
  { name: "Produbanco", pattern: /\bprodubanco\b/i },
  { name: "Banco de Machala", pattern: /\bmachala\b/i },
];

const AMOUNT_PATTERNS = [
  /(?:monto|valor|total|importe|transferido|recibido|enviado|efectivo)[^\d$]{0,25}(?:USD|\$)?\s*(\d{1,6}(?:[.,]\d{2}))/i,
  /(?:USD|\$)\s*(\d{1,6}(?:[.,]\d{2}))/i,
  /\b(\d{1,6}[.,]\d{2})\s*(?:USD)?\b/i,
];

const DATE_PATTERNS = [
  /(?:fecha)?[^\d]{0,8}(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  /(?:fecha)?[^\d]{0,8}(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
  // Support Spanish month abbreviations like "2023/dic./30" or "30/ene/2024"
  /(?:fecha)?[^\d]{0,8}(\d{4}[/-](?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[/-]\d{1,2})/i,
  /(?:fecha)?[^\d]{0,8}(\d{1,2}[/-](?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[/-]\d{2,4})/i,
];

const TIME_PATTERNS = [
  /(?:hora)?[^\d]{0,8}(\d{1,2}:\d{2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)?)/i,
];

const REFERENCE_PATTERNS = [
  /(?:n(?:ro|o|[°º])?\.?\s*(?:de\s+)?comprobante|referencia|ref\.?|transacci[oó]n|comprobante|operaci[oó]n|n[uú]mero|documento|control)[\s:#.-]*([A-Z0-9-]{5,30})/i,
];

function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractAmount(text: string): string | undefined {
  let fallbackZeroAmount: string | undefined = undefined;

  for (const pattern of AMOUNT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags + "g");
    const matches = text.matchAll(regex);
    for (const match of matches) {
      if (match?.[1]) {
        const val = match[1].trim().replace(",", ".");
        const parsed = parseFloat(val);
        if (!Number.isNaN(parsed)) {
          if (parsed > 0.01) {
            return val;
          } else {
            fallbackZeroAmount = val;
          }
        }
      }
    }
  }
  return fallbackZeroAmount;
}

export function analyzeFinancialText(text: string): FinancialTextAnalysis {
  const keywords = FINANCIAL_KEYWORDS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
  const detectedBank = BANK_PATTERNS.find(({ pattern }) => pattern.test(text))?.name;
  const currencyMatch = text.match(/\b(USD|EUR)\b|\$/i);

  return {
    keywords,
    detectedAmount: extractAmount(text),
    detectedDate: firstMatch(text, DATE_PATTERNS),
    detectedTime: firstMatch(text, TIME_PATTERNS),
    detectedReference: firstMatch(text, REFERENCE_PATTERNS),
    detectedBank,
    detectedCurrency: currencyMatch
      ? currencyMatch[1]?.toUpperCase() || "USD"
      : undefined,
  };
}

export async function extractReceiptText(imageBuffer: Buffer): Promise<LocalOcrResult> {
  const rootDir = process.cwd().endsWith("frontend") ? path.dirname(process.cwd()) : process.cwd();
  
  const workerPath = path.join(
    rootDir,
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js",
  );
  const worker = await createWorker("spa", 1, {
    workerPath,
    cachePath: rootDir
  });

  try {
    const preparedImage = await prepareImageForOcr(imageBuffer);
    const { data } = await worker.recognize(preparedImage);
    const text = data.text?.trim().slice(0, 12_000) || "";
    return {
      text,
      confidence: Math.round(data.confidence || 0),
      ...analyzeFinancialText(text),
    };
  } finally {
    await worker.terminate();
  }
}
