import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_UPLOAD_SIZE_BYTES,
  getNormalizedFileType,
  validateUploadFile,
} from "../../lib/file-validators";
import { createPhotoStore } from "../../store/photo-store";

describe("upload-zone support modules", () => {
  it("validates supported image types and size rules", () => {
    const validFile = new File(["img"], "portrait.jpg", { type: "image/jpeg" });
    const invalidType = new File(["img"], "portrait.gif", { type: "image/gif" });
    const oversized = new File(["123456"], "portrait.png", { type: "image/png" });

    expect(validateUploadFile(validFile).valid).toBe(true);
    expect(validateUploadFile(invalidType).errors[0]?.code).toBe("unsupported_file_type");
    expect(validateUploadFile(oversized, { maxSizeBytes: 2 }).errors[0]?.code).toBe("file_too_large");
    expect(DEFAULT_MAX_UPLOAD_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it("normalizes MIME type from filename extension when browser type is empty", () => {
    const file = new File(["img"], "portrait.webp", { type: "" });

    expect(getNormalizedFileType(file)).toBe("image/webp");
  });

  it("stores uploaded images and validation failures for upload workflows", () => {
    const store = createPhotoStore();
    const state = store.getState();

    state.addImage({
      id: "image-1",
      filename: "portrait.jpg",
      uploadedAt: "2026-06-03T00:00:00.000Z",
      userId: null,
      status: "uploaded",
    });
    state.addValidationFailure({
      imageId: "client-upload",
      code: "unsupported_media_type",
      message: "Only JPEG images are supported.",
    });

    expect(store.getState().images).toHaveLength(1);
    expect(store.getState().validations).toHaveLength(1);
  });
});
