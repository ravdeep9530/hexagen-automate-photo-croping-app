import { readFileSync } from "node:fs";

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/use-feature-flag", async () => {
  const actual = await vi.importActual<typeof import("../../hooks/use-feature-flag")>(
    "../../hooks/use-feature-flag",
  );

  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  };
});

import { useFeatureFlag } from "../../hooks/use-feature-flag";
import CropperPanel from "./cropper-panel";
import type { UploadedImage } from "../../types/entities";

const uploadedImage: UploadedImage = {
  filename: "portrait.jpg",
  id: "image-1",
  status: "uploaded",
  uploaded_at: "2024-01-01T00:00:00Z",
  user_id: "user-1",
};

const cropperPanelSource = readFileSync(new URL("./cropper-panel.tsx", import.meta.url), "utf8");

const colors = {
  "blue-50": "#eff6ff",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",
  "slate-900": "#0f172a",
  white: "#ffffff",
} as const;

function assertSourceIncludes(source: string, snippet: string, guidance: string): void {
  if (!source.includes(snippet)) {
    throw new Error(`${guidance} Missing source snippet: ${snippet}`);
  }
}

function getRelativeLuminance(hex: string): number {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16));

  if (channels === undefined) {
    throw new Error(`Unable to parse color value ${hex}.`);
  }

  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const foregroundLuminance = getRelativeLuminance(foregroundHex);
  const backgroundLuminance = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function blendColors(
  foregroundHex: string,
  backgroundHex: string,
  alpha: number,
): string {
  const foregroundChannels = foregroundHex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16));
  const backgroundChannels = backgroundHex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16));

  if (foregroundChannels === undefined || backgroundChannels === undefined) {
    throw new Error("Unable to blend overlay colors for CropperPanel.");
  }

  return `#${foregroundChannels
    .map((channel, index) =>
      Math.round(channel * alpha + backgroundChannels[index] * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function assertContrastAtLeast(
  componentName: string,
  usage: string,
  foregroundHex: string,
  backgroundHex: string,
  minimumRatio: number,
): void {
  const actualRatio = getContrastRatio(foregroundHex, backgroundHex);

  if (actualRatio < minimumRatio) {
    throw new Error(
      `${componentName} ${usage} contrast is ${actualRatio.toFixed(2)}:1; expected at least ${minimumRatio}:1 for WCAG AA.`,
    );
  }

  expect(actualRatio).toBeGreaterThanOrEqual(minimumRatio);
}

const useFeatureFlagMock = vi.mocked(useFeatureFlag);

describe("CropperPanel", () => {
  beforeEach(() => {
    useFeatureFlagMock.mockReturnValue({
      enabled: false,
      errorMessage: null,
      refetch: vi.fn(),
      status: "loading",
    });
  });

  it("renders fallback guidance while the feature flag status is still loading", () => {
    const markup = renderToStaticMarkup(
      <CropperPanel image={uploadedImage} imageUrl="blob:photo-preview" />,
    );

    expect(markup).toContain("Checking crop access");
    expect(markup).toContain("Cropping access is controlled by a feature flag");
    expect(markup).not.toContain("Interactive image crop area");
    expect(markup).not.toContain("Confirm crop");
  });

  it("renders the enabled cropper with screen-reader guidance and live status messaging", () => {
    useFeatureFlagMock.mockReturnValue({
      enabled: true,
      errorMessage: null,
      refetch: vi.fn(),
      status: "enabled",
    });

    const markup = renderToStaticMarkup(
      <CropperPanel
        image={uploadedImage}
        imageAlt="uploaded portrait"
        imageUrl="blob:photo-preview"
      />,
    );

    expect(markup).toContain('aria-label="Image crop area"');
    expect(markup).toContain('aria-roledescription="image cropper"');
    expect(markup).toContain('role="application"');
    expect(markup).toContain("Use the crop editor to frame uploaded portrait.");
    expect(markup).toContain('aria-label="Adjust crop zoom"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Confirm crop");
  });

  it("keeps arrow-key crop movement and actionable status announcements in source", () => {
    assertSourceIncludes(
      cropperPanelSource,
      'controls.handleKeyDown(event);',
      "CropperPanel must continue delegating keyboard movement to the crop-controls hook.",
    );
    assertSourceIncludes(
      cropperPanelSource,
      'event.key.startsWith("Arrow")',
      "CropperPanel must keep arrow-key navigation for the crop region.",
    );
    assertSourceIncludes(
      cropperPanelSource,
      'aria-description="Interactive image crop area. Arrow keys move the crop area. Zoom and aspect ratio controls are below."',
      "CropperPanel must describe keyboard usage to screen readers.",
    );
    assertSourceIncludes(
      cropperPanelSource,
      'setStatusMessage(`Crop moved with ${event.key.replace("Arrow", "").toLowerCase()} arrow.`);',
      "CropperPanel must report crop movement through its live status region.",
    );
  });

  it("uses accessible contrast for crop controls and the crop overlay", () => {
    const overlayBackdrop = blendColors(colors["slate-900"], colors.white, 0.55);

    assertContrastAtLeast(
      "CropperPanel",
      "confirm crop button text",
      colors.white,
      colors["blue-600"],
      4.5,
    );
    assertContrastAtLeast(
      "CropperPanel",
      "selected aspect ratio button text",
      colors["blue-700"],
      colors["blue-50"],
      4.5,
    );
    assertContrastAtLeast(
      "CropperPanel",
      "crop overlay frame",
      colors.white,
      overlayBackdrop,
      3,
    );
  });
});
