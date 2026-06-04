import "server-only";

import fs from "fs";
import path from "path";

export type CareerEntry = {
  id: string;
  label: string;
  patterns: string[];
};

const STORE_PATH = path.join(process.cwd(), "data", "allowed-careers.json");

const DEFAULT_CAREERS: CareerEntry[] = [
  { id: "psicologia", label: "PSICOLOGIA CLINICA", patterns: ["PSICOLOGIA CLINICA", "PSICOLOGIA"] },
  { id: "fisioterapia", label: "FISIOTERAPIA", patterns: ["FISIOTERAPIA", "TERAPIA FISICA", "FISIO"] },
  { id: "nutricion", label: "NUTRICION Y DIETETICA", patterns: ["NUTRICION", "NUTRICION Y DIETETICA"] },
  { id: "derecho", label: "DERECHO", patterns: ["DERECHO"] },
];

function ensureDataDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadCareers(): CareerEntry[] {
  if (!fs.existsSync(STORE_PATH)) return [...DEFAULT_CAREERS];
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [...DEFAULT_CAREERS];
  } catch {
    return [...DEFAULT_CAREERS];
  }
}

export function saveCareers(careers: CareerEntry[]) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(careers, null, 2), "utf-8");
}

export function resetCareers() {
  saveCareers(DEFAULT_CAREERS);
  return DEFAULT_CAREERS;
}
