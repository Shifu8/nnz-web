/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Utilidades para generar fingerprints básicos y manejar rate limiting simple.
 */

import { createHash } from "crypto";

/**
 * Genera un fingerprint basado en IP y User Agent.
 */
export function getFingerprint(ip: string, userAgent: string): string {
  const data = `${ip}-${userAgent}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Valida el formato de teléfono de Ecuador (09 + 8 dígitos).
 */
export function validateEcuadorPhone(phone: string): boolean {
  const phoneRegex = /^09\d{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida que el nombre contenga solo letras y espacios.
 */
export function validateName(name: string): boolean {
  // Solo letras (incluyendo acentos) y espacios. 2 a 25 caracteres.
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,25}$/;
  return nameRegex.test(name);
}
