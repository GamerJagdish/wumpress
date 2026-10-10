import { CompressionConfig } from './types';

export interface ImageCompressionOptions {
  file: File;
  config: CompressionConfig;
  onProgress: (percent: number, stage?: string) => void;
}

export async function compressImage({
  file,
  config,
  onProgress,
}: ImageCompressionOptions): Promise<{ blob: Blob; fileName: string }> {
  onProgress(10, 'Loading image into memory...');

  const targetBytes = config.targetSizeMB * 1024 * 1024 * config.safetyFactor;

  // Load image object
  const img = await loadImageFromFile(file);
  onProgress(25, 'Analyzing image dimensions and color depth...');

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // If already under target size and format is web-friendly, return original or optimize slightly
  if (file.size <= targetBytes && !file.type.includes('png') && file.size < 5 * 1024 * 1024) {
    onProgress(100, 'Image already fits within target size');
    return {
      blob: file,
      fileName: file.name,
    };
  }

  // Target output format: WebP offers best compression ratio for Discord previews
  const outputFormat =
    config.imageFormat === 'png'
      ? 'image/png'
      : config.imageFormat === 'jpeg'
      ? 'image/jpeg'
      : 'image/webp';

  const outputExtension =
    outputFormat === 'image/webp'
      ? 'webp'
      : outputFormat === 'image/jpeg'
      ? 'jpg'
      : 'png';

  onProgress(40, 'Scaling canvas buffer...');

  // If resolution is excessively high (e.g. > 4K), cap maximum dimension to save memory
  const maxInitialDimension = 4096;
  if (width > maxInitialDimension || height > maxInitialDimension) {
    const scale = maxInitialDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for image compression.');
  }

  // Draw image to canvas
  ctx.drawImage(img, 0, 0, width, height);

  onProgress(60, 'Optimizing quality quantization...');

  // Iterative compression loop: search for best quality under targetBytes
  let minQuality = 0.3;
  let maxQuality = 0.95;
  let bestBlob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = 6;

  while (attempts < maxAttempts) {
    attempts++;
    const quality = (minQuality + maxQuality) / 2;
    onProgress(
      60 + Math.round((attempts / maxAttempts) * 35),
      `Testing quality level ${Math.round(quality * 100)}%...`
    );

    const blob = await canvasToBlob(canvas, outputFormat, quality);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      // If close to target (within 85%), keep it
      if (blob.size >= targetBytes * 0.85) {
        break;
      }
      // Can try higher quality
      minQuality = quality;
    } else {
      // Too big, lower quality
      maxQuality = quality;
    }

    if (maxQuality - minQuality < 0.05) {
      break;
    }
  }

  // If still too large after quality search, scale down dimensions
  if (!bestBlob || bestBlob.size > targetBytes) {
    onProgress(90, 'Adjusting resolution to guarantee size limit...');
    let currentScale = 0.8;
    while ((!bestBlob || bestBlob.size > targetBytes) && currentScale > 0.2) {
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.round(width * currentScale);
      scaledCanvas.height = Math.round(height * currentScale);
      const scaledCtx = scaledCanvas.getContext('2d');
      if (scaledCtx) {
        scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
        bestBlob = await canvasToBlob(scaledCanvas, outputFormat, 0.75);
      }
      currentScale -= 0.15;
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlob(canvas, outputFormat, 0.5);
  }

  onProgress(100, 'Image compression complete');

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  return {
    blob: bestBlob,
    fileName: `${baseName}_wumpressed.${outputExtension}`,
  };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to parse image data: ' + err));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      },
      type,
      quality
    );
  });
}
