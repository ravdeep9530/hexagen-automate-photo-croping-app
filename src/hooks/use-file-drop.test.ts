import { describe, expect, it } from "vitest";

import { validateUploadFile } from "../lib/file-validators";

describe("use-file-drop support", () => {
  it("shares upload validation expectations used by drop flows", () => {
    const acceptedJpeg = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const acceptedWebp = new File(["img"], "photo.webp", { type: "image/webp" });
    const rejectedGif = new File(["img"], "photo.gif", { type: "image/gif" });

    expect(validateUploadFile(acceptedJpeg).valid).toBe(true);
    expect(validateUploadFile(acceptedWebp).valid).toBe(true);
    expect(validateUploadFile(rejectedGif)).toEqual({
      valid: false,
      errors: [
        {
          code: "unsupported_file_type",
          message: "Upload a JPG, PNG, or WebP image.",
        },
      ],
    });
  });
});
