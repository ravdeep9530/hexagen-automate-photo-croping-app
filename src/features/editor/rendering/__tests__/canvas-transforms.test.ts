import { describe, expect, it } from 'vitest';
import { calculateDrawTransform, calculatePreviewDimensions, normalizeRotationDegrees, validateCrop } from '../canvas-transforms';

const crop = {
  x: 100,
  y: 50,
  width: 200,
  height: 250,
  rotation: 90,
  scale: 1.5,
  panX: 10,
  panY: -5,
};

describe('canvas transforms', () => {
  it('downscales preset dimensions to the preview pixel budget', () => {
    const { dimensions, issues } = calculatePreviewDimensions({ width: 1000, height: 1000 }, 250_000);

    expect(dimensions).toMatchObject({ width: 500, height: 500, requestedWidth: 1000, requestedHeight: 1000 });
    expect(dimensions.scale).toBeCloseTo(0.5);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('memory-budget-exceeded');
  });

  it('keeps dimensions unchanged when within budget', () => {
    const { dimensions, issues } = calculatePreviewDimensions({ width: 300, height: 400 }, 500_000);

    expect(dimensions.width).toBe(300);
    expect(dimensions.height).toBe(400);
    expect(dimensions.scale).toBe(1);
    expect(issues).toEqual([]);
  });

  it('calculates deterministic crop, pan, zoom, and rotation transform values', () => {
    const transform = calculateDrawTransform(800, 600, crop, { width: 400, height: 500 });

    expect(transform.cropCenterX).toBe(210);
    expect(transform.cropCenterY).toBe(170);
    expect(transform.destinationCenterX).toBe(200);
    expect(transform.destinationCenterY).toBe(250);
    expect(transform.outputScaleX).toBe(2);
    expect(transform.outputScaleY).toBe(2);
    expect(transform.zoom).toBe(1.5);
    expect(transform.rotationRadians).toBeCloseTo(Math.PI / 2);
    expect(transform.drawX).toBe(-210);
    expect(transform.drawY).toBe(-170);
  });

  it('normalizes rotation into the canvas positive degree range', () => {
    expect(normalizeRotationDegrees(-90)).toBe(270);
    expect(normalizeRotationDegrees(450)).toBe(90);
  });

  it('warns when crop aspect ratio does not match the requested aspect ratio', () => {
    const issues = validateCrop({ ...crop, aspectRatio: 1 });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'invalid-crop', severity: 'warning' });
  });
});
