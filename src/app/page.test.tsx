import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const pageSource = readFileSync("src/app/page.tsx", "utf8");

describe("app page source", () => {
  it("renders the upload, validation, cropper, and download flow in order", () => {
    const uploadIndex = pageSource.indexOf("<UploadZone");
    const validationIndex = pageSource.indexOf("<ValidationBanner");
    const cropperIndex = pageSource.indexOf("<CropperPanel");
    const downloadIndex = pageSource.indexOf("<DownloadPanel");

    expect(uploadIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeGreaterThan(uploadIndex);
    expect(cropperIndex).toBeGreaterThan(validationIndex);
    expect(downloadIndex).toBeGreaterThan(cropperIndex);
  });

  it("wires the shared store and api clients into each workflow component", () => {
    expect(pageSource).toContain("useSyncExternalStore(store.subscribe, store.getState, store.getState)");
    expect(pageSource).toContain("store={store}");
    expect(pageSource).toContain("apiClient={uploadZoneApiClient}");
    expect(pageSource).toContain("apiClient={cropperPanelApiClient}");
    expect(pageSource).toContain("apiClient={downloadPanelApiClient}");
    expect(pageSource).toContain("apiClient.validateImage({ imageId })");
    expect(pageSource).toContain("store.getState().addValidationFailure");
    expect(pageSource).toContain("<ErrorBanner error={workflowError?.error ?? null} kind={workflowError?.kind ?? \"upload\"} />");
  });

  it("includes page landmarks, live regions, and keyboard navigation affordances", () => {
    expect(pageSource).toContain("<main");
    expect(pageSource).toContain('aria-live=\"polite\"');
    expect(pageSource).toContain("Skip to photo workflow");
    expect(pageSource).toContain('aria-label=\"Photo cropping workflow\"');
    expect(pageSource).toContain("onUploaded={(imageId) => {");
    expect(pageSource).toContain("onCropConfirmed={(photoId) => {");
    expect(pageSource).toContain("onDownloaded={(_photoId, filename) => {");
  });
});
