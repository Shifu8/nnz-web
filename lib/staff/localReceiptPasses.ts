import "server-only";

import { loadAllReceipts, saveAllReceipts } from "@/lib/access-drop/receiptStore";
import type { PassValidationResult } from "@/lib/db/passStore";
import { hashLookup, parseSecureQrPayload } from "@/lib/security";

export function validateLocalReceiptPassOnce(input: {
  qrPayload: string;
  staffSessionId: string;
  ip: string;
  userAgent: string;
}): PassValidationResult {
  const payload = parseSecureQrPayload(input.qrPayload);
  const receipts = loadAllReceipts();
  
  // Find receipt that contains the scanned serial number
  const receiptIndex = receipts.findIndex(
    (receipt) =>
      receipt.status === "aprobado" &&
      (receipt.serialNumber === payload.serialNumber ||
        receipt.serialNumber?.split(",").includes(payload.serialNumber))
  );

  if (receiptIndex === -1) {
    return { valid: false, error: "PASE NO ENCONTRADO", reason: "not_found" };
  }

  const receipt = receipts[receiptIndex];
  
  // Verify that the scanned QR payload matches the registered one for this serial
  const serials = receipt.serialNumber?.split(",") || [];
  const payloads = receipt.qrPayload?.split(",") || [];
  const serialIdx = serials.indexOf(payload.serialNumber);
  
  if (serialIdx === -1 || payloads[serialIdx] !== input.qrPayload) {
    return { valid: false, error: "QR NO COINCIDE CON ESTE PASE", reason: "invalid_token" };
  }

  // Check scanned serials tracking
  // We will store scanned serials as a comma-separated list in a custom property on receipt
  const scannedList = (receipt as any).scannedSerials
    ? String((receipt as any).scannedSerials).split(",")
    : [];

  if (scannedList.includes(payload.serialNumber)) {
    return {
      valid: false,
      error: "QR YA USADO",
      reason: "used",
      scannedAt: receipt.passScannedAt,
    };
  }

  const now = new Date().toISOString();
  scannedList.push(payload.serialNumber);
  const nextCount = scannedList.length;
  const quantity = serials.length;

  receipts[receiptIndex] = {
    ...receipt,
    passScannedAt: now,
    passScannedBy: input.staffSessionId,
    passScanCount: nextCount,
    scannedSerials: scannedList.join(","),
    passScans: [
      ...(receipt.passScans || []),
      {
        scannedAt: now,
        scannedBy: input.staffSessionId,
        ipHash: hashLookup(input.ip),
        userAgentHash: hashLookup(input.userAgent),
      },
    ].slice(-50),
  } as any;
  
  saveAllReceipts(receipts);

  return {
    valid: true,
    message: "ACCESO PERMITIDO",
    passInfo: {
      serialNumber: payload.serialNumber,
      eventId: payload.eventId,
      scannedAt: now,
      holderName: `${receipt.firstName} ${receipt.lastName}`.trim(),
      quantity,
      scanNumber: nextCount,
      remainingUses: quantity - nextCount,
    },
  };
}
