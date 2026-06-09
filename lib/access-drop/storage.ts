import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

function getStorageDir(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads", "receipts");
}

export function ensureDirectories(): void {
  const dir = getStorageDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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
  const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export function getFileBuffer(filePath: string): Buffer | null {
  const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}
