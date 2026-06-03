export type UploadErrorCode =
  | "invalid_file_type"
  | "file_too_large"
  | "upload_failed";

export interface UploadValidationResult {
  message: string;
  valid: boolean;
}

export interface UploadZoneLabels {
  browse: string;
  dropzone: string;
}
