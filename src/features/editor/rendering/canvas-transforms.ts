import type { PreviewCropState, PresetDimensions, PreviewValidationIssue } from './canvas-types';

export interface RenderDimensions extends PresetDimensions {
  scale: number;
  requestedWidth: number;
  requestedHeight: number;
}

export interface DrawTransform {
  cropCenterX: number;
  cropCenterY: number;
  destinationCenterX: number;
  destinationCenterY: number;
  outputScaleX: number;
  outputScaleY: number;
  zoom: number;
  rotationRadians: number;
  panX: number;
  panY: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
}

export function calculatePreviewDimensions(
  presetDimensions: PresetDimensions,
  maxPreviewPixels: number,
): { dimensions: RenderDimensions; issues: PreviewValidationIssue[] } {
  const issues: PreviewValidationIssue[] = [];
  const requestedWidth = Math.round(presetDimensions.width);
  const requestedHeight = Math.round(presetDimensions.height);

  if (requestedWidth <= 0 || requestedHeight <= 0 || !Number.isFinite(requestedWidth) || !Number.isFinite(requestedHeight)) {
    issues.push({
      code: 'invalid-dimensions',
      message: 'Preset dimensions must be finite positive numbers.',
      severity: 'error',
      details: { presetDimensions },
    });
    return { dimensions: { width: 1, height: 1, scale: 1, requestedWidth, requestedHeight }, issues };
  }

  const requestedPixels = requestedWidth * requestedHeight;
  if (maxPreviewPixels <= 0 || !Number.isFinite(maxPreviewPixels)) {
    issues.push({
      code: 'memory-budget-exceeded',
      message: 'Preview pixel budget must be a positive number.',
      severity: 'error',
      details: { maxPreviewPixels },
    });
    return { dimensions: { width: 1, height: 1, scale: 1 / Math.max(requestedWidth, requestedHeight), requestedWidth, requestedHeight }, issues };
  }

  const scale = requestedPixels > maxPreviewPixels ? Math.sqrt(maxPreviewPixels / requestedPixels) : 1;
  const width = Math.max(1, Math.floor(requestedWidth * scale));
  const height = Math.max(1, Math.floor(requestedHeight * scale));

  if (requestedPixels > maxPreviewPixels) {
    issues.push({
      code: 'memory-budget-exceeded',
      message: 'Preview was downscaled to stay within the browser memory budget.',
      severity: 'warning',
      details: { requestedPixels, maxPreviewPixels, width, height },
    });
  }

  return { dimensions: { width, height, scale, requestedWidth, requestedHeight }, issues };
}

export function normalizeRotationDegrees(rotation: number): number {
  if (!Number.isFinite(rotation)) return 0;
  return ((rotation % 360) + 360) % 360;
}

export function validateCrop(crop: PreviewCropState): PreviewValidationIssue[] {
  const issues: PreviewValidationIssue[] = [];
  if (!Number.isFinite(crop.x) || !Number.isFinite(crop.y) || crop.width <= 0 || crop.height <= 0) {
    issues.push({
      code: 'invalid-crop',
      message: 'Crop rectangle must have finite coordinates and positive dimensions.',
      severity: 'error',
      details: { crop },
    });
  }

  if (crop.aspectRatio !== undefined) {
    const actual = crop.width / crop.height;
    if (Number.isFinite(actual) && Math.abs(actual - crop.aspectRatio) > 0.01) {
      issues.push({
        code: 'invalid-crop',
        message: 'Crop rectangle does not match the requested aspect ratio.',
        severity: 'warning',
        details: { actualAspectRatio: actual, expectedAspectRatio: crop.aspectRatio },
      });
    }
  }

  return issues;
}

export function calculateDrawTransform(
  imageWidth: number,
  imageHeight: number,
  crop: PreviewCropState,
  output: PresetDimensions,
): DrawTransform {
  const zoom = crop.scale > 0 && Number.isFinite(crop.scale) ? crop.scale : 1;
  const panX = Number.isFinite(crop.panX ?? 0) ? crop.panX ?? 0 : 0;
  const panY = Number.isFinite(crop.panY ?? 0) ? crop.panY ?? 0 : 0;
  const cropCenterX = crop.x + crop.width / 2 + panX;
  const cropCenterY = crop.y + crop.height / 2 + panY;
  const outputScaleX = output.width / crop.width;
  const outputScaleY = output.height / crop.height;
  const destinationCenterX = output.width / 2;
  const destinationCenterY = output.height / 2;

  return {
    cropCenterX,
    cropCenterY,
    destinationCenterX,
    destinationCenterY,
    outputScaleX,
    outputScaleY,
    zoom,
    rotationRadians: (normalizeRotationDegrees(crop.rotation ?? 0) * Math.PI) / 180,
    panX,
    panY,
    drawX: -cropCenterX,
    drawY: -cropCenterY,
    drawWidth: imageWidth,
    drawHeight: imageHeight,
  };
}

export function applyCanvasTransform(ctx: CanvasRenderingContext2D, transform: DrawTransform): void {
  ctx.translate(transform.destinationCenterX, transform.destinationCenterY);
  ctx.scale(transform.outputScaleX * transform.zoom, transform.outputScaleY * transform.zoom);
  ctx.rotate(transform.rotationRadians);
  ctx.translate(transform.drawX, transform.drawY);
}
