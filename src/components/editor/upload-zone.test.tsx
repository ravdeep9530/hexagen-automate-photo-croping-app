import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createPhotoStore } from "../../store/photo-store";
import UploadZone from "./upload-zone";

const uploadZoneSource = readFileSync(new URL("./upload-zone.tsx", import.meta.url), "utf8");

const colors = {
  "red-50": "#fef2f2",
  "red-950": "#450a0a",
  "slate-600": "#475569",
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

function getContrastRatio(
  foreground: keyof typeof colors,
  background: keyof typeof colors,
): number {
  const foregroundLuminance = getRelativeLuminance(colors[foreground]);
  const backgroundLuminance = getRelativeLuminance(colors[background]);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function assertContrastAtLeast(
  componentName: string,
  usage: string,
  foreground: keyof typeof colors,
  background: keyof typeof colors,
  minimumRatio: number,
): void {
  const actualRatio = getContrastRatio(foreground, background);

  if (actualRatio < minimumRatio) {
    throw new Error(
      `${componentName} ${usage} contrast is ${actualRatio.toFixed(2)}:1 for ${foreground} on ${background}; expected at least ${minimumRatio}:1 for WCAG AA.`,
    );
  }

  expect(actualRatio).toBeGreaterThanOrEqual(minimumRatio);
}

describe("UploadZone", () => {
  it("renders screen-reader labels and accepted file types for the upload control", () => {
    const markup = renderToStaticMarkup(<UploadZone uploadImage={vi.fn()} />);

    expect(markup).toContain('aria-label="Upload image"');
    expect(markup).toContain('role="button"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('aria-label="Choose an image to upload"');
    expect(markup).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(markup).toContain("Drag and drop a JPG, PNG, or WEBP image here");
    expect(markup).toContain("or press Enter/Space to browse for a file");
  });

  it("does not render a preview before a file is selected", () => {
    const store = createPhotoStore();
    const markup = renderToStaticMarkup(<UploadZone store={store} uploadImage={vi.fn()} />);

    expect(markup).not.toContain("Selected upload preview");
    expect(store.getState().images).toEqual([]);
  });

  it("wires keyboard activation, assertive upload errors, and preview alt text in source", () => {
    assertSourceIncludes(
      uploadZoneSource,
      'if (event.key === "Enter" || event.key === " ")',
      "UploadZone must keep Enter and Space keyboard activation on the drop target.",
    );
    assertSourceIncludes(
      uploadZoneSource,
      '<ErrorBanner error={error} operation="upload" />',
      "UploadZone must route upload failures through the shared error banner.",
    );
    assertSourceIncludes(
      uploadZoneSource,
      'alt="Selected upload preview"',
      "UploadZone preview images must stay visible to screen readers with descriptive alt text.",
    );
  });

  it("uses WCAG AA color contrast for upload instructions and upload errors", () => {
    assertContrastAtLeast(
      "UploadZone",
      "secondary instructions",
      "slate-600",
      "white",
      4.5,
    );
    assertContrastAtLeast("UploadZone", "error banner text", "red-950", "red-50", 4.5);
  });
});
