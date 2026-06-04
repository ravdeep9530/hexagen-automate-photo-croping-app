import type { CropParameters } from './crop-parameters';
import type { CroppedImage } from './cropped-image';
import type { UserPhotoSession } from './session';
import type { UploadedImage } from './uploaded-image';

export interface ApiError {
  code: string;
  message: string;
  details?: string | null;
}

export interface UploadImageRequest {
  sessionId: string;
  filename: string;
  mimetype: string;
  sizeBytes: number;
}

export interface UploadImageResponse {
  session: UserPhotoSession;
  uploadedImage: UploadedImage;
  success: boolean;
  error?: ApiError;
}

export interface UploadPhotoResponse {
  sessionId: string;
  imageId: string;
  url: string;
}

export interface SaveCropRequest {
  sessionId: string;
  crop: CropParameters;
}

export interface SaveCropResponse {
  session: UserPhotoSession;
  uploadedImage: UploadedImage;
  croppedImage: CroppedImage;
  success: boolean;
  error?: ApiError;
}

export interface SaveCroppedPhotoRequest {
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface SaveCroppedPhotoResponse {
  croppedImageId: string;
  url: string;
  complianceStatus: 'pending' | 'compliant' | 'non_compliant';
}

export interface SessionStatusRequest {
  sessionId: string;
}

export interface SessionStatusResponse {
  session: UserPhotoSession;
  uploadedImage: UploadedImage | null;
  croppedImage: CroppedImage | null;
  status: 'idle' | 'uploaded' | 'cropped' | 'error';
  error?: ApiError;
}

export interface CropGuidelinesResponse {
  aspectRatio: number;
  minWidth: number;
  minHeight: number;
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
}

export interface PhotoGuidelineRequirement {
  id: string;
  label: string;
  value: string;
}

export interface PhotoGuidelineVisual {
  id: string;
  title: string;
  imageUrl: string;
  altText: string;
}

export interface PhotoGuidelinesResponse {
  requirements: PhotoGuidelineRequirement[];
  visuals: PhotoGuidelineVisual[];
}

export interface CleanupSessionRequest {
  sessionId: string;
}

export interface CleanupSessionResponse {
  sessionId: string;
  cleaned: boolean;
  status: string;
  error?: ApiError;
}
