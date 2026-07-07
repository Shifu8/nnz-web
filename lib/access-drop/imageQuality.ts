import "server-only";

import sharp from "sharp";

export type ImageQualityResult = {
  width: number;
  height: number;
  megapixels: number;
  blurScore: number;
  brightness: number;
  contrast: number;
  isLowResolution: boolean;
  isBlurry: boolean;
  isTooDark: boolean;
  isTooBright: boolean;
  isLowContrast: boolean;
  issues: string[];
};

const MIN_SHORT_SIDE = 320;
const MIN_PIXELS = 180_000;
const MIN_BLUR_SCORE = 25;
const MIN_BRIGHTNESS = 32;
const MAX_BRIGHTNESS = 246;
const MIN_CONTRAST = 18;

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function calculateLaplacianVariance(
  pixels: Buffer,
  width: number,
  height: number,
): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let squaredSum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        4 * pixels[index] -
        pixels[index - 1] -
        pixels[index + 1] -
        pixels[index - width] -
        pixels[index + width];
      sum += laplacian;
      squaredSum += laplacian * laplacian;
      count += 1;
    }
  }

  if (!count) return 0;
  const mean = sum / count;
  return squaredSum / count - mean * mean;
}

export async function analyzeImageQuality(
  imageBuffer: Buffer,
): Promise<ImageQualityResult> {
  const image = sharp(imageBuffer, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.autoOrient?.width || metadata.width || 0;
  const height = metadata.autoOrient?.height || metadata.height || 0;

  if (!width || !height) {
    throw new Error("No se pudieron leer las dimensiones de la imagen.");
  }

  const { data, info } = await image
    .clone()
    .greyscale()
    .resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let pixelSum = 0;
  let squaredPixelSum = 0;
  for (const value of data) {
    pixelSum += value;
    squaredPixelSum += value * value;
  }

  const brightness = pixelSum / data.length;
  const contrast = Math.sqrt(
    Math.max(0, squaredPixelSum / data.length - brightness * brightness),
  );
  const blurScore = calculateLaplacianVariance(data, info.width, info.height);
  const pixelCount = width * height;
  const isLowResolution =
    Math.min(width, height) < MIN_SHORT_SIDE || pixelCount < MIN_PIXELS;
  const isBlurry = blurScore < MIN_BLUR_SCORE;
  const isTooDark = brightness < MIN_BRIGHTNESS;
  const isTooBright = brightness > MAX_BRIGHTNESS;
  const isLowContrast = contrast < MIN_CONTRAST;
  const issues: string[] = [];

  if (isLowResolution) issues.push("resolucion insuficiente");
  if (isBlurry) issues.push("imagen borrosa");
  if (isTooDark) issues.push("imagen demasiado oscura");
  if (isTooBright) issues.push("imagen sobreexpuesta");
  if (isLowContrast) issues.push("contraste insuficiente");

  return {
    width,
    height,
    megapixels: round(pixelCount / 1_000_000, 2),
    blurScore: round(blurScore),
    brightness: round(brightness),
    contrast: round(contrast),
    isLowResolution,
    isBlurry,
    isTooDark,
    isTooBright,
    isLowContrast,
    issues,
  };
}

export async function prepareImageForOcr(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer, { failOn: "error" })
    .rotate()
    .trim()
    .flatten({ background: "#ffffff" })
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .greyscale()
    .normalise()
    .sharpen({ sigma: 0.8 })
    .png()
    .toBuffer();
}
