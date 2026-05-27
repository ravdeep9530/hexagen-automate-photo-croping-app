import type { PreviewProcessingSettings } from './canvas-types';

export interface ImageAdjustmentValues {
  brightness: number;
  contrast: number;
  grayscale: boolean;
}

export function clampAdjustment(value: number, min = -1, max = 1): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

export function getImageAdjustmentValues(settings: PreviewProcessingSettings): ImageAdjustmentValues {
  return {
    brightness: clampAdjustment(settings.brightness),
    contrast: clampAdjustment(settings.contrast),
    grayscale: Boolean(settings.grayscale),
  };
}

export function buildCanvasFilter(settings: PreviewProcessingSettings): string {
  const { brightness, contrast, grayscale } = getImageAdjustmentValues(settings);
  const filters = [
    `brightness(${Math.round((1 + brightness) * 1000) / 10}%)`,
    `contrast(${Math.round((1 + contrast) * 1000) / 10}%)`,
  ];
  if (grayscale) filters.push('grayscale(100%)');
  return filters.join(' ');
}

export function applyImageAdjustments(ctx: CanvasRenderingContext2D, settings: PreviewProcessingSettings): void {
  ctx.filter = buildCanvasFilter(settings);
}

export function resetImageAdjustments(ctx: CanvasRenderingContext2D): void {
  ctx.filter = 'none';
}

export function adjustChannel(value: number, brightness: number, contrast: number): number {
  const brightened = value + clampAdjustment(brightness) * 255;
  const factor = 1 + clampAdjustment(contrast);
  return Math.max(0, Math.min(255, (brightened - 128) * factor + 128));
}
