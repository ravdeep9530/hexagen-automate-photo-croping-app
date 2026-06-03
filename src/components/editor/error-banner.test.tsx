import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ApiError } from "../../types/entities";
import { ErrorBanner } from "./error-banner";

const errorBannerSource = readFileSync(new URL("./error-banner.tsx", import.meta.url), "utf8");

function createError(overrides: Partial<ApiError>): ApiError {
  return {
    code: "upload_failed",
    message: "Something went wrong.",
    status: 400,
    ...overrides,
  };
}

function assertSourceIncludes(source: string, snippet: string, guidance: string): void {
  if (!source.includes(snippet)) {
    throw new Error(`${guidance} Missing source snippet: ${snippet}`);
  }
}

describe("ErrorBanner", () => {
  it("renders the client-facing upload message for client errors", () => {
    const markup = renderToStaticMarkup(
      <ErrorBanner
        error={createError({
          code: "invalid_upload",
          message: "Only JPG, PNG, and WEBP images are supported.",
          status: 400,
        })}
        operation="upload"
      />,
    );

    expect(markup).toContain("Upload error");
    expect(markup).toContain("Only JPG, PNG, and WEBP images are supported.");
    expect(markup).toContain('data-icon="circle-alert"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain('aria-atomic="true"');
  });

  it("renders a network message for validation errors caused by connectivity issues", () => {
    const markup = renderToStaticMarkup(
      <ErrorBanner
        error={createError({
          code: "network_error",
          message: "Network request failed",
          status: 0,
        })}
        operation="validation"
      />,
    );

    expect(markup).toContain("Connection problem");
    expect(markup).toContain(
      "We couldn&#x27;t validate the image because the connection was interrupted. Check your internet connection and try again.",
    );
    expect(markup).toContain('data-icon="wifi-off"');
  });

  it("renders a server message for crop failures returned by the backend", () => {
    const markup = renderToStaticMarkup(
      <ErrorBanner
        error={createError({
          code: "crop_failed",
          message: "Gateway timeout",
          status: 503,
        })}
        operation="crop"
      />,
    );

    expect(markup).toContain("Crop unavailable");
    expect(markup).toContain(
      "The server couldn&#x27;t crop the image right now. Try again in a moment.",
    );
    expect(markup).toContain('data-icon="server-crash"');
  });

  it("renders operation-specific client errors for downloads", () => {
    const markup = renderToStaticMarkup(
      <ErrorBanner
        error={createError({
          code: "download_failed",
          message: "The processed photo could not be found.",
          status: 404,
        })}
        operation="download"
      />,
    );

    expect(markup).toContain("Download error");
    expect(markup).toContain("The processed photo could not be found.");
    expect(markup).toContain('data-icon="circle-alert"');
  });

  it("keeps framer-motion transitions and a screen-reader summary in source", () => {
    assertSourceIncludes(
      errorBannerSource,
      'import { AnimatePresence, motion } from "framer-motion";',
      "ErrorBanner must use framer-motion for banner transitions.",
    );
    assertSourceIncludes(
      errorBannerSource,
      "<AnimatePresence initial={false}>",
      "ErrorBanner must wrap alerts in AnimatePresence for mount and unmount transitions.",
    );
    assertSourceIncludes(
      errorBannerSource,
      '<motion.div {...bannerMotionProps}>',
      "ErrorBanner must animate the banner container with motion.div.",
    );
    assertSourceIncludes(
      errorBannerSource,
      '<p className={screenReaderOnlyClassName}>',
      "ErrorBanner must keep a screen-reader-only summary for assistive technology.",
    );
  });
});
