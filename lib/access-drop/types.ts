export type ReceiptStatus = "pendiente" | "aprobado" | "rechazado";

export type PaymentMethod = "banco-loja" | "banco-pichincha" | "otros";

export type ReceiptClassification =
  | "payment_receipt"
  | "bank_transfer"
  | "bank_deposit"
  | "banking_app_screenshot"
  | "not_a_receipt";

export type ProhibitedReceiptContent =
  | "person"
  | "selfie"
  | "pet"
  | "dog"
  | "cat"
  | "landscape"
  | "meme"
  | "social_media"
  | "unrelated_screenshot"
  | "sexual_or_explicit"
  | "other";

export type OcrResult = {
  extractedText: string;
  confidence: number;
  detectedAmount?: string;
  detectedDate?: string;
  detectedTime?: string;
  detectedReference?: string;
  detectedBank?: string;
  detectedCurrency?: string;
  financialKeywords: string[];
  classification: ReceiptClassification;
  aiConfidence: number;
  isValidReceipt: boolean;
  prohibitedContent: ProhibitedReceiptContent[];
  visualEvidence: string[];
  referenceSimilarity: number;
  referenceNotes?: string;
  validationProvider:
    | "openai-vision+tesseract+quality"
    | "local-ocr+quality+profiles";
  model: string;
  imageQuality: {
    width: number;
    height: number;
    megapixels: number;
    blurScore: number;
    brightness: number;
    contrast: number;
    isLowResolution: boolean;
    isBlurry: boolean;
    isTooDark: boolean;
    isTooBright: boolean;
    isLowContrast: boolean;
    issues: string[];
  };
  matchedProfile?: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
  rejectionReason?: string;
};

export type ReceiptRecord = {
  id: string;
  eventId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  documentNumber: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  filePath: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  status: ReceiptStatus;
  rejectionReason?: string;
  ocrResult?: OcrResult;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  serialNumber?: string;
  qrPayload?: string;
  deliveryChannel?: "gmail" | "whatsapp" | "none";
  deliveryStatus?: string;
  emailSentAt?: string;
  whatsappQueuedAt?: string;
  whatsappSentAt?: string;
  passScannedAt?: string;
  passScannedBy?: string;
  passScanCount?: number;
  passScans?: {
    scannedAt: string;
    scannedBy: string;
    ipHash: string;
    userAgentHash: string;
  }[];
};

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const RECEIPTS_STORAGE_PATH = "public/uploads/receipts";

export const RECEIPTS_METADATA_PATH = "data/receipts.json";

export const REJECTION_REASONS = [
  { id: "pago-no-verificado", label: "Pago no verificado", description: "No se confirmó la transferencia en banca." },
  { id: "monto-incorrecto", label: "Monto incorrecto", description: "El monto transferido no coincide con el total." },
  { id: "comprobante-ilegible", label: "Comprobante ilegible", description: "No se puede leer la información del comprobante." },
  { id: "datos-incompletos", label: "Datos incompletos", description: "Faltan datos del usuario o del pago." },
  { id: "comprobante-duplicado", label: "Comprobante duplicado", description: "Este comprobante ya fue registrado." },
  { id: "sospechoso", label: "Sospechoso", description: "El comprobante parece alterado o no válido." },
  { id: "otro", label: "Otro", description: "Motivo no especificado." },
] as const;

export const BANKS = [
  { id: "banco-loja" as const, name: "Banco Loja", qrImage: "/images/qr-banco-loja.png", accountNumber: "XXXX-XXXX-XXXX" },
  { id: "banco-pichincha" as const, name: "Banco Pichincha", qrImage: "/images/qr-banco-pichincha.png", accountNumber: "XXXX-XXXX-XXXX" },
];
