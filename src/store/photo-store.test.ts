import { describe, expect, it } from "vitest";

import { createPhotoStore } from "./photo-store";
import type {
  CropMetaData,
  ProcessedPhoto,
  UploadedImage,
  ValidationFailure,
} from "../types/entities";

const uploadedImage: UploadedImage = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  filename: "portrait.jpg",
  uploaded_at: "2026-06-03T00:00:00.000Z",
  user_id: null,
  status: "uploaded",
};

const updatedCropMetaData: CropMetaData = {
  x: 24,
  y: 48,
  width: 320,
  height: 480,
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
  crop_metadata: updatedCropMetaData,
  validation_failures: [validationFailure],
};

describe("createPhotoStore", () => {
  it("starts with empty image, crop, validation, and processed photo collections", () => {
    const store = createPhotoStore();

    expect(store.getState()).toMatchObject({
      images: [],
      crops: [],
      validations: [],
      processedPhotos: [],
    });
  });

  it("adds uploaded images and stores crop updates for known image ids", () => {
    const store = createPhotoStore();

    store.getState().addImage(uploadedImage);
    store.getState().updateCrop(uploadedImage.id, updatedCropMetaData);

    expect(store.getState().images).toEqual([uploadedImage]);
    expect(store.getState().crops).toEqual([updatedCropMetaData]);
  });

  it("ignores crop updates for images that have not been uploaded", () => {
    const store = createPhotoStore();

    store.getState().updateCrop(uploadedImage.id, updatedCropMetaData);

    expect(store.getState().crops).toEqual([]);
  });

  it("adds validation failures and processed photos", () => {
    const store = createPhotoStore();

    store.getState().addValidationFailure(validationFailure);
    store.getState().addProcessedPhoto(processedPhoto);

    expect(store.getState().validations).toEqual([validationFailure]);
    expect(store.getState().processedPhotos).toEqual([processedPhoto]);
  });

  it("clears validation failures without affecting the rest of the workflow state", () => {
    const store = createPhotoStore();

    store.getState().addImage(uploadedImage);
    store.getState().addValidationFailure(validationFailure);
    store.getState().addProcessedPhoto(processedPhoto);
    store.getState().clearValidationFailures();

    expect(store.getState().images).toEqual([uploadedImage]);
    expect(store.getState().validations).toEqual([]);
    expect(store.getState().processedPhotos).toEqual([processedPhoto]);
  });
});
