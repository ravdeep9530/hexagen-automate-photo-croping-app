import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/editor/error-banner.tsx", "utf8");

const expectSnippet = (snippet: string) => {
  expect(source).toContain(snippet);
};

describe("ErrorBanner source", () => {
  it("uses framer-motion transitions and lucide-react icons", () => {
    expectSnippet('import { AnimatePresence, motion } from "framer-motion"');
    expectSnippet('import { AlertCircle, TriangleAlert, XCircle } from "lucide-react"');
    expectSnippet('initial={{ opacity: 0, y: -8 }}');
    expectSnippet('animate={{ opacity: 1, y: 0 }}');
    expectSnippet('exit={{ opacity: 0, y: -8 }}');
  });

  it("renders distinct messages for network, server, and client errors", () => {
    expectSnippet('error.status === 0 || error.code === "network_error"');
    expectSnippet('title: "Network error"');
    expectSnippet('message: "Check your connection and try again."');
    expectSnippet('if (error.status >= 500)');
    expectSnippet('title: "Server error"');
    expectSnippet('message: "Our server hit a problem. Please try again in a moment."');
    expectSnippet('title: "Action required"');
    expectSnippet('return "Upload failed"');
    expectSnippet('return "Validation failed"');
    expectSnippet('return "Crop failed"');
    expectSnippet('return "Download failed"');
  });

  it("includes aria-live semantics and screen reader support", () => {
    expectSnippet('aria-live={tone.politeness}');
    expectSnippet('aria-atomic="true"');
    expectSnippet('<span className="sr-only">{tone.title}: </span>');
    expectSnippet('className="border-destructive/60 bg-destructive/5"');
  });
});
