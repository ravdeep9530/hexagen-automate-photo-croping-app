import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CropperPanel from "./cropper-panel";
import type { UploadedImage } from "../../types/entities";

const uploadedImage: UploadedImage = {
  filename: "portrait.jpg",
  id: "image-1",
  status: "uploaded",
  uploaded_at: "2024-01-01T00:00:00Z",
  user_id: null,
};

describe("CropperPanel", () => {
  it("renders cropper guidance, accessibility attributes, and controls", () => {
    const markup = renderToStaticMarkup(
      <CropperPanel image={uploadedImage} imageUrl="blob:photo-preview" />,
    );

    expect(markup).toContain("Interactive image crop area");
    expect(markup).toContain("role=\"application\"");
    expect(markup).toContain("Confirm crop");
    expect(markup).toContain("Aspect ratio");
    expect(markup).toContain("Crop editor ready. Use arrow keys to move the crop area.");
    expect(markup).toContain("aria-roledescription=\"image cropper\"");
  });
});
