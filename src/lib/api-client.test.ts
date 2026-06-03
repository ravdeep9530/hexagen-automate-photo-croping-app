import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./api-client";
import type {
  CheckCroppingFeatureFlagResponse,
  CropImageResponse,
  DownloadCroppedPhotoResponse,
  GetImageStatusResponse,
  UploadImageResponse,
  UploadedImage,
  ValidateImageResponse,
} from "../types/entities";

const uploadedImage: UploadedImage = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  filename: "portrait.jpg",
  uploaded_at: "2026-06-03T00:00:00.000Z",
  user_id: null,
  status: "uploaded",
};

const validateImageResponse: ValidateImageResponse = {
  image: uploadedImage,
  is_valid: true,
  validation_failures: [],
};

const cropImageResponse: CropImageResponse = {
  image: {
    ...uploadedImage,
    status: "processed",
  },
  processed_photo: {
    id: "2bb0dcd8-a114-4f18-b5e9-ef404f96b57d",
    uploaded_image_id: uploadedImage.id,
    processed_url: "/processed/portrait-cropped.jpg",
    created_at: "2026-06-03T00:05:00.000Z",
    crop_metadata: {
      x: 10,
      y: 20,
      width: 300,
      height: 400,
    },
    validation_failures: [],
  },
};

const uploadImageResponse: UploadImageResponse = {
  image: uploadedImage,
};

const getImageStatusResponse: GetImageStatusResponse = {
  image: {
    ...uploadedImage,
    status: "processing",
  },
  processed_photo: null,
  validation_failures: [],
};

const featureFlagResponse: CheckCroppingFeatureFlagResponse = {
  enabled: true,
};

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
    status,
  });
}

