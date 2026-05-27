import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearFaceDetectionCache, setFaceDetectionProviderForTests, type FaceDetectionProvider } from '../../ai/face-detection';
import { useFaceDetection } from '../use-face-detection';

describe('useFaceDetection', () => {
  const provider: FaceDetectionProvider = { detect: vi.fn() };

  beforeEach(() => {
    clearFaceDetectionCache();
    vi.mocked(provider.detect).mockReset();
    setFaceDetectionProviderForTests(provider);
  });

  it('does not lazy-load or detect when disabled', async () => {
    renderHook(() => useFaceDetection({ enabled: false, source: 'blob:image' }));

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(provider.detect).not.toHaveBeenCalled();
  });

  it('detects a face and exposes generated guidance', async () => {
    vi.mocked(provider.detect).mockResolvedValue([
      {
        boundingBox: { x: 100, y: 120, width: 180, height: 240 },
        eyes: { left: { x: 150, y: 210 }, right: { x: 230, y: 210 } },
        confidence: 0.9,
      },
    ]);
    const onDetected = vi.fn();

    const { result } = renderHook(() => useFaceDetection({
      enabled: true,
      source: 'blob:image',
      frameSize: { width: 400, height: 500 },
      onDetected,
    }));

    await waitFor(() => expect(result.current.state.status).toBe('detected'));

    expect(provider.detect).toHaveBeenCalledTimes(1);
    expect(result.current.state.result?.status).toBe('detected');
    expect(result.current.state.guidance.map(g => g.code)).toContain('face-detected');
    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it('reports not-detected results', async () => {
    vi.mocked(provider.detect).mockResolvedValue([]);
    const onNotDetected = vi.fn();

    const { result } = renderHook(() => useFaceDetection({ enabled: true, source: 'blob:image', onNotDetected }));

    await waitFor(() => expect(result.current.state.status).toBe('not-detected'));

    expect(result.current.state.result?.faceCount).toBe(0);
    expect(result.current.state.guidance[0].code).toBe('face-missing');
    expect(onNotDetected).toHaveBeenCalledTimes(1);
  });

  it('reports failed results and calls onError', async () => {
    setFaceDetectionProviderForTests(async () => {
      throw new Error('unsupported');
    });
    const onError = vi.fn();

    const { result } = renderHook(() => useFaceDetection({ enabled: true, source: 'blob:image', onError }));

    await waitFor(() => expect(result.current.state.status).toBe('failed'));

    expect(result.current.state.error).toBe('unsupported');
    expect(onError).toHaveBeenCalledWith('unsupported', expect.objectContaining({ status: 'failed' }));
  });

  it('supports manual detection and cancellation', async () => {
    vi.mocked(provider.detect).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    const { result } = renderHook(() => useFaceDetection({ enabled: false, source: 'blob:image' }));

    act(() => {
      void result.current.detect();
    });
    await waitFor(() => expect(result.current.state.status).toBe('loading'));

    act(() => result.current.cancel());

    expect(result.current.state.status).toBe('cancelled');
  });
});
