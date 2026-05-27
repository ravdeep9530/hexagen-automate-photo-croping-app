import type { PreviewProcessingSettings } from './canvas-types';

export interface ForegroundCompositeSource {
  image: CanvasImageSource;
  width: number;
  height: number;
}

export function getBackgroundFillStyle(settings: PreviewProcessingSettings): string | undefined {
  const background = settings.background;
  if (!background || background.mode === 'original') return undefined;

  if (background.mode === 'white') return '#ffffff';

  if (background.mode === 'solid') {
    return background.color ?? '#ffffff';
  }

  if (background.mode === 'replace' || background.mode === 'remove') {
    return background.color ?? '#ffffff';
  }

  return undefined;
}

export function compositeBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: PreviewProcessingSettings,
): void {
  const fill = getBackgroundFillStyle(settings);
  if (!fill) return;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function compositeForegroundOverBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: PreviewProcessingSettings,
  foreground?: ForegroundCompositeSource,
): boolean {
  compositeBackground(ctx, width, height, settings);
  if (!foreground) return false;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(foreground.image, 0, 0, foreground.width, foreground.height, 0, 0, width, height);
  ctx.restore();
  return true;
}
