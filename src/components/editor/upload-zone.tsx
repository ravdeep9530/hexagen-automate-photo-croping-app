import * as React from "react";
import type { StoreApi } from "zustand/vanilla";

import { useFileDrop } from "../../hooks/use-file-drop";
import { uploadImage as defaultUploadImage } from "../../lib/api-client";
import {
  DEFAULT_MAX_FILE_SIZE_BYTES,
  validateImageFile,
} from "../../lib/file-validators";
import { photoStore, type PhotoStore } from "../../store/photo-store";
import type { ApiError, ApiResult, UploadImageResponse } from "../../types/entities";
import { ErrorBanner } from "./error-banner";

export interface CropArea {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface UploadZoneProps {
  maxFileSizeBytes?: number;
  onCropChange?: (area: CropArea | null) => void;
  store?: StoreApi<PhotoStore>;
  uploadImage?: typeof defaultUploadImage;
}

function createObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export default function UploadZone({
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
  onCropChange,
  store = photoStore,
  uploadImage = defaultUploadImage,
}: UploadZoneProps): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const processFile = React.useCallback(
    async (file: File) => {
      const validationResult = validateImageFile(file, maxFileSizeBytes);

      if (!validationResult.valid) {
        setError({
          code: "invalid_upload",
          message: validationResult.message,
          status: 400,
        });
        return;
      }

      setError(null);
      setIsUploading(true);
      const nextPreviewUrl = createObjectUrl(file);
      setPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl !== null) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        return nextPreviewUrl;
      });

      const result: ApiResult<UploadImageResponse> = await uploadImage({
        file,
        filename: file.name,
      });

      if (!result.ok) {
        setError(result.error);
        setIsUploading(false);
        return;
      }

      setError(null);
      store.getState().addImage(result.data.image);
      onCropChange?.(null);
      setIsUploading(false);
    },
    [maxFileSizeBytes, onCropChange, store, uploadImage],
  );

  const handleFiles = React.useCallback(
    (files: File[]) => {
      const firstFile = files[0];

      if (firstFile !== undefined) {
        void processFile(firstFile);
      }
    },
    [processFile],
  );

  const { isDragging, onDragEnter, onDragLeave, onDragOver, onDrop } = useFileDrop({
    onFilesDropped: handleFiles,
  });

  const handleInputChange = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const file = event.target.files?.[0];

      if (file !== undefined) {
        void processFile(file);
      }
    },
    [processFile],
  );

  React.useEffect(() => {
    return () => {
      if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <section className="space-y-4">
      <ErrorBanner error={error} operation="upload" />
      <div
        aria-busy={isUploading}
        aria-label="Upload image"
        className={`rounded-lg border border-dashed p-8 text-center ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-label="Choose an image to upload"
          className="hidden"
          onChange={handleInputChange}
          ref={inputRef}
          type="file"
        />
        <p className="font-medium">Drag and drop a JPG, PNG, or WEBP image here</p>
        <p className="text-sm text-slate-600">or press Enter/Space to browse for a file</p>
      </div>
      {previewUrl !== null ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview</p>
          <img
            alt="Selected upload preview"
            className="max-h-64 rounded-md object-contain"
            src={previewUrl}
          />
        </div>
      ) : null}
    </section>
  );
}
