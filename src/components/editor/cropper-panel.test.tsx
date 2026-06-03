import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const cropperPanelSource = readFileSync("src/components/editor/cropper-panel.tsx", "utf8");
const cropControlsSource = readFileSync("src/components/editor/crop-controls.tsx", "utf8");

describe("CropperPanel source", () => {
  it("renders react-easy-crop integration and accessibility wiring", () => {
    expect(cropperPanelSource).toContain('from "react-easy-crop"');
    expect(cropperPanelSource).toContain("aria-description");
    expect(cropperPanelSource).toContain("focusRef.current?.focus()");
    expect(cropperPanelSource).toContain("handleArrowKey");
    expect(cropperPanelSource).toContain("apiClient.cropImage");
    expect(cropperPanelSource).toContain("addProcessedPhoto");
  });

  it("provides crop controls for zoom, aspect ratio, and confirming crop", () => {
    expect(cropControlsSource).toContain("Crop zoom");
    expect(cropControlsSource).toContain("Crop aspect ratio");
    expect(cropControlsSource).toContain("Confirm crop");
  });
});
