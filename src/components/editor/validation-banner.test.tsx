import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const validationBannerSource = readFileSync("src/components/editor/validation-banner.tsx", "utf8");

const expectSnippet = (source: string, snippet: string, message: string) => {
  if (!source.includes(snippet)) {
    throw new Error(`${message}\nMissing snippet: ${snippet}`);
  }
};

describe("ValidationBanner accessibility source", () => {
  it("announces validation failures with labelled live-region semantics", () => {
    expectSnippet(
      validationBannerSource,
      'aria-live="assertive"',
      "ValidationBanner must announce validation failures in an assertive live region.",
    );
    expectSnippet(
      validationBannerSource,
      'aria-atomic="true"',
      "ValidationBanner must announce the full failure payload each time the alert updates.",
    );
    expectSnippet(
      validationBannerSource,
      "aria-labelledby={titleId}",
      "ValidationBanner must expose its title as the accessible alert label.",
    );
    expectSnippet(
      validationBannerSource,
      "aria-describedby={descriptionId}",
      "ValidationBanner must expose its failure list as the accessible alert description.",
    );
    expectSnippet(
      validationBannerSource,
      'className="sr-only"',
      "ValidationBanner must include a screen-reader-only summary for users who do not visually inspect the list.",
    );
    expectSnippet(
      validationBannerSource,
      'aria-label="Validation failures"',
      "ValidationBanner must label the list of validation failures for screen reader users.",
    );
  });

  it("keeps every failure message visible to assistive tech with actionable prefixes", () => {
    expectSnippet(
      validationBannerSource,
      "getValidationSummary(failures)",
      "ValidationBanner must expose an aggregate summary so users hear how many failures need attention.",
    );
    expectSnippet(
      validationBannerSource,
      'label: "Image validation error"',
      "ValidationBanner must prefix image-related failures with an actionable screen reader label.",
    );
    expectSnippet(
      validationBannerSource,
      'label: "File validation error"',
      "ValidationBanner must prefix file-related failures with an actionable screen reader label.",
    );
    expectSnippet(
      validationBannerSource,
      'label: "Validation error"',
      "ValidationBanner must still describe uncategorized failures for screen reader users.",
    );
    expectSnippet(
      validationBannerSource,
      '<span className="sr-only">{label}: </span>',
      "ValidationBanner must prepend each failure with a screen-reader-only category so the message is actionable when announced.",
    );
  });

  it("uses a readable destructive banner treatment for validation errors", () => {
    expectSnippet(
      validationBannerSource,
      'className="border-destructive/60 bg-destructive/5"',
      "ValidationBanner must keep validation errors on the destructive alert surface expected to meet accessible contrast.",
    );
    expectSnippet(
      validationBannerSource,
      "AlertCircle aria-hidden",
      "ValidationBanner decorative icons must stay hidden from screen readers so the error content remains concise.",
    );
    expect(validationBannerSource).not.toContain("text-white/50");
  });
});
