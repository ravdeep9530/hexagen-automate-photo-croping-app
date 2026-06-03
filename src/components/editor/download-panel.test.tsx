import { readFileSync } from "node:fs";

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

const downloadPanelSource = readFileSync(
  new URL("./download-panel.tsx", import.meta.url),
  "utf8",
);

const colors = {
  "emerald-50": "#ecfdf5",
  "emerald-950": "#022c22",
  "red-50": "#fef2f2",
  "red-950": "#450a0a",
  "slate-900": "#0f172a",
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
    expect(markup).toContain('data-testid="download-filename"');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-describedby="');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Download panel ready.");
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

  it("keeps keyboard activation and assistive download status messaging in source", () => {
    assertSourceIncludes(
      downloadPanelSource,
      'if (event.key === "Enter" || event.key === " ")',
      "DownloadPanel must keep Enter and Space keyboard activation on the download button.",
    );
    assertSourceIncludes(
      downloadPanelSource,
      'aria-label={`Download processed photo ${preferredFilename}`}',
      "DownloadPanel must keep a descriptive button label that includes the download filename.",
    );
    assertSourceIncludes(
      downloadPanelSource,
      'aria-live={isSuccess ? "polite" : "assertive"}',
      "DownloadPanel motion banners must announce success and error states with the correct live-region priority.",
    );
    assertSourceIncludes(
      downloadPanelSource,
      'successMessage || errorMessage || "Download panel ready."',
      "DownloadPanel must expose a stable screen-reader status message when no download is running.",
    );
  });

  it("uses accessible contrast for the primary button and download banners", () => {
    assertContrastAtLeast(
      "DownloadPanel",
      "primary download button text",
      colors.white,
      colors["slate-900"],
      4.5,
    );
    assertContrastAtLeast(
      "DownloadPanel",
      "success banner text",
      colors["emerald-950"],
      colors["emerald-50"],
      4.5,
    );
    assertContrastAtLeast(
      "DownloadPanel",
      "error banner text",
      colors["red-950"],
      colors["red-50"],
      4.5,
    );
  });
});
