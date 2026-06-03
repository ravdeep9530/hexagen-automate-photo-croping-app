import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CropImageResponse,
  CroppingFeatureFlagResponse,
  GetImageStatusResponse,
  UploadImageResponse,
  ValidateImageResponse,
} from "../types/entities";

const uploadedImage = {
  id: "image-1",
  filename: "portrait.jpg",
  uploadedAt: "2026-06-03T00:00:00.000Z",
  userId: "user-1",
  status: "uploaded" as const,
};

const processedPhoto = {
  id: "photo-1",
  imageId: "image-1",
  filename: "portrait-cropped.jpg",
  processedAt: "2026-06-03T00:02:00.000Z",
  downloadUrl: "/processed/photo-1",
};

const crop = {
  imageId: "image-1",
  x: 10,
  y: 20,
  width: 200,
  height: 300,
  aspectRatio: 2 / 3,
};

const createJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api-client", () => {
  it("uploads an image and returns the uploaded image payload", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ image: uploadedImage } satisfies UploadImageResponse));
    const apiClient = createApiClient({
      baseUrl: "https://api.example.com/",
      fetchFn,
    });

    const result = await apiClient.uploadImage({
      file: new Blob(["image-bytes"], { type: "image/jpeg" }),
      filename: "portrait.jpg",
      userId: "user-1",
    });

    expect(result).toEqual({
      data: {
        image: uploadedImage,
      },
      error: null,
    });
    expect(fetchFn).toHaveBeenCalledWith("https://api.example.com/api/images/upload", {
      method: "POST",
      body: expect.any(FormData),
    });
  });

  it("returns a structured upload error when the backend rejects the image", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            code: "unsupported_media_type",
            message: "Only JPEG images are supported.",
            details: {
              allowedTypes: ["image/jpeg"],
            },
          },
        },
        415,
      ),
    );
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.uploadImage({
      file: new Blob(["image-bytes"], { type: "image/png" }),
      filename: "portrait.png",
    });

    expect(result).toEqual({
      data: null,
      error: {
        status: 415,
        code: "unsupported_media_type",
        message: "Only JPEG images are supported.",
        details: {
          allowedTypes: ["image/jpeg"],
        },
      },
    });
  });

  it("validates an uploaded image", async () => {
    const { createApiClient } = await import("./api-client");
    const payload = {
      image: {
        ...uploadedImage,
        status: "processing" as const,
      },
      isValid: true,
      failures: [],
    } satisfies ValidateImageResponse;
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse(payload));
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.validateImage({
      imageId: "image-1",
    });

    expect(result).toEqual({
      data: payload,
      error: null,
    });
    expect(fetchFn).toHaveBeenCalledWith("/api/images/image-1/validate", {
      method: "POST",
    });
  });

  it("returns a structured validation error for invalid images", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          code: "invalid_image",
          message: "Image failed validation.",
          details: {
            failures: [
              {
                imageId: "image-1",
                code: "min_resolution",
                message: "The uploaded image is too small.",
              },
            ],
          },
        },
        422,
      ),
    );
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.validateImage({
      imageId: "image-1",
    });

    expect(result).toEqual({
      data: null,
      error: {
        status: 422,
        code: "invalid_image",
        message: "Image failed validation.",
        details: {
          failures: [
            {
              imageId: "image-1",
              code: "min_resolution",
              message: "The uploaded image is too small.",
            },
          ],
        },
      },
    });
  });

  it("submits crop metadata and returns the processed photo", async () => {
    const { createApiClient } = await import("./api-client");
    const payload = {
      image: {
        ...uploadedImage,
        status: "processed" as const,
      },
      photo: processedPhoto,
    } satisfies CropImageResponse;
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse(payload));
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.cropImage({
      imageId: "image-1",
      crop,
    });

    expect(result).toEqual({
      data: payload,
      error: null,
    });
    expect(fetchFn).toHaveBeenCalledWith("/api/images/image-1/crop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(crop),
    });
  });

  it("returns a structured crop error when processing fails", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          message: "Cropping could not be completed.",
        },
        500,
      ),
    );
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.cropImage({
      imageId: "image-1",
      crop,
    });

    expect(result).toEqual({
      data: null,
      error: {
        status: 500,
        code: "http_500",
        message: "Cropping could not be completed.",
        details: undefined,
      },
    });
  });

  it("downloads a cropped photo as a blob payload", async () => {
    const { createApiClient } = await import("./api-client");
    const blob = new Blob(["cropped-image"], { type: "image/jpeg" });
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(blob, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="portrait-cropped.jpg"',
        },
      }),
    );
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.downloadCroppedPhoto({
      photoId: "photo-1",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      photoId: "photo-1",
      filename: "portrait-cropped.jpg",
      contentType: "image/jpeg",
      blob,
    });
    expect(fetchFn).toHaveBeenCalledWith("/api/photos/photo-1/download", {
      method: "GET",
    });
  });

  it("returns a structured download error when the photo is unavailable", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("Photo not found.", {
        status: 404,
        statusText: "Not Found",
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.downloadCroppedPhoto({
      photoId: "missing-photo",
    });

    expect(result).toEqual({
      data: null,
      error: {
        status: 404,
        code: "http_404",
        message: "Photo not found.",
        details: undefined,
      },
    });
  });

  it("gets the latest image status", async () => {
    const { createApiClient } = await import("./api-client");
    const payload = {
      image: {
        ...uploadedImage,
        status: "processed" as const,
      },
    } satisfies GetImageStatusResponse;
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse(payload));
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.getImageStatus({
      imageId: "image-1",
    });

    expect(result).toEqual({
      data: payload,
      error: null,
    });
    expect(fetchFn).toHaveBeenCalledWith("/api/images/image-1/status", {
      method: "GET",
    });
  });

  it("returns a network error when image status cannot be fetched", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi.fn().mockRejectedValue(new Error("socket hang up"));
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.getImageStatus({
      imageId: "image-1",
    });

    expect(result).toEqual({
      data: null,
      error: {
        status: 0,
        code: "network_error",
        message: "socket hang up",
        details: expect.any(Error),
      },
    });
  });

  it("checks whether the cropping feature flag is enabled", async () => {
    const { createApiClient } = await import("./api-client");
    const payload = {
      feature: "cropping",
      enabled: true,
    } satisfies CroppingFeatureFlagResponse;
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse(payload));
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.checkCroppingFeatureFlag();

    expect(result).toEqual({
      data: payload,
      error: null,
    });
    expect(fetchFn).toHaveBeenCalledWith("/api/feature-flags/cropping", {
      method: "GET",
    });
  });

  it("returns a structured feature flag error response", async () => {
    const { createApiClient } = await import("./api-client");
    const fetchFn = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            code: "feature_flag_unavailable",
            message: "Feature flag service is unavailable.",
          },
        },
        503,
      ),
    );
    const apiClient = createApiClient({ fetchFn });

    const result = await apiClient.checkCroppingFeatureFlag();

    expect(result).toEqual({
      data: null,
      error: {
        status: 503,
        code: "feature_flag_unavailable",
        message: "Feature flag service is unavailable.",
        details: undefined,
      },
    });
  });
});
