import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  executeUploadWorkflow,
  PhotoEditorPage,
  type WorkflowNotice,
} from "./page";
import { createPhotoStore } from "../store/photo-store";
import type {
  ProcessedPhoto,
  UploadedImage,
  UploadImageResponse,
  ValidateImageResponse,
  ValidationFailure,
} from "../types/entities";

const uploadedImage: UploadedImage = {
  filename: "portrait.jpg",
  id: "image-1",
  status: "uploaded",
  uploaded_at: "2026-06-03T00:00:00.000Z",
  user_id: "user-1",
};

const validationFailure: ValidationFailure = {
  detail: "A face could not be detected in the uploaded image.",
  type: "face_not_detected",
};

const processedPhoto: ProcessedPhoto = {
  created_at: "2026-06-03T00:05:00.000Z",
  crop_metadata: {
    height: 400,
    width: 300,
    x: 10,
    y: 20,
  },
  id: "photo-1",
  processed_url: "/processed/photo-1.jpg",
  uploaded_image_id: uploadedImage.id,
  validation_failures: [],
};

describe("executeUploadWorkflow", () => {
  it("uploads, validates, and stores validation failures before returning the uploaded image", async () => {
    const store = createPhotoStore();
    const request = {
      file: new Blob(["image-bytes"], { type: "image/jpeg" }),
      filename: uploadedImage.filename,
    };
    const uploadResult: UploadImageResponse = {
      image: uploadedImage,
    };
    const validateResult: ValidateImageResponse = {
      image: uploadedImage,
      is_valid: false,
      validation_failures: [validationFailure],
    };

    const result = await executeUploadWorkflow({
      createObjectUrl: vi.fn(() => "blob:portrait"),
      request,
      store,
      uploadImage: vi.fn(async () => ({
        data: uploadResult,
        ok: true as const,
        status: 201,
      })),
      validateImage: vi.fn(async () => ({
        data: validateResult,
        ok: true as const,
        status: 200,
      })),
    });

    expect(store.getState().validations).toEqual([validationFailure]);
    expect(result.validationStatus).toBe("failed");
    expect(result.notice).toBeNull();
    expect(result.imageUrl).toBe("blob:portrait");
    expect(result.uploadResult).toEqual({
      data: uploadResult,
      ok: true,
      status: 201,
    });
  });
});

describe("PhotoEditorPage", () => {
  it("renders upload, validation, crop, and download sections inside accessible page landmarks", () => {
    const store = createPhotoStore();
    const workflowNotice: WorkflowNotice = {
      message: "Image validated successfully. Continue to cropping.",
      title: "Validation complete",
      tone: "success",
    };

    store.getState().addImage(uploadedImage);
    store.getState().addProcessedPhoto(processedPhoto);

    const markup = renderToStaticMarkup(
      <PhotoEditorPage
        cropImage={vi.fn()}
        downloadCroppedPhoto={vi.fn()}
        initialImageUrl="blob:portrait"
        initialValidationStatus="passed"
        initialWorkflowNotice={workflowNotice}
        store={store}
        uploadImage={vi.fn()}
        validateImage={vi.fn()}
      />,
    );

    expect(markup).toContain("<main");
    expect(markup).toContain('href="#photo-editor-workflow"');
    expect(markup).toContain("Upload, validate, crop, and download a processed portrait");
    expect(markup).toContain("Validation complete");
    expect(markup).toContain('aria-live="polite"');
    expect(markup.indexOf("Drag and drop a JPG, PNG, or WEBP image here")).toBeLessThan(
      markup.indexOf("Checking crop access"),
    );
    expect(markup.indexOf("Checking crop access")).toBeLessThan(
      markup.indexOf("Download processed photo"),
    );
  });

  it("renders validation feedback ahead of later workflow steps when the upload fails validation", () => {
    const store = createPhotoStore();

    store.getState().addImage(uploadedImage);
    store.getState().addValidationFailure(validationFailure);

    const markup = renderToStaticMarkup(
      <PhotoEditorPage
        cropImage={vi.fn()}
        downloadCroppedPhoto={vi.fn()}
        initialImageUrl="blob:portrait"
        initialValidationStatus="failed"
        store={store}
        uploadImage={vi.fn()}
        validateImage={vi.fn()}
      />,
    );

    expect(markup).toContain("Validation failed");
    expect(markup).toContain(validationFailure.detail);
    expect(markup).not.toContain("Download processed photo");
    expect(markup).not.toContain("Checking crop access");
    expect(markup.indexOf("Drag and drop a JPG, PNG, or WEBP image here")).toBeLessThan(
      markup.indexOf("Validation failed"),
    );
  });
});
