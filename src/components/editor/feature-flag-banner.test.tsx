import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CropperPanel from "./cropper-panel";
import { FeatureFlagBanner } from "./feature-flag-banner";
import type { UploadedImage } from "../../types/entities";

const uploadedImage: UploadedImage = {
  filename: "portrait.jpg",
  id: "image-1",
  status: "uploaded",
  uploaded_at: "2024-01-01T00:00:00Z",
  user_id: null,
};

describe("FeatureFlagBanner", () => {
  it("renders a disabled message when cropping is not enabled", () => {
    const markup = renderToStaticMarkup(<FeatureFlagBanner status="disabled" />);

    expect(markup).toContain("Cropping unavailable");
    expect(markup).toContain("Cropping is currently disabled for this user.");
  });

  it("renders an error message when feature-flag lookup fails", () => {
    const markup = renderToStaticMarkup(
      <FeatureFlagBanner
        errorMessage="Feature flag service unavailable."
        status="error"
      />,
    );

    expect(markup).toContain("Cropping unavailable");
    expect(markup).toContain("Feature flag service unavailable.");
    expect(markup).toContain('aria-live="assertive"');
  });

  it("hides cropper controls behind fallback UI when the feature flag is unresolved", () => {
    const markup = renderToStaticMarkup(
      <CropperPanel image={uploadedImage} imageUrl="blob:photo-preview" />,
    );

    expect(markup).toContain("Cropping access is controlled by a feature flag");
    expect(markup).not.toContain("Interactive image crop area");
    expect(markup).not.toContain("Confirm crop");
  });
});
