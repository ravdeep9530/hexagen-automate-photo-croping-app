import { useEffect, useMemo, useState } from 'react';

import type { PhotoStatusResponse } from '../types/api';

type UsePhotoStatusOptions = {
  pollIntervalMs?: number;
};

type UsePhotoStatusResult = PhotoStatusResponse & {
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
};

const DEFAULT_POLL_INTERVAL_MS = 5000;

const emptyStatus: PhotoStatusResponse = {
  sessionId: '',
  hasUploaded: false,
  hasCropped: false,
  uploadedPhotoUrl: null,
  croppedPhotoUrl: null,
  complianceStatus: 'missing_upload',
};

export function usePhotoStatus(
  sessionId: string | null | undefined,
  options: UsePhotoStatusOptions = {},
): UsePhotoStatusResult {
  const normalizedSessionId = sessionId?.trim() ?? '';
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const [status, setStatus] = useState<PhotoStatusResponse>({
    ...emptyStatus,
    sessionId: normalizedSessionId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedSessionId) {
      setStatus({ ...emptyStatus, sessionId: '' });
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadStatus = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/photoStatus?sessionId=${encodeURIComponent(normalizedSessionId)}`);
        const payload = (await response.json()) as PhotoStatusResponse | { message?: string };

        if (!response.ok) {
          throw new Error(
            'message' in payload && typeof payload.message === 'string'
              ? payload.message
              : 'Unable to fetch photo status',
          );
        }

        if (isMounted) {
          setStatus(payload as PhotoStatusResponse);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to fetch photo status');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStatus();

    const intervalId = window.setInterval(() => {
      void loadStatus();
    }, pollIntervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [normalizedSessionId, pollIntervalMs]);

  return useMemo(
    () => ({
      ...status,
      isLoading,
      error,
      isActive: Boolean(normalizedSessionId),
    }),
    [error, isLoading, normalizedSessionId, status],
  );
}
