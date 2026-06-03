import {
  calculateBundleSize,
  createPerformanceMetricsArtifact,
  createPerformanceMetricsCollector,
} from "./use-performance-metrics";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("calculateBundleSize", () => {
  it("sums JavaScript bundle resources using available transfer sizes", () => {
    expect(
      calculateBundleSize([
        {
          initiatorType: "script",
          name: "/_next/static/chunks/main.js",
          transferSize: 1_024,
        },
        {
          encodedBodySize: 2_048,
          initiatorType: "fetch",
          name: "/_next/static/chunks/vendor.mjs",
        },
        {
          decodedBodySize: 512,
          initiatorType: "css",
          name: "/styles/app.css",
        },
      ]),
    ).toBe(3_072);
  });
});

describe("createPerformanceMetricsCollector", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports bundle size immediately and time to interactive after polling", () => {
    vi.useFakeTimers();

    const logger = { info: vi.fn() };
    const timestamps = ["2026-06-03T00:00:00.000Z", "2026-06-03T00:00:01.000Z"];
    let interactive = false;

    const collector = createPerformanceMetricsCollector({
      checkInteractive: () => interactive,
      getBundleEntries: () => [
        {
          initiatorType: "script",
          name: "/_next/static/chunks/main.js",
          transferSize: 4_096,
        },
      ],
      logger,
      now: () => vi.getTimerCount() * 100,
      pollIntervalMs: 100,
      timestampFactory: () => timestamps.shift() ?? "2026-06-03T00:00:02.000Z",
    });

    collector.start();

    expect(collector.getMetrics()).toEqual([
      {
        name: "bundle_size_bytes",
        timestamp: "2026-06-03T00:00:00.000Z",
        unit: "bytes",
        value: 4_096,
      },
    ]);
    expect(logger.info).toHaveBeenCalledTimes(1);

    interactive = true;
    vi.advanceTimersByTime(100);

    expect(collector.getMetrics()).toEqual([
      {
        name: "bundle_size_bytes",
        timestamp: "2026-06-03T00:00:00.000Z",
        unit: "bytes",
        value: 4_096,
      },
      {
        name: "time_to_interactive_ms",
        timestamp: "2026-06-03T00:00:01.000Z",
        unit: "ms",
        value: 0,
      },
    ]);
    expect(logger.info).toHaveBeenCalledTimes(2);
  });

  it("creates a CI-friendly JSON artifact from collected metrics", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00.000Z"));

    const collector = createPerformanceMetricsCollector({
      checkInteractive: () => true,
      getBundleEntries: () => [
        {
          initiatorType: "script",
          name: "/_next/static/chunks/main.js",
          transferSize: 512,
        },
      ],
      logger: { info: vi.fn() },
      now: () => 250,
      timestampFactory: () => "2026-06-03T12:00:00.000Z",
    });

    collector.start();

    expect(
      JSON.parse(createPerformanceMetricsArtifact(collector.getMetrics())),
    ).toEqual({
      generated_at: "2026-06-03T12:00:00.000Z",
      metrics: [
        {
          name: "bundle_size_bytes",
          timestamp: "2026-06-03T12:00:00.000Z",
          unit: "bytes",
          value: 512,
        },
        {
          name: "time_to_interactive_ms",
          timestamp: "2026-06-03T12:00:00.000Z",
          unit: "ms",
          value: 0,
        },
      ],
    });
  });
});
