'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import type { ImageAsset, ImageMetadata } from '@/domain';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/features/editor/store/editor-store';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

type AcceptedMime = (typeof ACCEPTED_TYPES)[number];

export interface UploadDropzoneProps {
  onUploadComplete?: (asset: ImageAsset) => void;
  onUploadError?: (message: string) => void;
}

function formatFromType(type: string): ImageMetadata['format'] {
  if (type === 'image/jpeg') return 'jpeg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'unknown';
}

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as AcceptedMime)) {
    return 'Use a JPG, PNG, or WebP image.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Choose an image smaller than 15 MB.';
  }
  return null;
}

async function readImageMetadata(file: File): Promise<ImageMetadata> {
  const fallback = {
    width: 1,
    height: 1,
  };

  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    if (typeof Image === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      resolve(fallback);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width || fallback.width;
      const height = image.naturalHeight || image.height || fallback.height;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(fallback);
    };
    image.src = objectUrl;
  });

  return {
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: dimensions.width / dimensions.height,
    format: formatFromType(file.type),
    colorMode: 'unknown',
    hasAlpha: file.type === 'image/png' || file.type === 'image/webp',
    fileSizeBytes: file.size,
  };
}

function createAssetId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `asset-${Date.now()}`;
}

export function UploadDropzone({ onUploadComplete, onUploadError }: UploadDropzoneProps): React.JSX.Element {
  const setAsset = useEditorStore((state) => state.setAsset);
  const setIsAssetLoading = useEditorStore((state) => state.setIsAssetLoading);
  const isLoading = useEditorStore((state) => state.runtime.isAssetLoading);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = React.useCallback(async (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    setError(null);
    setIsAssetLoading(true);
    try {
      const metadata = await readImageMetadata(file);
      const asset: ImageAsset = {
        id: createAssetId(),
        name: file.name,
        file,
        metadata,
        status: 'valid',
        uploadedAt: new Date().toISOString(),
      };
      setAsset(asset, file);
      onUploadComplete?.(asset);
    } catch {
      const message = 'We could not read this image. Try another local photo.';
      setError(message);
      onUploadError?.(message);
    } finally {
      setIsAssetLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onUploadComplete, onUploadError, setAsset, setIsAssetLoading]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-xl border-2 border-dashed bg-card p-6 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/60'
        )}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div aria-hidden="true" className="rounded-full bg-primary/10 px-4 py-3 text-2xl">📷</div>
          <div>
            <h2 className="text-lg font-semibold">Upload your photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag and drop a local image, or use the file picker. JPG, PNG, and WebP up to 15 MB are supported.
            </p>
          </div>
          <input
            ref={inputRef}
            aria-label="Choose a local image"
            className="sr-only"
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={(event) => { if (event.currentTarget.files) void handleFiles(event.currentTarget.files); }}
          />
          <Button type="button" disabled={isLoading} onClick={() => inputRef.current?.click()}>
            {isLoading ? 'Reading image…' : 'Choose image'}
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
