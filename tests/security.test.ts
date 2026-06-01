import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  checkRateLimit,
  decryptSensitive,
  encryptSensitive,
  generateSecureQrPayload,
  hashToken,
  parseSecureQrPayload,
  sanitizeName,
  validateCardNumberLuhn,
  validateEcuadorCedula,
  validateEcuadorPhone,
} from "@/lib/security";
import { validateUtplQrPayload } from "@/lib/staff/utplCard";

process.env.DATA_ENCRYPTION_KEY ||= "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
process.env.QR_HASH_SECRET ||= "test-qr-secret";
process.env.JWT_SECRET ||= "test-jwt-secret-with-enough-length";

test("validates Ecuador phone and buyer document", () => {
  assert.equal(validateEcuadorPhone("0987654321"), true);
  assert.equal(validateEcuadorPhone("0887654321"), false);
  assert.equal(validateEcuadorCedula("1104680135"), true);
  assert.equal(validateEcuadorCedula("1104680131"), false);
});

test("validates cards with Luhn algorithm", () => {
  assert.equal(validateCardNumberLuhn("5451951574925480"), true);
  assert.equal(validateCardNumberLuhn("5451951574925481"), false);
});

test("sanitizes names without preserving markup", () => {
  assert.equal(sanitizeName("<script>Brandon</script> Medina"), "SCRIPTBRANDONSCRIPT MEDINA");
});

test("generates and parses DAWGS QR payload", () => {
  const payload = generateSecureQrPayload("DAWGS-1234-ABCDEF", crypto.randomUUID(), "trap-loud");
  const parsed = parseSecureQrPayload(payload);
  assert.equal(parsed.type, "DAWGS_PASS");
  assert.equal(parsed.serialNumber, "DAWGS-1234-ABCDEF");
  assert.equal(parsed.eventId, "trap-loud");
});

test("encrypts sensitive values and hashes tokens deterministically", () => {
  const encrypted = encryptSensitive("0987654321");
  assert.notEqual(encrypted, "0987654321");
  assert.equal(decryptSensitive(encrypted), "0987654321");
  assert.equal(hashToken("abc"), hashToken("abc"));
  assert.notEqual(hashToken("abc"), hashToken("abcd"));
});

test("rate limiter blocks after configured limit", () => {
  const namespace = `test-${crypto.randomUUID()}`;
  assert.equal(checkRateLimit("same-client", { namespace, limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(checkRateLimit("same-client", { namespace, limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(checkRateLimit("same-client", { namespace, limit: 2, windowMs: 60_000 }).allowed, false);
});

test("validates eligible UTPL student card payloads", () => {
  const payload = JSON.stringify({
    institucion: "UTPL",
    nombre: "MARIA JOSE LOPEZ",
    cedula: "1105989212",
    carrera: "PSICOLOGIA CLINICA",
    sexo: "F",
  });

  const result = validateUtplQrPayload(payload);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.student.careerId, "psicologia");
    assert.equal(result.requiresVisualGenderCheck, false);
  }
});

test("validates UTPL card career even when gender is not embedded", () => {
  const payload = "UTPL|NOMBRE=ANA PEREZ|CEDULA=1105989212|CARRERA=NUTRICION Y DIETETICA";
  const result = validateUtplQrPayload(payload);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.student.careerId, "nutricion");
    assert.equal(result.student.career, "NUTRICION Y DIETETICA");
    assert.equal(result.requiresVisualGenderCheck, false);
  }
});

test("reads UTPL card career from visible OCR text when QR only has an id", () => {
  const result = validateUtplQrPayload(
    "https://apps.utpl.edu.ec/carnet?id=1105989212",
    "DIEGO ANDRES CASTILLO C.I. 1105989212 ESTUDIANTE PRESENCIAL PSICOLOGIA CLINICA UTPL",
  );
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.student.careerId, "psicologia");
    assert.equal(result.student.career, "PSICOLOGIA CLINICA");
  }
});

test("allows a student card when OCR only catches the visible career", () => {
  const result = validateUtplQrPayload("STATIC-UTPL-CARD-1105989212", "PSICOLOGIA CLINICA");
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.student.careerId, "psicologia");
    assert.equal(result.requiresVisualCardCheck, false);
  }
});

test("accepts the four UTPL card careers for this event", () => {
  const careers = [
    ["PSICOLOGIA CLINICA", "psicologia"],
    ["FISIOTERAPIA", "fisioterapia"],
    ["NUTRICION Y DIETETICA", "nutricion"],
    ["DERECHO", "derecho"],
  ] as const;

  for (const [career, careerId] of careers) {
    const result = validateUtplQrPayload(JSON.stringify({ institucion: "UTPL", carrera: career, sexo: "F" }));
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.student.careerId, careerId);
  }
});

test("flags UTPL QR payloads that do not embed the visible career", () => {
  const result = validateUtplQrPayload("https://apps.utpl.edu.ec/carnet?id=1105989212");
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, "career_missing");
    assert.equal(result.student.documentNumber, "1105989212");
  }
});

test("rejects UTPL student cards outside the allowed careers", () => {
  const wrongCareer = validateUtplQrPayload(
    JSON.stringify({ institucion: "UTPL", nombre: "ANA", carrera: "ARQUITECTURA", sexo: "F" }),
  );
  assert.equal(wrongCareer.valid, false);
  if (!wrongCareer.valid) assert.equal(wrongCareer.reason, "career_not_allowed");

  const maleStudent = validateUtplQrPayload(
    JSON.stringify({ institucion: "UTPL", nombre: "DIEGO", carrera: "PSICOLOGIA CLINICA", sexo: "M" }),
  );
  assert.equal(maleStudent.valid, false);
  if (!maleStudent.valid) assert.equal(maleStudent.reason, "gender_not_allowed");
});
