import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const downloadPanelSource = readFileSync("src/components/editor/download-panel.tsx", "utf8");

describe("DownloadPanel source", () => {
  it("renders download button, filename, and accessibility labels", () => {
    expect(downloadPanelSource).toContain('aria-label="Download processed photo"');
    expect(downloadPanelSource).toContain("Processed photo ready");
    expect(downloadPanelSource).toContain("aria-label={`Download processed photo ${filename}`}");
    expect(downloadPanelSource).toContain("onKeyDown={handleKeyDown}");
    expect(downloadPanelSource).toContain('aria-live="polite"');
    expect(downloadPanelSource).toContain("sr-only");
  });

  it("calls the download api client, handles blob download, and shows animated banners", () => {
    expect(downloadPanelSource).toContain("apiClient.downloadCroppedPhoto");
    expect(downloadPanelSource).toContain("result.data.blob");
    expect(downloadPanelSource).toContain("URL.createObjectURL");
    expect(downloadPanelSource).toContain("document.createElement(\"a\")");
    expect(downloadPanelSource).toContain("anchor.download = filename");
    expect(downloadPanelSource).toContain("AnimatePresence");
    expect(downloadPanelSource).toContain("motion.div");
    expect(downloadPanelSource).toContain("Download started");
    expect(downloadPanelSource).toContain("Download failed");
  });

  it("manages downloading, success, and error states", () => {
    expect(downloadPanelSource).toContain('type DownloadStatus = "idle" | "downloading" | "success" | "error"');
    expect(downloadPanelSource).toContain('setStatus("downloading")');
    expect(downloadPanelSource).toContain('setStatus("success")');
    expect(downloadPanelSource).toContain('setStatus("error")');
    expect(downloadPanelSource).toContain('disabled={isDownloading}');
    expect(downloadPanelSource).toContain('Loader2');
  });
});
