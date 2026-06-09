export type UtplStudentGender = "female" | "male" | "unknown";

export type UtplCareerId = string;

export type UtplStudentInfo = {
  fullName?: string;
  documentNumber?: string;
  career?: string;
  careerId?: UtplCareerId;
  modality?: string;
  gender: UtplStudentGender;
  institutionConfidence: "strong" | "partial" | "missing";
};

export type UtplQrValidationResult =
  | {
      valid: true;
      message: string;
      student: UtplStudentInfo & { career: string; careerId: UtplCareerId };
      requiresVisualGenderCheck: boolean;
      requiresVisualCardCheck: boolean;
    }
  | {
      valid: false;
      error: string;
      reason:
        | "qr_too_large"
        | "career_missing"
        | "career_not_allowed"
        | "gender_not_allowed";
      student: UtplStudentInfo;
    };

import { loadCareers, type CareerEntry } from "./careerStore";

let _cachedCareers: (CareerEntry & { patternsRe: RegExp[] })[] | null = null;

function getCareers(): (CareerEntry & { patternsRe: RegExp[] })[] {
  if (_cachedCareers) return _cachedCareers;
  const loaded = loadCareers();
  _cachedCareers = loaded.map((c) => ({
    ...c,
    patternsRe: c.patterns.map((p) => new RegExp(`\\b${p}\\b`, "i")),
  }));
  return _cachedCareers;
}

export function invalidateCareerCache() {
  _cachedCareers = null;
}

const CAREERS: {
  id: string;
  label: string;
  patterns: RegExp[];
}[] = [];

type FieldBag = {
  byKey: Map<string, string[]>;
  values: string[];
  text: string[];
  urlHosts: string[];
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: string): string {
  return normalizeText(value).replace(/[^A-Z0-9]/g, "");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function maybeDecodeBase64(value: string): string | null {
  const clean = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/=]{20,}$/.test(clean)) return null;

  try {
    const decoded = Buffer.from(clean, "base64").toString("utf8");
    if (/[\u0000-\u0008\u000E-\u001F]/.test(decoded)) return null;
    if (decoded.length < 8) return null;
    return decoded;
  } catch {
    return null;
  }
}

function addField(bag: FieldBag, key: string, value: unknown) {
  if (value === null || value === undefined) return;
  if (typeof value === "object") return;

  const text = String(value).trim();
  if (!text) return;

  const normalized = normalizeKey(key);
  if (!bag.byKey.has(normalized)) bag.byKey.set(normalized, []);
  bag.byKey.get(normalized)!.push(text);
  bag.values.push(text);
}

function collectJson(value: unknown, bag: FieldBag, parentKey = "") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectJson(entry, bag, `${parentKey}${index}`));
    return;
  }

  if (!value || typeof value !== "object") {
    if (parentKey) addField(bag, parentKey, value);
    return;
  }

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;
    if (entry && typeof entry === "object") {
      collectJson(entry, bag, nextKey);
    } else {
      addField(bag, key, entry);
      addField(bag, nextKey, entry);
    }
  }
}

function collectUrl(value: string, bag: FieldBag) {
  try {
    const url = new URL(value);
    bag.urlHosts.push(url.hostname);
    bag.text.push(url.hostname, url.pathname);
    url.searchParams.forEach((paramValue, key) => {
      const decoded = safeDecode(paramValue);
      addField(bag, key, decoded);
      bag.text.push(decoded);
      collectJsonCandidate(decoded, bag);
    });
  } catch {
    // Not a URL payload.
  }
}

function collectJsonCandidate(value: string, bag: FieldBag) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return;

  try {
    collectJson(JSON.parse(trimmed), bag);
  } catch {
    // Not JSON.
  }
}

function collectKeyValuePairs(value: string, bag: FieldBag) {
  const regex = /(?:^|[|;,\n\r])\s*([A-Za-z0-9_. -]{2,40})\s*[:=]\s*([^|;,\n\r]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    addField(bag, match[1], match[2]);
  }
}

function buildFieldBag(qrPayload: string): FieldBag {
  const bag: FieldBag = {
    byKey: new Map(),
    values: [],
    text: [],
    urlHosts: [],
  };
  const candidates = new Set<string>();
  candidates.add(qrPayload);
  candidates.add(safeDecode(qrPayload));

  const base64 = maybeDecodeBase64(qrPayload);
  if (base64) candidates.add(base64);

  for (const candidate of candidates) {
    bag.text.push(candidate);
    collectJsonCandidate(candidate, bag);
    collectUrl(candidate, bag);
    collectKeyValuePairs(candidate, bag);
  }

  return bag;
}

function getField(bag: FieldBag, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const values = bag.byKey.get(normalizeKey(alias));
    const value = values?.find(Boolean);
    if (value) return value.trim();
  }
  return undefined;
}

