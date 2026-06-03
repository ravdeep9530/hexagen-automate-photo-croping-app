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
