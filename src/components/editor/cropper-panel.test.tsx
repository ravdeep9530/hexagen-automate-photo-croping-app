import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const cropperPanelSource = readFileSync("src/components/editor/cropper-panel.tsx", "utf8");
const cropControlsSource = readFileSync("src/components/editor/crop-controls.tsx", "utf8");

const expectSnippet = (source: string, snippet: string, message: string) => {
  if (!source.includes(snippet)) {
    throw new Error(`${message}\nMissing snippet: ${snippet}`);
  }
};

describe("CropperPanel accessibility source", () => {
  it("exposes screen reader instructions, live regions, and labelled controls", () => {
    expectSnippet(
      cropperPanelSource,
      'aria-label="Crop image panel"',
      "CropperPanel must expose a named landmark so the crop workflow can be found by assistive technology.",
    );
    expectSnippet(
      cropperPanelSource,
      "aria-description={ariaDescription}",
      "CropperPanel must provide a dedicated screen reader instruction string for the crop canvas.",
    );
    expectSnippet(
      cropperPanelSource,
      "aria-describedby={[descriptionId, errorMessage ? errorId : null].filter(Boolean).join(\" \")}",
      "CropperPanel must associate crop instructions and crop failures with the keyboard focus target.",
    );
    expectSnippet(
      cropperPanelSource,
      'aria-live="assertive"',
      "CropperPanel must announce crop failures immediately.",
    );
    expectSnippet(
      cropperPanelSource,
      'aria-live="polite"',
      "CropperPanel must announce crop submission progress without interrupting the user.",
    );
    expectSnippet(
      cropControlsSource,
      'aria-label="Crop zoom"',
      "Crop controls must label the zoom slider for screen readers.",
    );
    expectSnippet(
      cropControlsSource,
      'aria-label="Crop aspect ratio"',
      "Crop controls must label the aspect ratio selector for screen readers.",
    );
  });

  it("supports keyboard navigation and focus management for crop adjustments", () => {
    expectSnippet(
      cropperPanelSource,
      "focusRef.current?.focus()",
      "CropperPanel must move focus into the crop interaction surface when cropping becomes available.",
    );
    expectSnippet(
      cropperPanelSource,
      "tabIndex={0}",
      "CropperPanel must keep the crop interaction surface keyboard-focusable.",
    );
    expectSnippet(
      cropperPanelSource,
      "onKeyDown={handleKeyDown}",
      "CropperPanel must listen for keyboard crop nudges on the focused crop surface.",
    );
    expectSnippet(
      cropperPanelSource,
      "handleArrowKey(event.nativeEvent)",
      "CropperPanel must delegate arrow key handling to the crop controls hook.",
    );
    expectSnippet(
      cropperPanelSource,
      'event.key === "ArrowRight"',
      "CropperPanel must nudge the crop area when the user presses arrow keys.",
    );
    expectSnippet(
      cropperPanelSource,
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "CropperPanel must render a visible focus ring for keyboard users.",
    );
  });

  it("uses contrast-safe surfaces for overlays, banners, and confirmation actions", () => {
    expectSnippet(
      cropperPanelSource,
      "bg-card",
      "CropperPanel must keep the main panel on a card surface with readable default foreground contrast.",
    );
    expectSnippet(
      cropperPanelSource,
      "bg-muted",
      "CropperPanel crop overlay background should stay on the muted token family intended for readable overlays.",
    );
    expectSnippet(
      cropperPanelSource,
      'className="m-4 border-destructive/60 bg-destructive/5"',
      "CropperPanel crop failures must use the destructive banner treatment expected to remain readable.",
    );
    expectSnippet(
      cropControlsSource,
      "bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
      "Crop controls must pair the primary button background with the primary foreground token to maintain WCAG AA button contrast.",
    );
  });
});
