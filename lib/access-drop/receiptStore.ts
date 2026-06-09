import fs from "fs";
import path from "path";
import { BANKS, ReceiptRecord, ReceiptStatus } from "./types";

function getMetadataFile(): string {
  return path.join(process.cwd(), "data", "receipts.json");
}

function ensureDataDir(): void {
  const dir = path.dirname(getMetadataFile());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadAllReceipts(): ReceiptRecord[] {
  const metaFile = getMetadataFile();
  if (!fs.existsSync(metaFile)) return [];
  try {
    const raw = fs.readFileSync(metaFile, "utf-8");
    return JSON.parse(raw) as ReceiptRecord[];
  } catch {
    return [];
  }
}

export function saveAllReceipts(receipts: ReceiptRecord[]): void {
  const metaFile = getMetadataFile();
  ensureDataDir();
  fs.writeFileSync(metaFile, JSON.stringify(receipts, null, 2), "utf-8");
}

export function getReceiptById(id: string): ReceiptRecord | null {
  const receipts = loadAllReceipts();
  return receipts.find((r) => r.id === id) || null;
}

export function addReceipt(record: ReceiptRecord): void {
  const receipts = loadAllReceipts();
  receipts.push(record);
  saveAllReceipts(receipts);
}

export function updateReceiptStatus(
  id: string,
  status: ReceiptStatus,
  reviewedBy?: string,
  rejectionReason?: string,
): ReceiptRecord | null {
  const receipts = loadAllReceipts();
  const idx = receipts.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  receipts[idx].status = status;
  receipts[idx].reviewedAt = new Date().toISOString();
  if (reviewedBy) receipts[idx].reviewedBy = reviewedBy;
  if (rejectionReason) receipts[idx].rejectionReason = rejectionReason;

  saveAllReceipts(receipts);
  return receipts[idx];
}

export function getBankList() {
  return BANKS.map((b) => ({ id: b.id, name: b.name, qrImage: b.qrImage }));
}
