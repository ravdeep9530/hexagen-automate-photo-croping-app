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
