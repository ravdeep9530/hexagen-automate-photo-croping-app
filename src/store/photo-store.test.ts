import { describe, expect, it } from "vitest";

import type {
  CropMetaData,
  ProcessedPhoto,
  UploadedImage,
  ValidationFailure,
} from "../types/entities";

const uploadedImage: UploadedImage = {
  id: "image-1",
  filename: "portrait.jpg",
  uploadedAt: "2026-06-03T00:00:00.000Z",
  userId: "user-1",
  status: "uploaded",
};

const crop: CropMetaData = {
  imageId: "image-1",
  x: 10,
  y: 20,
  width: 200,
  height: 300,
  aspectRatio: 2 / 3,
};

const validationFailure: ValidationFailure = {
  imageId: "image-1",
  code: "invalid-dimensions",
  message: "The uploaded image does not meet the minimum crop size.",
};

const processedPhoto: ProcessedPhoto = {
  id: "processed-1",
  imageId: "image-1",
  filename: "portrait-cropped.jpg",
  processedAt: "2026-06-03T00:01:00.000Z",
  downloadUrl: "/processed/portrait-cropped.jpg",
};

describe("photo-store", () => {
  it("exposes empty image, crop, validation, and processed photo arrays by default", async () => {
    const { createPhotoStore } = await import("./photo-store");
    const store = createPhotoStore();

    expect(store.getState().images).toEqual([]);
    expect(store.getState().crops).toEqual([]);
    expect(store.getState().validations).toEqual([]);
    expect(store.getState().processedPhotos).toEqual([]);
  });

  it("adds uploaded images, validation failures, and processed photos", async () => {
    const { createPhotoStore } = await import("./photo-store");
    const store = createPhotoStore();
    const state = store.getState();

    state.addImage(uploadedImage);
    state.addValidationFailure(validationFailure);
    state.addProcessedPhoto(processedPhoto);

    expect(store.getState().images).toEqual([uploadedImage]);
    expect(store.getState().validations).toEqual([validationFailure]);
    expect(store.getState().processedPhotos).toEqual([processedPhoto]);
  });

  it("upserts crop metadata for the same image", async () => {
    const { createPhotoStore } = await import("./photo-store");
    const store = createPhotoStore();
    const state = store.getState();

    state.updateCrop(crop);
    state.updateCrop({
      ...crop,
      width: 240,
      height: 360,
    });

    expect(store.getState().crops).toEqual([
      {
        ...crop,
        width: 240,
        height: 360,
      },
    ]);
  });

  it("stores crop metadata for distinct images without overwriting other entries", async () => {
    const { createPhotoStore } = await import("./photo-store");
    const store = createPhotoStore();
    const state = store.getState();

    state.updateCrop(crop);
    state.updateCrop({
      ...crop,
      imageId: "image-2",
      x: 0,
      y: 0,
    });

    expect(store.getState().crops).toEqual([
      crop,
      {
        ...crop,
        imageId: "image-2",
        x: 0,
        y: 0,
      },
    ]);
  });
});
