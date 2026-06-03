import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const downloadPanelSource = readFileSync("src/components/editor/download-panel.tsx", "utf8");

const expectSnippet = (source: string, snippet: string, message: string) => {
  if (!source.includes(snippet)) {
    throw new Error(`${message}\nMissing snippet: ${snippet}`);
  }
};

describe("DownloadPanel accessibility source", () => {
  it("labels the download workflow and exposes status updates to screen readers", () => {
    expectSnippet(
      downloadPanelSource,
      'aria-label="Download processed photo"',
      "DownloadPanel must expose a named section landmark for the download workflow.",
    );
    expectSnippet(
      downloadPanelSource,
      "aria-describedby={statusId}",
      "DownloadPanel must point the section to the status region that explains current download state.",
    );
    expectSnippet(
      downloadPanelSource,
      "aria-label={`Download processed photo ${filename}`}",
      "DownloadPanel must announce which processed file the download button will retrieve.",
    );
    expectSnippet(
      downloadPanelSource,
      '<p id={statusId} className="sr-only" aria-live="polite">',
      "DownloadPanel must expose download status changes through a polite screen-reader-only live region.",
    );
    expectSnippet(
      downloadPanelSource,
      'aria-live={banner === "error" ? "assertive" : "polite"}',
      "DownloadPanel banners must escalate failures while keeping success announcements polite.",
    );
    expectSnippet(
      downloadPanelSource,
      'aria-atomic="true"',
      "DownloadPanel banners must announce the full result message each time status changes.",
    );
  });

  it("supports keyboard download activation with actionable success and failure feedback", () => {
    expectSnippet(
      downloadPanelSource,
      "onKeyDown={handleKeyDown}",
      "DownloadPanel must listen for keyboard activation on the download button.",
    );
    expectSnippet(
      downloadPanelSource,
      'if (event.key !== "Enter" && event.key !== " ")',
      "DownloadPanel must support Enter and Space as keyboard activation keys.",
    );
    expectSnippet(
      downloadPanelSource,
      "event.preventDefault()",
      "DownloadPanel must prevent the browser from scrolling on Space when activating download by keyboard.",
    );
    expectSnippet(
      downloadPanelSource,
      "Download started",
      "DownloadPanel must show an actionable success banner title once the browser download has been triggered.",
    );
    expectSnippet(
      downloadPanelSource,
      "Download failed",
      "DownloadPanel must show an actionable failure banner title when download preparation fails.",
    );
    expectSnippet(
      downloadPanelSource,
      "disabled={isDownloading}",
      "DownloadPanel must disable repeated activation while a download is already in progress.",
    );
  });

  it("uses contrast-safe styling for the primary button and animated result banners", () => {
    expectSnippet(
      downloadPanelSource,
      "bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
      "DownloadPanel must pair the primary action background with the primary foreground token to maintain WCAG AA button contrast.",
    );
    expectSnippet(
      downloadPanelSource,
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "DownloadPanel must render a visible focus ring for keyboard users.",
    );
    expectSnippet(
      downloadPanelSource,
      'banner === "success" && "border-emerald-500/60 bg-emerald-500/10 text-emerald-700"',
      "DownloadPanel success feedback must keep readable emerald text against a low-opacity emerald surface.",
    );
    expectSnippet(
      downloadPanelSource,
      'banner === "error" && "border-destructive/60 bg-destructive/5"',
      "DownloadPanel error feedback must keep destructive messaging on a pale destructive surface.",
    );
    expect(downloadPanelSource).not.toContain("text-white/50");
  });
});
