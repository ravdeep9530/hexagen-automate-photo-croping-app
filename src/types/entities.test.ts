import type {
  ApiFailure,
  ApiSuccess,
  CheckCroppingFeatureFlagResponse,
  CropMetaData,
  CropImageRequest,
  CropImageResponse,
  DownloadCroppedPhotoRequest,
  ProcessedPhoto,
  UploadImageRequest,
  UploadImageResponse,
  UploadedImage,
  ValidateImageResponse,
  ValidationFailure,
} from "./entities";
import { describe, expect, it } from "vitest";

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

const uploadImageRequest: UploadImageRequest = {
  file: new Blob(["image-bytes"], { type: "image/jpeg" }),
  filename: uploadedImage.filename,
  user_id: null,
};

const uploadImageResponse: UploadImageResponse = {
  image: uploadedImage,
};

const validateImageResponse: ValidateImageResponse = {
  image: uploadedImage,
  is_valid: false,
  validation_failures: [validationFailure],
};

const cropImageRequest: CropImageRequest = {
  image_id: uploadedImage.id,
  crop_metadata: cropMetaData,
};

const cropImageResponse: CropImageResponse = {
  image: uploadedImage,
  processed_photo: processedPhoto,
};

const downloadCroppedPhotoRequest: DownloadCroppedPhotoRequest = {
  photo_id: processedPhoto.id,
};

const featureFlagResponse: CheckCroppingFeatureFlagResponse = {
  enabled: true,
};

const uploadSuccess: ApiSuccess<UploadImageResponse> = {
  data: uploadImageResponse,
  ok: true,
  status: 201,
};

const uploadFailure: ApiFailure = {
  error: {
    code: "upload_failed",
    details: { filename: uploadedImage.filename },
    message: "Upload failed",
    status: 400,
  },
  ok: false,
  status: 400,
};

describe("entities", () => {
  it("models uploaded image, processing, and API client payloads", () => {
    expect(uploadedImage.status).toBe("uploaded");
    expect(cropMetaData).toEqual({
      x: 10,
      y: 20,
      width: 300,
      height: 400,
    });
    expect(validationFailure.type).toBe("face_not_detected");
    expect(processedPhoto).toMatchObject({
      crop_metadata: cropMetaData,
      processed_url: "/processed/portrait-cropped.jpg",
      uploaded_image_id: uploadedImage.id,
      validation_failures: [validationFailure],
    });
    expect(uploadImageRequest.file).toBeInstanceOf(Blob);
    expect(uploadImageResponse.image).toEqual(uploadedImage);
    expect(validateImageResponse.validation_failures).toEqual([validationFailure]);
    expect(cropImageRequest.crop_metadata).toEqual(cropMetaData);
    expect(cropImageResponse.processed_photo).toEqual(processedPhoto);
    expect(downloadCroppedPhotoRequest.photo_id).toBe(processedPhoto.id);
    expect(featureFlagResponse.enabled).toBe(true);
    expect(uploadSuccess).toEqual({
      data: uploadImageResponse,
      ok: true,
      status: 201,
    });
    expect(uploadFailure.error.code).toBe("upload_failed");
  });
});
