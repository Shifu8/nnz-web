import "server-only";

import fs from "fs";
import path from "path";
import { hashLookup } from "@/lib/security";
import type { UtplStudentInfo } from "./utplCard";

type StudentScanRecord = {
  payloadHash: string;
  eventId: string;
  scannedAt: string;
  scannedBy: string;
  ipHash: string;
  userAgentHash: string;
  career?: string;
  careerId?: string;
  documentSuffix?: string;
  requiresVisualGenderCheck: boolean;
  requiresVisualCardCheck: boolean;
};

const SCANS_PATH = path.join(process.cwd(), "data", "utpl-student-scans.json");

function ensureDataDir() {
  const dir = path.dirname(SCANS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadScans(): StudentScanRecord[] {
  if (!fs.existsSync(SCANS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(SCANS_PATH, "utf-8")) as StudentScanRecord[];
  } catch {
    return [];
  }
}

function saveScans(scans: StudentScanRecord[]) {
  ensureDataDir();
  fs.writeFileSync(SCANS_PATH, JSON.stringify(scans, null, 2), "utf-8");
}

export function checkDuplicate(qrPayload: string, eventId: string): { duplicate: boolean; scannedAt?: string } {
  const payloadHash = hashLookup(qrPayload);
  const scans = loadScans();
  const existing = scans.find((scan) => scan.payloadHash === payloadHash && scan.eventId === eventId);
  if (existing) return { duplicate: true, scannedAt: existing.scannedAt };
  return { duplicate: false };
}

export function getScansForEvent(eventId: string): StudentScanRecord[] {
  return loadScans().filter((s) => s.eventId === eventId);
}

export function deleteScanByHash(payloadHash: string, eventId: string): boolean {
  const scans = loadScans();
  const idx = scans.findIndex((s) => s.payloadHash === payloadHash && s.eventId === eventId);
  if (idx === -1) return false;
  scans.splice(idx, 1);
  saveScans(scans);
  return true;
}

export function recordUtplStudentScan(input: {
  qrPayload: string;
  eventId: string;
  staffSessionId: string;
  ip: string;
  userAgent: string;
  student: UtplStudentInfo;
  requiresVisualGenderCheck: boolean;
  requiresVisualCardCheck: boolean;
}): { duplicate: false; scannedAt: string } | { duplicate: true; scannedAt: string } {
  const payloadHash = hashLookup(input.qrPayload);
  const scans = loadScans();
  const existing = scans.find((scan) => scan.payloadHash === payloadHash && scan.eventId === input.eventId);

  if (existing) {
    return { duplicate: true, scannedAt: existing.scannedAt };
  }

  const scannedAt = new Date().toISOString();
  const documentSuffix = input.student.documentNumber?.slice(-4);

  scans.unshift({
    payloadHash,
    eventId: input.eventId,
    scannedAt,
    scannedBy: input.staffSessionId,
    ipHash: hashLookup(input.ip),
    userAgentHash: hashLookup(input.userAgent),
    career: input.student.career,
    careerId: input.student.careerId,
    documentSuffix,
    requiresVisualGenderCheck: input.requiresVisualGenderCheck,
    requiresVisualCardCheck: input.requiresVisualCardCheck,
  });

  saveScans(scans.slice(0, 5000));
  return { duplicate: false, scannedAt };
}
