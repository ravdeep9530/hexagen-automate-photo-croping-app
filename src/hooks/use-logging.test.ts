import { describe, expect, it, vi } from "vitest";

import { createLogging, redactUserId } from "./use-logging";

describe("createLogging", () => {
  it("logs structured frontend flow events with timing metadata and no binary payloads", () => {
    const logger = { info: vi.fn() };
    const nowValues = [100, 245];

    const flowLogger = createLogging({
      logger,
      now: () => nowValues.shift() ?? 245,
      requestIdFactory: () => "request-1",
      timestampFactory: () => "2026-06-03T00:00:00.000Z",
    });

    const context = flowLogger.startEvent({
      event: "upload",
      imageId: null,
      userId: "user-1",
    });
    const entry = flowLogger.finishEvent(context, {
      imageId: "image-1",
      metadata: {
        file: new Blob(["image-bytes"], { type: "image/jpeg" }),
        filename: "portrait.jpg",
        processing: {
          base64: "raw-image-bytes",
          preview_ready: true,
        },
      },
      status: "succeeded",
      userId: "user-1",
    });

    expect(entry).toEqual({
      event: "upload",
      image_id: "image-1",
      logged_at: "2026-06-03T00:00:00.000Z",
      metadata: {
        filename: "portrait.jpg",
        processing: {
          preview_ready: true,
        },
      },
      processing_duration_ms: 145,
      request_id: "request-1",
      status: "succeeded",
      user_id: "user-1",
    });
    expect(logger.info).toHaveBeenCalledWith(JSON.stringify(entry));
  });
});

describe("redactUserId", () => {
  it("redacts demo and anonymous user identifiers", () => {
    expect(redactUserId("demo")).toBe("redacted");
    expect(redactUserId("anonymous")).toBe("redacted");
    expect(redactUserId("user-1")).toBe("user-1");
    expect(redactUserId(null)).toBeNull();
  });
});
