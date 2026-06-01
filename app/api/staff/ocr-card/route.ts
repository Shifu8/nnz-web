import Tesseract from "tesseract.js";
import { z } from "zod";
import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  handleApiError,
  readJson,
  verifyStaffRequest,
} from "@/lib/security";

export const runtime = "nodejs";

const ocrSchema = z.object({
  imageData: z.string().min(64).max(900_000),
});

type TesseractWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;

let workerPromise: Promise<TesseractWorker> | null = null;
let queue = Promise.resolve();

function imageBufferFromDataUrl(imageData: string): Buffer {
  const match = imageData.match(/^data:image\/(?:png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new ApiError(400, "Imagen de carnet invalida.", "INVALID_IMAGE");
  }

  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length > 650_000) {
    throw new ApiError(413, "Imagen de carnet demasiado grande.", "PAYLOAD_TOO_LARGE");
  }
  return buffer;
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker("eng", 1, {
      cachePath: process.cwd(),
      logger: () => {},
    }).then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .:|-/",
        preserve_interword_spaces: "1",
        user_defined_dpi: "220",
      });
      return worker;
    });
  }
  return workerPromise;
}

async function runQueuedOcr(buffer: Buffer) {
  const run = queue.then(async () => {
    const worker = await getWorker();
    const result = await worker.recognize(buffer);
    return result.data.text.replace(/\s+/g, " ").trim().slice(0, 6000);
  });

  queue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "staff-ocr-card", limit: 80, windowMs: 60_000 });
    await verifyStaffRequest(request, { requireCsrf: true, roles: ["staff", "admin"] });
    const { imageData } = await readJson(request, ocrSchema, 1_000_000);

    const text = await runQueuedOcr(imageBufferFromDataUrl(imageData));
    return Response.json({ text });
  } catch (error) {
    return handleApiError(error);
  }
}
