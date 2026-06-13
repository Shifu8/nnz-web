import { isBadWord } from "@/lib/badWords";
import {
  validateReceiptFileMetadata,
  type ReceiptFileMetadata,
} from "./fileValidation";

export type ValidationError = {
  field: string;
  message: string;
};

export function validateFile(file: ReceiptFileMetadata): ValidationError | null {
  const error = validateReceiptFileMetadata(file);
  return error ? { field: error.field, message: error.message } : null;
}

export function validatePhone(phone: string): ValidationError | null {
  const digits = phone.replace(/\D/g, "");
  if (!/^59309\d{8}$/.test(digits) || digits.length !== 13) {
    return { field: "phone", message: "NUMERO INVALIDO. DEBE SER +593 09XXXXXXXX." };
  }
  return null;
}

export function validateEmail(email: string): ValidationError | null {
  const clean = email.trim().toLowerCase();
  if (clean.length > 80 || !/^[a-z0-9._%+\-]{1,48}@[a-z0-9.\-]{2,40}\.[a-z]{2,12}$/.test(clean)) {
    return { field: "email", message: "EMAIL INVALIDO." };
  }
  return null;
}

export function validateCedula(cedula: string): ValidationError | null {
  const clean = cedula.replace(/\D/g, "");
  if (clean.length !== 10) {
    return { field: "documentNumber", message: "CEDULA DEBE TENER 10 DIGITOS." };
  }
  const provincia = parseInt(clean.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return { field: "documentNumber", message: "CEDULA INVALIDA. PROVINCIA NO EXISTE." };
  }
  if (parseInt(clean.charAt(2), 10) >= 6) {
    return { field: "documentNumber", message: "CEDULA INVALIDA." };
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
    return {
      field: "documentNumber",
      message: "CEDULA INVALIDA. DIGITO VERIFICADOR INCORRECTO.",
    };
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
    return { field: "quantity", message: "CANTIDAD INVALIDA. MINIMO 1, MAXIMO 10." };
  }
  return null;
}

export function validateReferenceNumber(ref: string): ValidationError | null {
  if (!ref || ref.trim().length < 3) {
    return { field: "referenceNumber", message: "NUMERO DE REFERENCIA INVALIDO." };
  }
  return null;
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/[^\p{L}\p{N}\s@._-]/gu, "");
}
