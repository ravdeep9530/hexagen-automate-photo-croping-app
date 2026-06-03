import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const bannerSource = readFileSync("src/components/editor/feature-flag-banner.tsx", "utf8");
const cropperPanelSource = readFileSync("src/components/editor/cropper-panel.tsx", "utf8");

describe("feature flag source", () => {
  it("renders loading and disabled fallback states", () => {
    expect(bannerSource).toContain("Checking cropping access");
    expect(bannerSource).toContain("Cropping tool unavailable");
    expect(bannerSource).toContain("The cropping tool is currently disabled for this account. Please try again later.");
    expect(bannerSource).toContain("errorMessage ??");
  });

  it("renders CropperPanel only when the feature flag is enabled", () => {
    expect(cropperPanelSource).toContain("useFeatureFlag(image.userId");
    expect(cropperPanelSource).toContain("checkCroppingFeatureFlag: apiClient.checkCroppingFeatureFlag");
    expect(cropperPanelSource).toContain("if (!enabled) {");
    expect(cropperPanelSource).toContain("return <FeatureFlagBanner loading={loading} enabled={enabled} errorMessage={featureFlagError} />;");
    expect(cropperPanelSource).toContain('aria-label="Crop image panel"');
  });
});
