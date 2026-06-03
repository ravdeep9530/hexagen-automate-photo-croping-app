export interface UploadedImage {
  id: string;
  filename: string;
  uploaded_at: string;
  user_id: string | null;
  status: "uploaded" | "processing" | "processed" | "error";
}

export interface CropMetaData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationFailure {
  type: string;
  detail: string;
}

export interface ProcessedPhoto {
  id: string;
  uploaded_image_id: string;
  processed_url: string;
  created_at: string;
  crop_metadata: CropMetaData;
  validation_failures: ValidationFailure[];
}

export interface UploadImageRequest {
  file: Blob;
  filename: string;
  user_id?: string | null;
}

export interface UploadImageResponse {
  image: UploadedImage;
}

export interface ValidateImageRequest {
  image_id: UploadedImage["id"];
}

export interface ValidateImageResponse {
  image: UploadedImage;
  is_valid: boolean;
  validation_failures: ValidationFailure[];
}

export interface CropImageRequest {
  image_id: UploadedImage["id"];
  crop_metadata: CropMetaData;
}

export interface CropImageResponse {
  image: UploadedImage;
  processed_photo: ProcessedPhoto;
}

export interface DownloadCroppedPhotoRequest {
  photo_id: ProcessedPhoto["id"];
}

export interface DownloadCroppedPhotoResponse {
  content_type: string;
  file: Blob;
  filename: string;
}

export interface GetImageStatusRequest {
  image_id: UploadedImage["id"];
}

export interface GetImageStatusResponse {
  image: UploadedImage;
  processed_photo: ProcessedPhoto | null;
  validation_failures: ValidationFailure[];
}

export interface CheckCroppingFeatureFlagResponse {
  enabled: boolean;
}

export interface ApiError {
  code: string;
  details?: unknown;
  message: string;
  status: number;
}

export interface ApiSuccess<T> {
  data: T;
  ok: true;
  status: number;
}

export interface ApiFailure {
  error: ApiError;
  ok: false;
  status: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
