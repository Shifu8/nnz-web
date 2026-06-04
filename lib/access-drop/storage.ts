import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { RECEIPTS_STORAGE_PATH, RECEIPTS_METADATA_PATH, ReceiptRecord, ReceiptStatus, BANKS } from "./types";

const projectRoot = process.cwd();

function getStorageDir(): string {
  return path.join(projectRoot, RECEIPTS_STORAGE_PATH);
}

function getMetadataFile(): string {
  return path.join(projectRoot, RECEIPTS_METADATA_PATH);
}

export function ensureDirectories(): void {
  const dirs = [getStorageDir(), path.dirname(getMetadataFile())];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function saveFile(buffer: Buffer, originalName: string): { filePath: string; fileName: string } {
  ensureDirectories();

  const ext = path.extname(originalName).toLowerCase();
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(getStorageDir(), fileName);

  fs.writeFileSync(filePath, buffer);

  return {
    filePath: path.join("uploads", "receipts", fileName),
    fileName,
  };
}

export function deleteFile(filePath: string): void {
  const fullPath = path.join(projectRoot, "public", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export function getFileBuffer(filePath: string): Buffer | null {
  const fullPath = path.join(projectRoot, "public", filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
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
  ensureDirectories();
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
  rejectionReason?: string
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
