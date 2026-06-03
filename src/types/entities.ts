export type UploadedImageStatus = 'uploaded' | 'processing' | 'processed' | 'error'

export interface UploadedImage {
  id: string
  filename: string
  uploaded_at: string
  user_id: string | null
  status: UploadedImageStatus
}

export interface CropMetaData {
  x: number
  y: number
  width: number
  height: number
}

export interface ValidationFailure {
  type: string
  detail: string
}

export interface ProcessedPhoto {
  id: string
  original_image_id: string
  filename: string
  processed_at: string
  crop_metadata: CropMetaData
  status: 'processed' | 'error'
  validation_failures: ValidationFailure[]
}
