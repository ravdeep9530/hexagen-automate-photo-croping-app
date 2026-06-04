'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { PhotoStatusDto } from '../lib/photo-status';

type PhotoStatusResponse = PhotoStatusDto & {
  sessionId: string;
  error?: string;
};

export interface UsePhotoStatusResult {
  loading: boolean;
  error: string | null;
  status: 'idle' | 'uploaded' | 'cropped';
  uploadedPhotoUrl: string | null;
  croppedPhotoUrl: string | null;
  complianceStatus: string | null;
  hasUploaded: boolean;
  hasCropped: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_STATE: Omit<UsePhotoStatusResult, 'refresh'> = {
  loading: true,
  error: null,
  status: 'idle',
  uploadedPhotoUrl: null,
  croppedPhotoUrl: null,
  complianceStatus: null,
  hasUploaded: false,
  hasCropped: false,
};

function deriveStatus(payload: Pick<PhotoStatusDto, 'hasUploaded' | 'hasCropped'>): UsePhotoStatusResult['status'] {
  if (payload.hasCropped) {
    return 'cropped';
  }

  if (payload.hasUploaded) {
    return 'uploaded';
  }

  return 'idle';
}

export function usePhotoStatus(sessionId: string, pollIntervalMs = 5000): UsePhotoStatusResult {
  const [state, setState] = useState<Omit<UsePhotoStatusResult, 'refresh'>>(DEFAULT_STATE);

  const fetchStatus = useCallback(async () => {
    const normalizedSessionId = sessionId.trim();

    if (!normalizedSessionId) {
      setState({
        ...DEFAULT_STATE,
        loading: false,
        error: 'Session ID is required',
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch(`/api/photoStatus?sessionId=${encodeURIComponent(normalizedSessionId)}`);
      const data = (await response.json()) as PhotoStatusResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch photo status');
      }

      setState({
        loading: false,
        error: null,
        status: deriveStatus(data),
        uploadedPhotoUrl: data.uploadedPhotoUrl,
        croppedPhotoUrl: data.croppedPhotoUrl,
        complianceStatus: data.complianceStatus,
        hasUploaded: data.hasUploaded,
        hasCropped: data.hasCropped,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to fetch photo status',
      }));
    }
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const run = async () => {
      if (!isMounted) {
        return;
      }

      await fetchStatus();
    };

    void run();

    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        void run();
      }, pollIntervalMs);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchStatus, pollIntervalMs]);

  return useMemo(
    () => ({
      ...state,
      refresh: fetchStatus,
    }),
    [fetchStatus, state],
  );
}

export default usePhotoStatus;
