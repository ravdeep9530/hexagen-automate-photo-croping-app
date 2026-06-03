import type {
  CropMetaData,
  ProcessedPhoto,
  UploadedImage,
  ValidationFailure,
} from "./entities";

const uploadedImage: UploadedImage = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  filename: "portrait.jpg",
  uploaded_at: "2026-06-03T00:00:00.000Z",
  user_id: null,
  status: "uploaded",
};

const cropMetaData: CropMetaData = {
  x: 10,
  y: 20,
  width: 300,
  height: 400,
};

const validationFailure: ValidationFailure = {
  type: "face_not_detected",
  detail: "A face could not be detected in the uploaded image.",
};

const processedPhoto: ProcessedPhoto = {
  id: "2bb0dcd8-a114-4f18-b5e9-ef404f96b57d",
  uploaded_image_id: uploadedImage.id,
  processed_url: "/processed/portrait-cropped.jpg",
  created_at: "2026-06-03T00:05:00.000Z",
  crop_metadata: cropMetaData,
  validation_failures: [validationFailure],
};

void uploadedImage;
void cropMetaData;
void validationFailure;
void processedPhoto;
