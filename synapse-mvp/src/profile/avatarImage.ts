export const MAX_AVATAR_BYTES = 400_000;
const MIN_EDGE = 32;
const START_EDGE = 1600;

export interface AvatarEncodePlan {
  width: number;
  height: number;
  quality: number;
}

export function initialAvatarPlan(
  width: number,
  height: number
): AvatarEncodePlan {
  const longest = Math.max(width, height, 1);
  const scale = Math.min(1, START_EDGE / longest);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    quality: 0.9,
  };
}

export function tightenAvatarPlan(
  plan: AvatarEncodePlan
): AvatarEncodePlan | null {
  if (plan.quality > 0.52) {
    return {
      ...plan,
      quality: Math.max(0.52, Number((plan.quality - 0.12).toFixed(2))),
    };
  }
  const width = Math.max(MIN_EDGE, Math.round(plan.width * 0.8));
  const height = Math.max(MIN_EDGE, Math.round(plan.height * 0.8));
  if (width === plan.width && height === plan.height) return null;
  return { width, height, quality: 0.82 };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        reject(new Error('Could not read that image.'));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp && webp.size > 0) return webp;
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality);
  if (jpeg && jpeg.size > 0) return jpeg;
  throw new Error('Could not encode that image.');
}

function drawAvatar(
  source: CanvasImageSource,
  plan: AvatarEncodePlan
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw that image.');
  ctx.fillStyle = '#0c0e14';
  ctx.fillRect(0, 0, plan.width, plan.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, plan.width, plan.height);
  return canvas;
}

async function compressBitmap(
  source: ImageBitmap,
  maxBytes: number
): Promise<string> {
  let plan = initialAvatarPlan(source.width, source.height);
  for (let i = 0; i < 36; i += 1) {
    const canvas = drawAvatar(source, plan);
    const blob = await encodeCanvas(canvas, plan.quality);
    if (blob.size <= maxBytes) return blobToDataUrl(blob);
    const next = tightenAvatarPlan(plan);
    if (!next) break;
    plan = next;
  }
  throw new Error('Could not shrink that image enough.');
}

export function clampPan(
  pan: number,
  displayed: number,
  viewport: number
): number {
  const max = Math.max(0, (displayed - viewport) / 2);
  return Math.min(max, Math.max(-max, pan));
}

export function coverScale(
  naturalWidth: number,
  naturalHeight: number,
  viewport: number
): number {
  return Math.max(
    viewport / Math.max(naturalWidth, 1),
    viewport / Math.max(naturalHeight, 1)
  );
}

export function cropFromViewport({
  naturalWidth,
  naturalHeight,
  viewport,
  zoom,
  panX,
  panY,
}: {
  naturalWidth: number;
  naturalHeight: number;
  viewport: number;
  zoom: number;
  panX: number;
  panY: number;
}): { x: number; y: number; size: number } {
  const scale = coverScale(naturalWidth, naturalHeight, viewport) * Math.max(zoom, 1);
  const displayedW = naturalWidth * scale;
  const displayedH = naturalHeight * scale;
  const left = (viewport - displayedW) / 2 + panX;
  const top = (viewport - displayedH) / 2 + panY;
  const size = Math.min(viewport / scale, naturalWidth, naturalHeight);
  const x = Math.min(
    Math.max(0, -left / scale),
    Math.max(0, naturalWidth - size)
  );
  const y = Math.min(
    Math.max(0, -top / scale),
    Math.max(0, naturalHeight - size)
  );
  return { x, y, size };
}

export async function cropAndFitAvatar(
  source: CanvasImageSource,
  crop: { x: number; y: number; size: number },
  maxBytes = MAX_AVATAR_BYTES
): Promise<string> {
  const size = Math.max(1, Math.round(crop.size));
  const x = Math.max(0, Math.round(crop.x));
  const y = Math.max(0, Math.round(crop.y));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not crop that image.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, x, y, size, size, 0, 0, size, size);
  const bitmap = await createImageBitmap(canvas);
  try {
    return await compressBitmap(bitmap, maxBytes);
  } finally {
    bitmap.close();
  }
}

export async function fitAvatarFile(
  file: File,
  maxBytes = MAX_AVATAR_BYTES
): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Choose an image file.');
  }
  if (file.size <= maxBytes) return blobToDataUrl(file);

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    return await compressBitmap(bitmap, maxBytes);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Could not')) {
      throw error;
    }
    throw new Error('Could not read that image.');
  } finally {
    bitmap?.close();
  }
}