describe("createApiClient", () => {
  it("uploads an image using multipart form data", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(uploadImageResponse, 201),
    );
    const client = createApiClient({ baseUrl: "https://api.example.com", fetchFn });

    const result = await client.uploadImage({
      file: new Blob(["image-bytes"], { type: "image/jpeg" }),
      filename: uploadedImage.filename,
      user_id: "user-123",
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.example.com/images/upload",
      expect.objectContaining({
        body: expect.any(FormData),
        method: "POST",
      }),
    );

    const requestInit = fetchFn.mock.calls[0]?.[1];
    const formData = requestInit?.body as FormData;

    expect(formData.get("user_id")).toBe("user-123");
    expect(formData.get("file")).toBeInstanceOf(File);
    expect(result).toEqual({
      data: uploadImageResponse,
      ok: true,
      status: 201,
    });
  });

  it("returns a structured error when upload fails before receiving a response", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new Error("socket hang up"));
    const client = createApiClient({ fetchFn });

    const result = await client.uploadImage({
      file: new Blob(["image-bytes"], { type: "image/jpeg" }),
      filename: uploadedImage.filename,
    });

    expect(result).toEqual({
      error: {
        code: "network_error",
        details: "socket hang up",
        message: "socket hang up",
        status: 0,
      },
      ok: false,
      status: 0,
    });
  });

  it("validates an uploaded image", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(validateImageResponse),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.validateImage({ image_id: uploadedImage.id });

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/images/550e8400-e29b-41d4-a716-446655440000/validate",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    expect(result).toEqual({
      data: validateImageResponse,
      ok: true,
      status: 200,
    });
  });

  it("returns a structured validation error payload", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          code: "face_not_detected",
          details: {
            image_id: uploadedImage.id,
          },
          message: "A face could not be detected in the uploaded image.",
        },
        422,
      ),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.validateImage({ image_id: uploadedImage.id });

    expect(result).toEqual({
      error: {
        code: "face_not_detected",
        details: {
          image_id: uploadedImage.id,
        },
        message: "A face could not be detected in the uploaded image.",
        status: 422,
      },
      ok: false,
      status: 422,
    });
  });

  it("crops an uploaded image", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(cropImageResponse),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.cropImage({
      image_id: uploadedImage.id,
      crop_metadata: cropImageResponse.processed_photo.crop_metadata,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/images/550e8400-e29b-41d4-a716-446655440000/crop",
      {
        body: JSON.stringify({
          crop_metadata: cropImageResponse.processed_photo.crop_metadata,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );
    expect(result).toEqual({
      data: cropImageResponse,
      ok: true,
      status: 200,
    });
  });

  it("returns a structured crop error payload", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("Crop parameters were out of bounds.", {
        headers: {
          "content-type": "text/plain",
        },
        status: 400,
      }),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.cropImage({
      image_id: uploadedImage.id,
      crop_metadata: {
        x: -1,
        y: 20,
        width: 300,
        height: 400,
      },
    });

    expect(result).toEqual({
      error: {
        code: "crop_failed",
        details: "Crop parameters were out of bounds.",
        message: "Crop parameters were out of bounds.",
        status: 400,
      },
      ok: false,
      status: 400,
    });
  });

  it("downloads a processed photo", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("cropped-image", {
        headers: {
          "content-disposition": 'attachment; filename="portrait-cropped.jpg"',
          "content-type": "image/jpeg",
        },
        status: 200,
      }),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.downloadCroppedPhoto({
      photo_id: cropImageResponse.processed_photo.id,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/photos/2bb0dcd8-a114-4f18-b5e9-ef404f96b57d/download",
      {
        method: "GET",
      },
    );
    expect(result.ok).toBe(true);

    if (result.ok) {
      const responseData: DownloadCroppedPhotoResponse = result.data;

      expect(responseData.content_type).toBe("image/jpeg");
      expect(responseData.filename).toBe("portrait-cropped.jpg");
      await expect(responseData.file.text()).resolves.toBe("cropped-image");
    }
  });

  it("returns a structured download error payload", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          code: "download_missing",
          message: "The cropped photo could not be found.",
        },
        404,
      ),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.downloadCroppedPhoto({
      photo_id: cropImageResponse.processed_photo.id,
    });

    expect(result).toEqual({
      error: {
        code: "download_missing",
        details: undefined,
        message: "The cropped photo could not be found.",
        status: 404,
      },
      ok: false,
      status: 404,
    });
  });

  it("retrieves image status", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(getImageStatusResponse),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.getImageStatus({ image_id: uploadedImage.id });

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/images/550e8400-e29b-41d4-a716-446655440000/status",
      {
        body: undefined,
        headers: {
          "Content-Type": "application/json",
        },
        method: "GET",
      },
    );
    expect(result).toEqual({
      data: getImageStatusResponse,
      ok: true,
      status: 200,
    });
  });

  it("returns a structured status error payload", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          code: "image_not_found",
          message: "No image exists for the supplied identifier.",
        },
        404,
      ),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.getImageStatus({ image_id: uploadedImage.id });

    expect(result).toEqual({
      error: {
        code: "image_not_found",
        details: undefined,
        message: "No image exists for the supplied identifier.",
        status: 404,
      },
      ok: false,
      status: 404,
    });
  });

  it("checks the cropping feature flag", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(featureFlagResponse),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.checkCroppingFeatureFlag();

    expect(fetchFn).toHaveBeenCalledWith("/api/feature-flags/cropping", {
      body: undefined,
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
    });
    expect(result).toEqual({
      data: featureFlagResponse,
      ok: true,
      status: 200,
    });
  });

  it("returns a structured feature-flag error payload", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          message: "Feature flag service unavailable.",
        },
        503,
      ),
    );
    const client = createApiClient({ fetchFn });

    const result = await client.checkCroppingFeatureFlag();

    expect(result).toEqual({
      error: {
        code: "feature_flag_check_failed",
        details: undefined,
        message: "Feature flag service unavailable.",
        status: 503,
      },
      ok: false,
      status: 503,
    });
  });
});
