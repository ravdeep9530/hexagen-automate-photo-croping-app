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
  user_id: "user-1",
};

describe("CropperPanel", () => {
  it("renders fallback guidance while the feature flag status is still loading", () => {
    const markup = renderToStaticMarkup(
      <CropperPanel image={uploadedImage} imageUrl="blob:photo-preview" />,
    );

    expect(markup).toContain("Checking crop access");
    expect(markup).toContain("Cropping access is controlled by a feature flag");
    expect(markup).not.toContain("Interactive image crop area");
    expect(markup).not.toContain("Confirm crop");
  });
});
