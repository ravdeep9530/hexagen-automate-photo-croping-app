import {
  ACCEPTED_IMAGE_MIME_TYPES,
  type FileValidationError,
  type FileValidationOptions,
  type FileValidationResult,
} from "../types/upload";

export const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const formatMegabytes = (bytes: number): string => {
  const megabytes = bytes / (1024 * 1024);

  return Number.isInteger(megabytes) ? `${megabytes} MB` : `${megabytes.toFixed(1)} MB`;
};

export const getFileExtension = (filename: string): string => {
  const extension = filename.toLowerCase().split(".").pop();

  return extension && extension !== filename.toLowerCase() ? extension : "";
};

export const getNormalizedFileType = (file: File): string => {
  if (file.type) {
    return file.type.toLowerCase();
  }

  return EXTENSION_TO_MIME_TYPE[getFileExtension(file.name)] ?? "";
};

export const isAcceptedImageFile = (
  file: File,
  allowedTypes: readonly string[] = ACCEPTED_IMAGE_MIME_TYPES,
): boolean => allowedTypes.includes(getNormalizedFileType(file));

export const validateUploadFile = (
  file: File | null | undefined,
  options: FileValidationOptions = {},
): FileValidationResult => {
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_UPLOAD_SIZE_BYTES;
  const allowedTypes = options.allowedTypes ?? ACCEPTED_IMAGE_MIME_TYPES;
  const errors: FileValidationError[] = [];

  if (!file) {
    return {
      valid: false,
      errors: [
        {
          code: "missing_file",
          message: "Choose an image before uploading.",
        },
      ],
    };
  }

  if (!isAcceptedImageFile(file, allowedTypes)) {
    errors.push({
      code: "unsupported_file_type",
      message: "Upload a JPG, PNG, or WebP image.",
    });
  }

  if (file.size > maxSizeBytes) {
    errors.push({
      code: "file_too_large",
      message: `Image must be ${formatMegabytes(maxSizeBytes)} or smaller.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
