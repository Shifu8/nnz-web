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
  const receiptIndex = receipts.findIndex(
    (receipt) => receipt.status === "aprobado" && receipt.serialNumber === payload.serialNumber,
  );

  if (receiptIndex === -1) {
    return { valid: false, error: "PASE NO ENCONTRADO", reason: "not_found" };
  }

  const receipt = receipts[receiptIndex];
  if (receipt.qrPayload !== input.qrPayload) {
    return { valid: false, error: "QR NO COINCIDE CON ESTE PASE", reason: "invalid_token" };
  }

  const quantity = Math.max(1, Number(receipt.quantity) || 1);
  const usedCount = Math.max(0, receipt.passScanCount ?? (receipt.passScannedAt ? 1 : 0));

  if (usedCount >= quantity) {
    return {
      valid: false,
      error: "QR YA USADO",
      reason: "used",
      scannedAt: receipt.passScannedAt,
    };
  }

  const now = new Date().toISOString();
  const nextCount = usedCount + 1;
  receipts[receiptIndex] = {
    ...receipt,
    passScannedAt: now,
    passScannedBy: input.staffSessionId,
    passScanCount: nextCount,
    passScans: [
      ...(receipt.passScans || []),
      {
        scannedAt: now,
        scannedBy: input.staffSessionId,
        ipHash: hashLookup(input.ip),
        userAgentHash: hashLookup(input.userAgent),
      },
    ].slice(-50),
  };
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
