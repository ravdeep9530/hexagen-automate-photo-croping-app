import { describe, expect, it, vi } from "vitest";

vi.mock("react", () => ({
  useMemo: <T>(factory: () => T) => factory(),
}));

import { createFrontendFlowLogger, redactUserId } from "./use-logging";

describe("use-logging", () => {
  it("logs structured frontend flow events with request, user, image, and duration fields", () => {
    const logger = vi.fn();
    const flowLogger = createFrontendFlowLogger({
      userId: "user-42",
      logger,
      now: () => 145,
      createRequestId: () => "request-123",
    });

    const event = flowLogger.logFlowEvent({
      event: "crop",
      status: "success",
      imageId: "image-9",
      startedAt: 100,
      metadata: {
        photo_id: "photo-7",
      },
    });

    expect(event).toEqual({
      event: "crop",
      status: "success",
      request_id: "request-123",
      user_id: "user-42",
      image_id: "image-9",
      processing_duration_ms: 45,
      metadata: {
        photo_id: "photo-7",
      },
    });
    expect(logger).toHaveBeenCalledWith(event);
  });

  it("redacts anonymous and demo user ids", () => {
    expect(redactUserId("anonymous")).toBe("redacted");
    expect(redactUserId("demo")).toBe("redacted");
    expect(redactUserId("user-99")).toBe("user-99");
    expect(redactUserId(null)).toBeNull();
  });

  it("excludes binary and image data from log metadata", () => {
    const logger = vi.fn();
    const flowLogger = createFrontendFlowLogger({
      logger,
      now: () => 25,
      createRequestId: () => "request-456",
    });

    const event = flowLogger.logFlowEvent({
      event: "download",
      status: "success",
      imageId: "image-3",
      startedAt: 0,
      metadata: {
        filename: "portrait-cropped.jpg",
        blob: new Blob(["binary"]),
        file: new File(["binary"], "portrait.jpg", { type: "image/jpeg" }),
        imageData: "base64-image-data",
        nested: {
          content_type: "image/jpeg",
          blob: new Blob(["nested-binary"]),
        },
      },
    });

    expect(event).toEqual({
      event: "download",
      status: "success",
      request_id: "request-456",
      user_id: null,
      image_id: "image-3",
      processing_duration_ms: 25,
      metadata: {
        filename: "portrait-cropped.jpg",
        nested: {
          content_type: "image/jpeg",
        },
      },
    });
    expect(logger).toHaveBeenCalledWith(event);
  });
});