function extractDocument(bag: FieldBag, rawText: string): string | undefined {
  const field = getField(bag, [
    "cedula",
    "ci",
    "c.i",
    "documento",
    "document",
    "identificacion",
    "dni",
    "identification",
  ]);
  const candidate = field?.match(/\d{10}/)?.[0] || rawText.match(/\b\d{10}\b/)?.[0];
  return candidate;
}

function extractName(bag: FieldBag): string | undefined {
  const fullName = getField(bag, [
    "nombre",
    "nombres",
    "name",
    "fullName",
    "full_name",
    "estudiante",
    "student",
    "alumno",
  ]);
  if (fullName) return normalizeText(fullName);

  const firstName = getField(bag, ["firstName", "first_name", "nombres"]);
  const lastName = getField(bag, ["lastName", "last_name", "apellidos"]);
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return joined ? normalizeText(joined) : undefined;
}

function extractCareer(bag: FieldBag, normalizedText: string): { id?: string; label: string } | null {
  const careerField = getField(bag, [
    "carrera",
    "career",
    "programa",
    "program",
    "programaAcademico",
    "programa_academico",
    "degree",
  ]);
  const haystack = normalizeText([careerField, ...bag.values, normalizedText].filter(Boolean).join(" "));

  const careers = getCareers();
  for (const career of careers) {
    if (career.patternsRe.some((pattern) => pattern.test(haystack))) {
      return { id: career.id, label: career.label };
    }
  }

  return careerField ? { label: normalizeText(careerField) } : null;
}

function isAllowedCareer(career: { id?: string; label: string } | null): career is {
  id: string;
  label: string;
} {
  if (!career) return false;
  const careers = getCareers();
  return careers.some((entry) => entry.id === career.id);
}

function extractGender(bag: FieldBag): UtplStudentGender {
  const gender = getField(bag, ["sexo", "genero", "gender", "sex"]);
  if (!gender) return "unknown";

  const normalized = normalizeText(gender);
  if (/\b(F|FEMENINO|MUJER|FEMALE|WOMAN)\b/.test(normalized)) return "female";
  if (/\b(M|MASCULINO|HOMBRE|MALE|MAN)\b/.test(normalized)) return "male";
  return "unknown";
}

function extractModality(bag: FieldBag): string | undefined {
  const modality = getField(bag, ["modalidad", "modalidadEstudio", "modalidad_estudio", "mode", "tipo"]);
  return modality ? normalizeText(modality) : undefined;
}

function getInstitutionConfidence(bag: FieldBag, normalizedText: string): UtplStudentInfo["institutionConfidence"] {
  const hostLooksUtpl = bag.urlHosts.some((host) => host.toLowerCase().endsWith("utpl.edu.ec"));
  if (hostLooksUtpl || /\bUTPL\b/.test(normalizedText) || normalizedText.includes("UNIVERSIDAD TECNICA PARTICULAR DE LOJA")) {
    return "strong";
  }
  if (normalizedText.includes("CARNET") || normalizedText.includes("ESTUDIANTE")) return "partial";
  return "missing";
}

export function validateUtplQrPayload(qrPayload: string, visualText = ""): UtplQrValidationResult {
  if (qrPayload.length > 4096) {
    return {
      valid: false,
      error: "QR UTPL DEMASIADO GRANDE",
      reason: "qr_too_large",
      student: { gender: "unknown", institutionConfidence: "missing" },
    };
  }

  const bag = buildFieldBag(qrPayload);
  if (visualText) {
    bag.text.push(visualText);
    collectKeyValuePairs(visualText, bag);
  }
  const normalizedPayload = normalizeText([qrPayload, visualText, ...bag.text, ...bag.values].join(" "));
  const career = extractCareer(bag, normalizedPayload);
  const gender = extractGender(bag);
  const student: UtplStudentInfo = {
    fullName: extractName(bag),
    documentNumber: extractDocument(bag, qrPayload),
    career: career?.label,
    careerId: career?.id,
    modality: extractModality(bag),
    gender,
    institutionConfidence: getInstitutionConfidence(bag, normalizedPayload),
  };

  if (!career) {
    return {
      valid: false,
      error: "CARRERA NO DETECTADA",
      reason: "career_missing",
      student,
    };
  }

  if (!isAllowedCareer(career)) {
    return {
      valid: false,
      error: "CARRERA NO PERMITIDA",
      reason: "career_not_allowed",
      student,
    };
  }

  if (gender === "male") {
    return {
      valid: false,
      error: "CARNET NO HABILITADO PARA ESTE ACCESO",
      reason: "gender_not_allowed",
      student,
    };
  }

  return {
    valid: true,
    message: "VALIDADO",
    student: {
      fullName: student.fullName,
      documentNumber: student.documentNumber,
      career: career.label,
      careerId: career.id,
      modality: student.modality,
      gender: student.gender === "female" ? "female" : "unknown",
      institutionConfidence: student.institutionConfidence || "partial",
    },
    requiresVisualGenderCheck: false,
    requiresVisualCardCheck: false,
  };
}
