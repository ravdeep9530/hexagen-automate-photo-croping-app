'use client';

import { AiProcessingError, isAbortError, toBackgroundRemovalError } from './ai-errors';

export type BackgroundRemovalStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'failed';

export interface BackgroundRemovalAsset {
  blob: Blob;
  objectUrl: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface RemoveBackgroundInput {
  source: Blob | File;
  signal?: AbortSignal;
  onStatus?: (status: BackgroundRemovalStatus) => void;
  onProgress?: (progress: number) => void;
  createObjectUrl?: (blob: Blob) => string;
}

type ImglyModule = typeof import('@imgly/background-removal');
type RemoveBackgroundFn = (image: Blob | File, config?: { progress?: (key: string, current: number, total: number) => void }) => Promise<Blob>;
type ModuleLoader = () => Promise<ImglyModule>;

let modulePromise: Promise<ImglyModule> | null = null;
let moduleLoader: ModuleLoader = () => {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<ImglyModule>;
  return dynamicImport('@imgly/background-removal');
};

function assertClient(): void {
  if (typeof window === 'undefined') {
    throw new AiProcessingError(
      'client-only',
      'Background removal can only run in a browser.',
      'Background removal runs locally in your browser. Please use a supported browser and try again.',
    );
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Background removal aborted.', 'AbortError');
}

export function resetBackgroundRemovalLoaderForTests(): void {
  modulePromise = null;
  moduleLoader = () => {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<ImglyModule>;
    return dynamicImport('@imgly/background-removal');
  };
}

export function setBackgroundRemovalModuleLoaderForTests(loader: ModuleLoader): void {
  modulePromise = null;
  moduleLoader = loader;
}

export async function loadBackgroundRemovalModule(signal?: AbortSignal): Promise<ImglyModule> {
  assertClient();
  throwIfAborted(signal);

  modulePromise ??= moduleLoader().catch((error) => {
    modulePromise = null;
    throw new AiProcessingError(
      'library-load-failed',
      'Failed to load the background removal bundle.',
      'Background removal could not be loaded. Check your connection, then try again, or use original/white/solid background modes.',
      error,
    );
  });

  const mod = await modulePromise;
  throwIfAborted(signal);
  return mod;
}

function getRemoveBackground(mod: ImglyModule): RemoveBackgroundFn {
  const candidate = mod.removeBackground
    ?? (typeof mod.default === 'function' ? mod.default : undefined)
    ?? (typeof mod.default === 'object' ? mod.default.removeBackground : undefined);

  if (!candidate) {
    throw new AiProcessingError(
      'library-load-failed',
      'The background removal bundle did not expose a processor.',
      'Background removal is unavailable in this browser. Please continue with original, white, or solid background modes.',
    );
  }

  return candidate as RemoveBackgroundFn;
}

export async function removeImageBackground(input: RemoveBackgroundInput): Promise<BackgroundRemovalAsset> {
  const createObjectUrl = input.createObjectUrl ?? URL.createObjectURL.bind(URL);

  try {
    input.onStatus?.('loading');
    const mod = await loadBackgroundRemovalModule(input.signal);
    const removeBackground = getRemoveBackground(mod);

    throwIfAborted(input.signal);
    input.onStatus?.('processing');
    const processedBlob = await removeBackground(input.source, {
      progress: (_key, current, total) => {
        if (total > 0) input.onProgress?.(Math.max(0, Math.min(1, current / total)));
      },
    });

    throwIfAborted(input.signal);
    const objectUrl = createObjectUrl(processedBlob);
    throwIfAborted(input.signal);
    input.onStatus?.('complete');

    return { blob: processedBlob, objectUrl, createdAt: new Date().toISOString() };
  } catch (error) {
    if (isAbortError(error) || input.signal?.aborted) {
      throw new AiProcessingError(
        'cancelled',
        'Background removal was cancelled.',
        'Background removal was cancelled because a newer edit was requested.',
        error,
      );
    }
    throw toBackgroundRemovalError(error);
  }
}
