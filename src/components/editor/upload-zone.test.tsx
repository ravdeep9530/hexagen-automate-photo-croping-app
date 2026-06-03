import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const uploadZoneSource = readFileSync("src/components/editor/upload-zone.tsx", "utf8");
const fileDropSource = readFileSync("src/hooks/use-file-drop.ts", "utf8");

const expectSnippet = (source: string, snippet: string, message: string) => {
  if (!source.includes(snippet)) {
    throw new Error(`${message}\nMissing snippet: ${snippet}`);
  }
};

describe("UploadZone accessibility source", () => {
  it("wires screen reader labels and live regions for upload feedback", () => {
    expectSnippet(
      uploadZoneSource,
      'aria-label="Image upload"',
      "UploadZone must expose a named section landmark for screen reader navigation.",
    );
    expectSnippet(
      uploadZoneSource,
      'aria-label="Upload JPG, PNG, or WebP image"',
      "UploadZone must label the drop target with accepted file types.",
    );
    expectSnippet(
      uploadZoneSource,
      'aria-label="Choose image file"',
      "UploadZone must label the hidden file input so assistive technology can announce it.",
    );
    expectSnippet(
      uploadZoneSource,
      'aria-label="Preview zoom"',
      "UploadZone must label the preview zoom control for screen reader users.",
    );
    expectSnippet(
      uploadZoneSource,
      'aria-live="assertive"',
      "UploadZone must announce upload errors in an assertive live region.",
    );
    expectSnippet(
      uploadZoneSource,
      'aria-live="polite"',
      "UploadZone must announce non-error upload status updates in a polite live region.",
    );
    expectSnippet(
      uploadZoneSource,
      'className="sr-only"',
      "UploadZone must keep the file input screen-reader-visible while visually hiding it.",
    );
  });

  it("supports keyboard navigation on the drop target and actionable error association", () => {
    expectSnippet(
      uploadZoneSource,
      "{...dropZoneProps}",
      "UploadZone must spread the hook-provided keyboard and drag handlers onto the drop target.",
    );
    expectSnippet(
      fileDropSource,
      'role: "button"',
      "The file drop hook must expose button semantics for keyboard users.",
    );
    expectSnippet(
      fileDropSource,
      'tabIndex: disabled ? -1 : 0',
      "The file drop hook must keep the drop target in the tab order unless disabled.",
    );
    expectSnippet(
      fileDropSource,
      'if (event.key === "Enter" || event.key === " ")',
      "The file drop hook must support Enter and Space to activate upload.",
    );
    expectSnippet(
      fileDropSource,
      "event.currentTarget.click()",
      "The file drop hook must translate keyboard activation into the file-picker click.",
    );
    expectSnippet(
      uploadZoneSource,
      "aria-describedby={errorMessage ? errorId : undefined}",
      "UploadZone errors must be linked to the drop target so screen readers announce actionable failure text.",
    );
    expectSnippet(
      uploadZoneSource,
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "UploadZone must render a visible keyboard focus indicator on the drop target.",
    );
  });

  it("uses contrast-safe token pairings for the drop zone and failure banner", () => {
    expectSnippet(
      uploadZoneSource,
      "bg-background hover:bg-muted/50",
      "UploadZone idle state should keep the drop zone on a high-contrast surface rather than a low-contrast custom color.",
    );
    expectSnippet(
      uploadZoneSource,
      "text-sm font-medium",
      "UploadZone primary instructions should use the default foreground text style for WCAG AA readable copy.",
    );
    expectSnippet(
      uploadZoneSource,
      "text-xs text-muted-foreground",
      "UploadZone secondary guidance should use the muted foreground token designed for readable helper text.",
    );
    expectSnippet(
      uploadZoneSource,
      'className="border-destructive/60 bg-destructive/5"',
      "UploadZone errors must keep the destructive banner on a pale background so destructive text/icon treatment remains readable.",
    );
    expect(uploadZoneSource).not.toContain("text-white/50");
  });
});
