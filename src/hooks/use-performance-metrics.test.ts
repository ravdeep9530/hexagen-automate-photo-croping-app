import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  NavigationTimingEntryLike,
  PerformanceLike,
  ResourceTimingEntryLike,
} from "./use-performance-metrics";

vi.mock("react", () => ({
  useEffect: vi.fn(),
  useState: vi.fn((value: unknown) => [value, vi.fn()]),
}));

function createPerformanceStub(params: {
  resourceEntries?: ResourceTimingEntryLike[];
  navigationEntries?: NavigationTimingEntryLike[];
  now?: number;
}): PerformanceLike {
  const resourceEntries = params.resourceEntries ?? [];
  const navigationEntries = params.navigationEntries ?? [];

  return {
    now: () => params.now ?? 0,
    getEntriesByType: ((type: "resource" | "navigation") =>
      type === "resource" ? resourceEntries : navigationEntries) as PerformanceLike["getEntriesByType"],
  };
}

describe("use-performance-metrics helpers", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalLighthouseMetrics = (globalThis as typeof globalThis & {
    __LIGHTHOUSE_METRICS__?: Record<string, number>;
  }).__LIGHTHOUSE_METRICS__;

  beforeEach(() => {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "__LIGHTHOUSE_METRICS__");
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalLighthouseMetrics) {
      (
        globalThis as typeof globalThis & {
          __LIGHTHOUSE_METRICS__?: Record<string, number>;
        }
      ).__LIGHTHOUSE_METRICS__ = originalLighthouseMetrics;
    } else {
      Reflect.deleteProperty(globalThis, "__LIGHTHOUSE_METRICS__");
    }
  });

  it("collects bundle size from script and stylesheet resources", async () => {
    const { collectBundleSizeMetric } = await import("./use-performance-metrics");
    const performanceRef = createPerformanceStub({
      resourceEntries: [
        {
          name: "https://cdn.example.com/app.js",
          initiatorType: "script",
          transferSize: 1200,
        },
        {
          name: "https://cdn.example.com/app.css",
          encodedBodySize: 800,
        },
        {
          name: "https://cdn.example.com/photo.png",
          initiatorType: "img",
          transferSize: 6400,
        },
      ],
    });

    expect(collectBundleSizeMetric(performanceRef)).toEqual({
      name: "bundle_size_bytes",
      unit: "bytes",
      value: 2000,
    });
  });

  it("calculates time to interactive from the latest readiness marker", async () => {
    const { collectTimeToInteractiveMetric } = await import("./use-performance-metrics");
    expect(
      collectTimeToInteractiveMetric({
        navigationEntry: {
          startTime: 5,
          domInteractive: 40,
          loadEventEnd: 55,
        },
        interactiveAt: 72,
      }),
    ).toEqual({
      name: "time_to_interactive_ms",
      unit: "ms",
      value: 67,
    });
  });

  it("creates a snapshot from performance timing entries and ignores missing navigation", async () => {
    const { createPerformanceSnapshot } = await import("./use-performance-metrics");
    const performanceRef = createPerformanceStub({
      resourceEntries: [
        {
          name: "https://cdn.example.com/vendor.js?build=1",
          transferSize: 1500,
        },
        {
          name: "https://cdn.example.com/image.webp",
          transferSize: 7000,
        },
      ],
      navigationEntries: [],
      now: 90,
    });

    expect(createPerformanceSnapshot({ performanceRef, interactiveAt: 90 })).toEqual({
      bundleSize: {
        name: "bundle_size_bytes",
        unit: "bytes",
        value: 1500,
      },
      timeToInteractive: null,
    });
  });

  it("reports metrics to console, artifact output, and lighthouse sink without window", async () => {
    const { reportPerformanceMetrics } = await import("./use-performance-metrics");
    const log = vi.fn();
    const artifactWriter = vi.fn();
    const lighthouseSink = vi.fn();
    const snapshot = {
      bundleSize: {
        name: "bundle_size_bytes" as const,
        unit: "bytes" as const,
        value: 2048,
      },
      timeToInteractive: {
        name: "time_to_interactive_ms" as const,
        unit: "ms" as const,
        value: 321,
      },
    };

    const artifact = reportPerformanceMetrics(snapshot, {
      log,
      artifactWriter,
      lighthouseSink,
    });

    expect(artifact).toBe(
      JSON.stringify({
        bundleSizeBytes: 2048,
        timeToInteractiveMs: 321,
      }),
    );
    expect(log).toHaveBeenCalledWith(`PERFORMANCE_METRICS ${artifact}`);
    expect(artifactWriter).toHaveBeenCalledWith(artifact);
    expect(lighthouseSink).toHaveBeenCalledWith({
      bundleSizeBytes: 2048,
      timeToInteractiveMs: 321,
    });
    expect(
      (
        globalThis as typeof globalThis & {
          __LIGHTHOUSE_METRICS__?: Record<string, number>;
          window?: { __LIGHTHOUSE_METRICS__?: Record<string, number> };
        }
      ).__LIGHTHOUSE_METRICS__,
    ).toEqual({
      bundleSizeBytes: 2048,
      timeToInteractiveMs: 321,
    });
    expect(
      (
        globalThis as typeof globalThis & {
          window?: { __LIGHTHOUSE_METRICS__?: Record<string, number> };
        }
      ).window?.__LIGHTHOUSE_METRICS__,
    ).toEqual({
      bundleSizeBytes: 2048,
      timeToInteractiveMs: 321,
    });
  });
});
