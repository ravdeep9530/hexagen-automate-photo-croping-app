import type { UploadValidationResult } from "../types/upload";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function isAcceptedImageType(file: Pick<File, "type">): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

export function validateImageFile(
  file: Pick<File, "type" | "size">,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
): UploadValidationResult {
  if (!isAcceptedImageType(file)) {
    return {
      message: "Only JPG, PNG, and WEBP images are supported.",
      valid: false,
    };
  }

  if (file.size > maxFileSizeBytes) {
    return {
      message: `Image must be ${Math.floor(maxFileSizeBytes / (1024 * 1024))}MB or smaller.`,
      valid: false,
    };
  }

  return {
    message: "",
    valid: true,
  };
}
