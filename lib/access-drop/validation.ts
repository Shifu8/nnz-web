import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "./types";
import { isBadWord } from "@/lib/badWords";

export type ValidationError = {
  field: string;
  message: string;
};

export function validateFile(file: {
  size: number;
  name: string;
  type: string;
}): ValidationError | null {
  if (!file.size || file.size <= 0) {
    return { field: "file", message: "ARCHIVO VACÍO." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { field: "file", message: `ARCHIVO MUY GRANDE. MÁXIMO ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { field: "file", message: `FORMATO NO SOPORTADO. PERMITIDOS: ${ALLOWED_EXTENSIONS.join(", ")}` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type) {
    if (ext === ".pdf" && file.type !== "application/pdf") {
      return { field: "file", message: "ARCHIVO PDF INVÁLIDO." };
    }
  }

  return null;
}

export function validatePhone(phone: string): ValidationError | null {
  const digits = phone.replace(/\D/g, "");
  if (!/^59309\d{8}$/.test(digits) || digits.length !== 13) {
    return { field: "phone", message: "NÚMERO INVÁLIDO. DEBE SER +593 09XXXXXXXX." };
  }
  return null;
}

export function validateEmail(email: string): ValidationError | null {
  const clean = email.trim().toLowerCase();
  if (clean.length > 80 || !/^[a-z0-9._%+\-]{1,48}@[a-z0-9.\-]{2,40}\.[a-z]{2,12}$/.test(clean)) {
    return { field: "email", message: "EMAIL INVÁLIDO." };
  }
  return null;
}

export function validateCedula(cedula: string): ValidationError | null {
  const clean = cedula.replace(/\D/g, "");
  if (clean.length !== 10) {
    return { field: "documentNumber", message: "CÉDULA DEBE TENER 10 DÍGITOS." };
  }
  const provincia = parseInt(clean.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return { field: "documentNumber", message: "CÉDULA INVÁLIDA. PROVINCIA NO EXISTE." };
  }
  if (parseInt(clean.charAt(2), 10) >= 6) {
    return { field: "documentNumber", message: "CÉDULA INVÁLIDA." };
  }
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(clean.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const verificador = parseInt(clean.charAt(9), 10);
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let digitoResto = decenaSuperior - suma;
  if (digitoResto === 10) digitoResto = 0;
  if (digitoResto !== verificador) {
    return { field: "documentNumber", message: "CÉDULA INVÁLIDA. DÍGITO VERIFICADOR INCORRECTO." };
  }
  return null;
}

export function validateName(name: string): ValidationError | null {
  if (!name || name.trim().length < 2) {
    return { field: "firstName", message: "NOMBRE DEBE TENER AL MENOS 2 CARACTERES." };
  }
  if (isBadWord(name)) {
    return { field: "firstName", message: "LENGUAJE INAPROPIADO DETECTADO." };
  }
  return null;
}

export function validateQuantity(qty: number): ValidationError | null {
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
    return { field: "quantity", message: "CANTIDAD INVÁLIDA. MÍNIMO 1, MÁXIMO 10." };
  }
  return null;
}

export function validateReferenceNumber(ref: string): ValidationError | null {
  if (!ref || ref.trim().length < 3) {
    return { field: "referenceNumber", message: "NÚMERO DE REFERENCIA INVÁLIDO." };
  }
  return null;
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/[^\w\sÁÉÍÓÚÑáéíóúñ@.]/gi, "");
}
