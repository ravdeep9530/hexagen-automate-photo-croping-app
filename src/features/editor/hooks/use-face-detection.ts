/**
 * useFaceDetection Hook
 *
 * React hook for client-only, lazy face detection with optional overlays.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceDetectionResult, FaceGuidanceMessage, HeadPositionRule } from '../ai/face-detection';
import { detectFace, clearFaceDetectionCache, generateFaceGuidance } from '../ai/face-detection';

export type FaceDetectionHookStatus = 'idle' | 'loading' | 'detected' | 'not-detected' | 'failed' | 'cancelled';

export interface FaceDetectionState {
  status: FaceDetectionHookStatus;
  result: FaceDetectionResult | null;
  guidance: FaceGuidanceMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface UseFaceDetectionOptions {
  /** Whether face detection is enabled. When false, nothing loads or runs. */
  enabled?: boolean;
  /** Source image to detect faces in */
  source?: HTMLImageElement | HTMLCanvasElement | ImageBitmap | Blob | File | string | null;
  /** Optional frame size (crop/output size) for guidance calculations */
  frameSize?: { width: number; height: number } | null;
  /** Optional head position rule to guide against */
  headPositionRule?: HeadPositionRule;
  /** Called when detection completes */
  onDetected?: (result: FaceDetectionResult) => void;
  /** Called when no face detected */
  onNotDetected?: (result: FaceDetectionResult) => void;
  /** Called when detection fails */
  onError?: (error: string, result: FaceDetectionResult) => void;
}

export interface UseFaceDetectionReturn {
  state: FaceDetectionState;
  /** Manually trigger face detection */
  detect: () => Promise<void>;
  /** Cancel ongoing detection */
  cancel: () => void;
  /** Clear state and any cached provider */
  reset: () => void;
  /** Clear provider cache (useful for memory reduction) */
  clearProviderCache: () => void;
}

export function createInitialFaceDetectionState(): FaceDetectionState {
  return {
    status: 'idle',
    result: null,
    guidance: [],
    isLoading: false,
    error: null,
  };
}

/**
 * React hook for managing lazy face detection with optional guidance overlays.
 */
export function useFaceDetection(options: UseFaceDetectionOptions = {}): UseFaceDetectionReturn {
  const { enabled = true, source, headPositionRule, frameSize, onDetected, onNotDetected, onError } = options;

  const [state, setState] = useState<FaceDetectionState>(createInitialFaceDetectionState());
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastSourceRef = useRef<unknown>(undefined);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Cancel ongoing detection.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        status: 'cancelled',
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Reset state to idle and clean up.
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(createInitialFaceDetectionState());
   }, []);

  /**
   * Clear provider cache to free memory.
   */
  const clearProviderCache = useCallback(() => {
    clearFaceDetectionCache();
  }, []);

  /**
   * Perform face detection.
   */
  const detect = useCallback(async () => {
    if (source === lastSourceRef.current && state.status !== 'idle' && !state.isLoading) return;
    lastSourceRef.current = source;

    // Cancel any existing detection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (!isMountedRef.current || abortController.signal.aborted) return;

    setState({
      ...createInitialFaceDetectionState(),
      status: 'loading',
      isLoading: true,
    });

    try {
      const result = await detectFace(source, { signal: abortController.signal });
      if (!isMountedRef.current || abortController.signal.aborted) return;

      const guidance = generateFaceGuidance(result, frameSize ?? undefined, headPositionRule);

      let hookStatus: FaceDetectionHookStatus;
      if (result.status === 'detected' || result.status === 'landmark-unavailable') {
        hookStatus = result.status === 'detected' ? 'detected' : 'detected';
      } else if (result.status === 'not-detected') {
        hookStatus = 'not-detected';
      } else if (result.status === 'failed') {
        hookStatus = 'failed';
      } else {
        hookStatus = 'idle';
      }

      setState({
        status: hookStatus,
        result,
        guidance,
        isLoading: false,
        error: result.error ?? null,
      });

      if (result.status === 'detected' || result.status === 'landmark-unavailable') {
        onDetected?.(result);
      } else if (result.status === 'not-detected') {
        onNotDetected?.(result);
      }

      if (result.status === 'failed' && result.error) {
        onError?.(result.error, result);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Face detection failed.';
      const failedResult: FaceDetectionResult = {
        status: 'failed',
        faceCount: 0,
        faces: [],
        reason: 'processing-failed',
        error: message,
        guidance: [{ code: 'processing-failed', severity: 'warning', message }],
      };
      setState({
        status: 'failed',
        result: failedResult,
        guidance: failedResult.guidance,
        isLoading: false,
        error: message,
      });
      onError?.(message, failedResult);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [source, headPositionRule, frameSize, onDetected, onNotDetected, onError, state.status]);

  // Auto-detect when source changes and detection is enabled
  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }
    if (!source) {
      setState(createInitialFaceDetectionState());
      return;
    }
    // Debounced auto-detect to avoid rapid re-renders
    const id = setTimeout(() => {
      void detect();
    }, 50);
    return () => clearTimeout(id);
  }, [enabled, source, detect, reset]);

  return { state, detect, cancel, reset, clearProviderCache };
}

export default useFaceDetection;
