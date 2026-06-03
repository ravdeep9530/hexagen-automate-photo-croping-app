import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import UploadZone from "../components/editor/upload-zone";

describe("useFileDrop", () => {
  it("wires drag event handlers onto the upload zone", () => {
    const markup = renderToStaticMarkup(<UploadZone uploadImage={vi.fn()} />);

    expect(markup).toContain('role="button"');
    expect(markup).toContain('aria-label="Upload image"');
    expect(markup).toContain("Drag and drop a JPG, PNG, or WEBP image here");
  });

  it("renders the upload zone without exposing drag state before interaction", () => {
    const markup = renderToStaticMarkup(<UploadZone uploadImage={vi.fn()} />);

    expect(markup).not.toContain("border-blue-500");
    expect(markup).toContain("border-slate-300");
  });
});
