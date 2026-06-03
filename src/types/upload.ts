import type { ApiClientError, UploadImageResponse } from "./entities";

export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: readonly string[];
}

export interface FileValidationError {
  code: "missing_file" | "unsupported_file_type" | "file_too_large";
  message: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
}

export interface SelectedUploadFile {
  file: File;
  previewUrl: string;
}

export interface UploadZoneApiClient {
  uploadImage: (request: {
    file: Blob;
    filename: string;
    userId?: string | null;
  }) => Promise<
    | {
        data: UploadImageResponse;
        error: null;
      }
    | {
        data: null;
        error: ApiClientError;
      }
  >;
}

export interface UploadZoneStatus {
  state: "idle" | "validating" | "uploading" | "uploaded" | "error";
  message: string | null;
}
