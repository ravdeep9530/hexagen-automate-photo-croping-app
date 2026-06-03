import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { useCropControls } from "./use-crop-controls";

function TestComponent(): React.JSX.Element {
  const controls = useCropControls({
    aspectRatio: 16 / 9,
    initialCrop: { x: 12, y: -8 },
    initialZoom: 9,
    maxZoom: 4,
  });

  return React.createElement(
    "output",
    { "aria-label": "crop controls state" },
    `${controls.aspectRatio}|${controls.crop.x}|${controls.crop.y}|${controls.zoom}`,
  );
}

describe("useCropControls", () => {
  it("exposes configured state and clamps zoom to the configured maximum", () => {
    const markup = renderToStaticMarkup(React.createElement(TestComponent));

    expect(markup).toContain("1.7777777777777777|12|-8|4");
  });
});
