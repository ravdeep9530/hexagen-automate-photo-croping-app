import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearFaceDetectionCache,
  createFaceDetectionResult,
  detectFace,
  generateFaceGuidance,
  isFaceDetectionProviderLoaded,
  setFaceDetectionProviderForTests,
  type FaceDetectionProvider,
} from '../face-detection';

describe('face detection service', () => {
  const provider: FaceDetectionProvider = { detect: vi.fn() };

  beforeEach(() => {
    clearFaceDetectionCache();
    vi.mocked(provider.detect).mockReset();
    setFaceDetectionProviderForTests(provider);
  });

  it('lazy-loads provider only when detection is requested', async () => {
    expect(isFaceDetectionProviderLoaded()).toBe(false);
    vi.mocked(provider.detect).mockResolvedValue([]);

    await detectFace(new Blob(['image'], { type: 'image/png' }));

    expect(isFaceDetectionProviderLoaded()).toBe(true);
    expect(provider.detect).toHaveBeenCalledTimes(1);
  });

  it('returns detected status with bounding box, eyes, confidence, and guidance', async () => {
    vi.mocked(provider.detect).mockResolvedValue([
      {
        boundingBox: { x: 120, y: 90, width: 160, height: 220 },
        eyes: { left: { x: 165, y: 170 }, right: { x: 235, y: 170 } },
        landmarks: { nose: { x: 200, y: 210 } },
        confidence: 0.93,
      },
    ]);

    const result = await detectFace('blob:local-image');

    expect(result).toMatchObject({
      status: 'detected',
      faceCount: 1,
      boundingBox: { x: 120, y: 90, width: 160, height: 220 },
      eyes: { left: { x: 165, y: 170 }, right: { x: 235, y: 170 } },
      confidence: 0.93,
    });
    expect(result.guidance.some(message => message.code === 'face-detected')).toBe(true);
  });

  it('handles no face and multiple face paths as not-detected guidance', () => {
    expect(createFaceDetectionResult([])).toMatchObject({
      status: 'not-detected',
      faceCount: 0,
      guidance: [{ code: 'face-missing' }],
    });

    const multiple = createFaceDetectionResult([
      { boundingBox: { x: 0, y: 0, width: 50, height: 50 } },
      { boundingBox: { x: 80, y: 0, width: 50, height: 50 } },
    ]);

    expect(multiple).toMatchObject({
      status: 'not-detected',
      faceCount: 2,
      guidance: [{ code: 'multiple-faces' }],
    });
  });

  it('handles provider load failures gracefully', async () => {
    setFaceDetectionProviderForTests(async () => {
      throw new Error('model unavailable');
    });

    const result = await detectFace(new Blob(['image']));

    expect(result).toMatchObject({
      status: 'failed',
      faceCount: 0,
      reason: 'model-load-failed',
      error: 'model unavailable',
    });
    expect(result.guidance[0].message).toContain('model unavailable');
  });

  it('generates positioning guidance from detected face and eye landmarks', () => {
    const result = createFaceDetectionResult([
      {
        boundingBox: { x: 5, y: 20, width: 70, height: 80 },
        eyes: { left: { x: 20, y: 40 }, right: { x: 60, y: 55 } },
      },
    ]);

    const guidance = generateFaceGuidance(result, { width: 400, height: 500 });

    expect(guidance.map(g => g.code)).toEqual(expect.arrayContaining(['move-right', 'face-too-small', 'eyes-not-level']));
  });
});
