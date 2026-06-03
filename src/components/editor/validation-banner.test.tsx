import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createPhotoStore } from "../../store/photo-store";
import type { ValidationFailure } from "../../types/entities";
import { ValidationBanner } from "./validation-banner";

const validationBannerSource = readFileSync(
  new URL("./validation-banner.tsx", import.meta.url),
  "utf8",
);

const validationFailures: ValidationFailure[] = [
  {
    type: "face_not_detected",
    detail: "A face could not be detected in the uploaded image.",
  },
  {
    type: "low_resolution",
    detail: "The uploaded image must be at least 1024x1024 pixels.",
  },
];

const colors = {
  "red-50": "#fef2f2",
  "red-950": "#450a0a",
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

function assertContrastAtLeast(
  componentName: string,
  usage: string,
  foregroundHex: string,
  backgroundHex: string,
  minimumRatio: number,
): void {
  const foregroundLuminance = getRelativeLuminance(foregroundHex);
  const backgroundLuminance = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  const actualRatio = (lighter + 0.05) / (darker + 0.05);

  if (actualRatio < minimumRatio) {
    throw new Error(
      `${componentName} ${usage} contrast is ${actualRatio.toFixed(2)}:1; expected at least ${minimumRatio}:1 for WCAG AA.`,
    );
  }

  expect(actualRatio).toBeGreaterThanOrEqual(minimumRatio);
}

describe("ValidationBanner", () => {
  it("renders nothing when the store has no validation failures", () => {
    const store = createPhotoStore();

    expect(renderToStaticMarkup(<ValidationBanner store={store} />)).toBe("");
  });

  it("renders validation failures from the store with matching error labels and icons", () => {
    const store = createPhotoStore();

    validationFailures.forEach((failure) => {
      store.getState().addValidationFailure(failure);
    });

    const markup = renderToStaticMarkup(<ValidationBanner store={store} />);

    expect(markup).toContain("Validation failed");
    expect(markup).toContain("Face not detected");
    expect(markup).toContain("Low resolution");
    expect(markup).toContain(validationFailures[0].detail);
    expect(markup).toContain(validationFailures[1].detail);
    expect(markup).toContain('data-icon="scan-face"');
    expect(markup).toContain('data-icon="image-off"');
  });

  it("announces validation failures through an accessible live region", () => {
    const store = createPhotoStore();

    store.getState().addValidationFailure({
      type: "unexpected_error",
      detail: "The image could not be validated because the backend timed out.",
    });

    const markup = renderToStaticMarkup(<ValidationBanner store={store} />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain("The uploaded image has 1 validation failure.");
    expect(markup).toContain('aria-label="Validation failures"');
    expect(markup).toContain('data-icon="triangle-alert"');
  });

  it("keeps a screen-reader summary and visible failure details in source", () => {
    assertSourceIncludes(
      validationBannerSource,
      '<p className={screenReaderOnlyClassName}>',
      "ValidationBanner must retain a screen-reader-only summary for aggregate failures.",
    );
    assertSourceIncludes(
      validationBannerSource,
      '<ul aria-label="Validation failures" className="mt-3 space-y-3">',
      "ValidationBanner must keep the failures list labelled for assistive technology.",
    );
    assertSourceIncludes(
      validationBannerSource,
      'aria-hidden="true"',
      "ValidationBanner icons must remain hidden from screen readers so the text label is announced once.",
    );
  });

  it("uses WCAG AA contrast for validation banner text", () => {
    assertContrastAtLeast(
      "ValidationBanner",
      "alert text",
      colors["red-950"],
      colors["red-50"],
      4.5,
    );
  });
});
