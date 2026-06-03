import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import DownloadPanel, { triggerBrowserDownload } from "./download-panel";
import type { ProcessedPhoto } from "../../types/entities";

const processedPhoto: ProcessedPhoto = {
  created_at: "2024-01-01T00:00:00Z",
  crop_metadata: { height: 100, width: 100, x: 0, y: 0 },
  id: "photo-1",
  processed_url: "/processed/photo-1.jpg",
  uploaded_image_id: "image-1",
  validation_failures: [],
};

describe("DownloadPanel", () => {
  it("renders the filename and accessible download button", () => {
    const markup = renderToStaticMarkup(
      <DownloadPanel
        downloadCroppedPhoto={vi.fn()}
        filename="portrait-cropped.jpg"
        photo={processedPhoto}
      />,
    );

    expect(markup).toContain("Download processed photo");
    expect(markup).toContain("portrait-cropped.jpg");
    expect(markup).toContain('aria-label="Download processed photo portrait-cropped.jpg"');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-live="polite"');
  });

  it("creates a binary object URL and clicks a temporary link", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const anchor = {
      click,
      download: "",
      href: "",
      rel: "",
      remove,
      style: { display: "" },
    } as unknown as HTMLAnchorElement;
    const documentStub = {
      body: { appendChild },
      createElement: vi.fn(() => anchor),
    } as unknown as Document;
    const blob = new Blob(["cropped image"], { type: "image/jpeg" });
    const revokeObjectURL = vi.fn();

    triggerBrowserDownload(
      {
        content_type: "image/jpeg",
        file: blob,
        filename: "download.jpg",
      },
      {
        createObjectURL: vi.fn(() => "blob:download"),
        document: documentStub,
        revokeObjectURL,
      },
    );

    expect(documentStub.createElement).toHaveBeenCalledWith("a");
    expect(anchor.href).toBe("blob:download");
    expect(anchor.download).toBe("download.jpg");
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");
  });
});
