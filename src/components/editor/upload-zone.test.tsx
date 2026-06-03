import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createPhotoStore } from "../../store/photo-store";
import UploadZone from "./upload-zone";

describe("UploadZone", () => {
  it("renders an accessible upload control with accepted file types", () => {
    const markup = renderToStaticMarkup(<UploadZone uploadImage={vi.fn()} />);

    expect(markup).toContain('aria-label="Upload image"');
    expect(markup).toContain('role="button"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(markup).toContain("Drag and drop a JPG, PNG, or WEBP image here");
  });

  it("does not render a preview before a file is selected", () => {
    const store = createPhotoStore();
    const markup = renderToStaticMarkup(<UploadZone store={store} uploadImage={vi.fn()} />);

    expect(markup).not.toContain("Selected upload preview");
    expect(store.getState().images).toEqual([]);
  });
});
