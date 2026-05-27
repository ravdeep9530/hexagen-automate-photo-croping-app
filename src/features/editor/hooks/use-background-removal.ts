'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { backgroundRemovalFallbackMessage } from '../ai/ai-errors';
import { type BackgroundRemovalAsset, type BackgroundRemovalStatus, removeImageBackground } from '../ai/background-removal';
import { useEditorStore } from '../store/editor-store';

interface UseBackgroundRemovalResult {
  status: BackgroundRemovalStatus;
  progress: number;
  asset: BackgroundRemovalAsset | null;
  errorMessage: string | null;
  cancel: () => void;
  retry: () => void;
}

async function sourceFromAsset(asset: ReturnType<typeof useEditorStore.getState>['asset'], file?: File, signal?: AbortSignal): Promise<Blob | File | null> {
  if (file) return file;
  if (!asset?.blobUrl) return null;
  const response = await fetch(asset.blobUrl, { signal });
  return response.blob();
}

export function useBackgroundRemoval(): UseBackgroundRemovalResult {
  const imageAsset = useEditorStore((state) => state.asset);
  const originalFile = useEditorStore((state) => state.runtime.originalFile);
  const backgroundMode = useEditorStore((state) => state.processingSettings.background.mode);
  const [status, setStatus] = useState<BackgroundRemovalStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [removedAsset, setRemovedAsset] = useState<BackgroundRemovalAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const revokeCurrentUrl = useCallback(() => {
    if (objectUrlRef.current && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestIdRef.current += 1;
    setStatus('idle');
    setProgress(0);
  }, []);

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (backgroundMode !== 'remove') {
      controllerRef.current?.abort();
      controllerRef.current = null;
      setStatus('idle');
      setProgress(0);
      setErrorMessage(null);
      return;
    }

    if (!imageAsset) {
      setStatus('failed');
      setErrorMessage('Upload a photo before using background removal. Original, white, and solid background modes are still available.');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setProgress(0);
    setErrorMessage(null);

    void (async () => {
      try {
        const source = await sourceFromAsset(imageAsset, originalFile, controller.signal);
        if (!source) throw new Error('No local image source is available for background removal.');
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;

        const nextAsset = await removeImageBackground({
          source,
          signal: controller.signal,
          onStatus: (nextStatus) => {
            if (requestIdRef.current === requestId) setStatus(nextStatus);
          },
          onProgress: (nextProgress) => {
            if (requestIdRef.current === requestId) setProgress(nextProgress);
          },
        });

        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(nextAsset.objectUrl);
          return;
        }

        revokeCurrentUrl();
        objectUrlRef.current = nextAsset.objectUrl;
        setRemovedAsset(nextAsset);
        setStatus('complete');
        setProgress(1);
      } catch (error) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;
        setStatus('failed');
        setErrorMessage(backgroundRemovalFallbackMessage(error));
      }
    })();

    return () => {
      controller.abort();
    };
  }, [backgroundMode, imageAsset, originalFile, retryToken, revokeCurrentUrl]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    revokeCurrentUrl();
  }, [revokeCurrentUrl]);

  return { status, progress, asset: removedAsset, errorMessage, cancel, retry };
}

export default useBackgroundRemoval;
