export type UploadedImageStatus = "uploaded" | "processing" | "processed" | "error";

export interface UploadedImage {
  id: string;
  filename: string;
  uploadedAt: string;
  userId: string | null;
  status: UploadedImageStatus;
}

export interface CropMetaData {
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number | null;
}

export interface ValidationFailure {
  imageId: string;
  code: string;
  message: string;
}

export interface ProcessedPhoto {
  id: string;
  imageId: string;
  filename: string;
  processedAt: string;
  downloadUrl: string;
}

export interface UploadImageRequest {
  file: Blob;
  filename: string;
  userId?: string | null;
}

export interface UploadImageResponse {
  image: UploadedImage;
}

export interface ValidateImageRequest {
  imageId: string;
}

export interface ValidateImageResponse {
  image: UploadedImage;
  isValid: boolean;
  failures: ValidationFailure[];
}

export interface CropImageRequest {
  imageId: string;
  crop: CropMetaData;
}

export interface CropImageResponse {
  image: UploadedImage;
  photo: ProcessedPhoto;
}

export interface DownloadCroppedPhotoRequest {
  photoId: string;
}

export interface DownloadCroppedPhotoResponse {
  photoId: string;
  filename: string | null;
  contentType: string | null;
  blob: Blob;
}

export interface GetImageStatusRequest {
  imageId: string;
}

export interface GetImageStatusResponse {
  image: UploadedImage;
}

export interface CroppingFeatureFlagResponse {
  feature: "cropping";
  enabled: boolean;
}

export interface ApiClientError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export type ApiClientResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ApiClientError;
    };
