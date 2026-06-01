import "server-only";

import { recordUtplStudentScan, checkDuplicate } from "./studentScanStore";
import { validateUtplQrPayload, type UtplCareerId, type UtplStudentInfo } from "./utplCard";
import { loadCareers } from "./careerStore";

function getCareerLabel(careerId: string): string {
  const careers = loadCareers();
  return careers.find((c) => c.id === careerId)?.label || careerId.toUpperCase().replace(/-/g, " ");
}

function getDuplicateCheck(input: {
  qrPayload: string;
  eventId: string;
}): { duplicate: boolean; scannedAt?: string } {
  return checkDuplicate(input.qrPayload, input.eventId);
}

export type UtplCheckResult =
  | {
      valid: true;
      kind: "student";
      message: string;
      status: "allowed";
      student: {
        fullName?: string;
        documentNumber?: string;
        career?: string;
        careerId?: string;
        modality?: string;
        gender: "female" | "male" | "unknown";
      };
    }
  | {
      valid: false;
      kind: "student";
      status: "rejected";
      error: string;
      reason: string;
      student?: {
        fullName?: string;
        documentNumber?: string;
        career?: string;
        careerId?: string;
        modality?: string;
        gender: "female" | "male" | "unknown";
      };
    };

export function checkUtplStudentAccess(input: {
  qrPayload: string;
  eventId: string;
  visualText?: string;
}): UtplCheckResult {
  const dup = getDuplicateCheck({ qrPayload: input.qrPayload, eventId: input.eventId });
  if (dup.duplicate) {
    return {
      valid: false,
      kind: "student",
      status: "rejected",
      error: "CARNET YA REGISTRADO",
      reason: "duplicate",
    };
  }

  const inspected = validateUtplQrPayload(input.qrPayload, input.visualText);

  if (!inspected.valid) {
    return {
      valid: false,
      kind: "student",
      status: "rejected",
      error: inspected.error,
      reason: inspected.reason,
      student: inspected.student,
    };
  }

  return {
    valid: true,
    kind: "student",
    status: "allowed",
    message: "VALIDADO",
    student: inspected.student,
  };
}

export function confirmUtplStudentScan(input: {
  qrPayload: string;
  eventId: string;
  staffSessionId: string;
  ip: string;
  userAgent: string;
  student: {
    fullName?: string;
    documentNumber?: string;
    career?: string;
    careerId?: string;
    modality?: string;
    gender: "female" | "male" | "unknown";
  };
  careerId: string;
  genderConfirmed: boolean;
}): {
  success: boolean;
  error?: string;
  scannedAt?: string;
} {
  const dup = getDuplicateCheck({ qrPayload: input.qrPayload, eventId: input.eventId });
  if (dup.duplicate) {
    return { success: false, error: "CARNET YA REGISTRADO" };
  }

  const careerLabel = getCareerLabel(input.careerId);
  const student: UtplStudentInfo = {
    fullName: input.student.fullName,
    documentNumber: input.student.documentNumber,
    career: careerLabel,
    careerId: input.careerId,
    modality: input.student.modality,
    gender: input.genderConfirmed ? "female" : input.student.gender,
    institutionConfidence: "strong",
  };

  const record = recordUtplStudentScan({
    qrPayload: input.qrPayload,
    eventId: input.eventId,
    staffSessionId: input.staffSessionId,
    ip: input.ip,
    userAgent: input.userAgent,
    student,
    requiresVisualGenderCheck: !input.genderConfirmed,
    requiresVisualCardCheck: false,
  });

  if (record.duplicate) {
    return { success: false, error: "CARNET YA REGISTRADO" };
  }

  return { success: true, scannedAt: record.scannedAt };
}
