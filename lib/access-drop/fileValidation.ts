import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "./types";

export type AllowedImageMime = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedImageExtension = (typeof ALLOWED_EXTENSIONS)[number];

export type ReceiptFileMetadata = {
  size: number;
  name: string;
  type: string;
};

export type ReceiptFileValidationError = {
  field: "comprobante";
  message: string;
  code:
    | "EMPTY_FILE"
    | "FILE_TOO_LARGE"
    | "INVALID_EXTENSION"
    | "INVALID_DECLARED_MIME"
    | "MIME_EXTENSION_MISMATCH"
    | "INVALID_FILE_SIGNATURE";
};

export type ValidatedReceiptFile = {
  extension: AllowedImageExtension;
  declaredMime: AllowedImageMime;
  detectedMime: AllowedImageMime;
};

const MIME_BY_EXTENSION: Record<AllowedImageExtension, AllowedImageMime[]> = {
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".png": ["image/png"],
};

export function getReceiptFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  return lastDot >= 0 ? normalized.slice(lastDot) : "";
}

export function validateReceiptFileMetadata(
  file: ReceiptFileMetadata,
): ReceiptFileValidationError | null {
  if (!file.size || file.size <= 0) {
    return {
      field: "comprobante",
      message: "EL ARCHIVO ESTA VACIO.",
      code: "EMPTY_FILE",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      field: "comprobante",
      message: `EL ARCHIVO SUPERA EL MAXIMO DE ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
      code: "FILE_TOO_LARGE",
    };
  }

  const extension = getReceiptFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension as AllowedImageExtension)) {
    return {
      field: "comprobante",
      message: "FORMATO NO PERMITIDO. USA SOLO JPG, JPEG O PNG.",
      code: "INVALID_EXTENSION",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedImageMime)) {
    return {
      field: "comprobante",
      message: "EL TIPO DEL ARCHIVO NO ES UNA IMAGEN JPG O PNG VALIDA.",
      code: "INVALID_DECLARED_MIME",
    };
  }

  const expectedMimes = MIME_BY_EXTENSION[extension as AllowedImageExtension];
  if (!expectedMimes.includes(file.type as AllowedImageMime)) {
    return {
      field: "comprobante",
      message: "LA EXTENSION NO COINCIDE CON EL TIPO DE IMAGEN.",
      code: "MIME_EXTENSION_MISMATCH",
    };
  }

  return null;
}

export function detectReceiptImageMime(bytes: Uint8Array): AllowedImageMime | null {
  const isJpeg =
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  if (isJpeg) return "image/jpeg";

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isPng =
    bytes.length >= pngSignature.length &&
    pngSignature.every((value, index) => bytes[index] === value);

  return isPng ? "image/png" : null;
}

export function validateReceiptFileBytes(
  file: ReceiptFileMetadata,
  bytes: Uint8Array,
): ReceiptFileValidationError | ValidatedReceiptFile {
  const metadataError = validateReceiptFileMetadata(file);
  if (metadataError) return metadataError;

  const detectedMime = detectReceiptImageMime(bytes);
  if (!detectedMime) {
    return {
      field: "comprobante",
      message: "EL CONTENIDO REAL DEL ARCHIVO NO ES JPG NI PNG.",
      code: "INVALID_FILE_SIGNATURE",
    };
  }

  const extension = getReceiptFileExtension(file.name) as AllowedImageExtension;
  const declaredMime = file.type as AllowedImageMime;

  const isJpegCompatible =
    detectedMime === "image/jpeg" &&
    (declaredMime === "image/jpeg" || declaredMime === "image/jpg");
  const isPngCompatible =
    detectedMime === "image/png" && declaredMime === "image/png";

  if (!isJpegCompatible && !isPngCompatible) {
    return {
      field: "comprobante",
      message: "EL CONTENIDO REAL NO COINCIDE CON LA EXTENSION O EL TIPO MIME.",
      code: "MIME_EXTENSION_MISMATCH",
    };
  }

  return { extension, declaredMime, detectedMime };
}

export function isReceiptFileValidationError(
  result: ReceiptFileValidationError | ValidatedReceiptFile,
): result is ReceiptFileValidationError {
  return "code" in result;
}
