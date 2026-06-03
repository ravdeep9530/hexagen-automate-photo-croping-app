export type PerformanceMetricName =
  | "bundle_size_bytes"
  | "time_to_interactive_ms";

export interface PerformanceMetric {
  name: PerformanceMetricName;
  unit: "bytes" | "ms";
  value: number;
  timestamp: string;
}

export interface BundleResourceTiming {
  decodedBodySize?: number;
  encodedBodySize?: number;
  initiatorType?: string;
  name?: string;
  transferSize?: number;
}

export interface PerformanceMetricsCollectorOptions {
  checkInteractive?: () => boolean;
  getBundleEntries?: () => BundleResourceTiming[];
  logger?: Pick<Console, "info">;
  now?: () => number;
  pollIntervalMs?: number;
  scheduler?: (callback: () => void, delayMs: number) => unknown;
  timeoutMs?: number;
  timestampFactory?: () => string;
  unschedule?: (handle: unknown) => void;
}

export interface PerformanceMetricsCollector {
  getMetrics: () => PerformanceMetric[];
  reportMetrics: () => void;
  start: () => void;
  stop: () => void;
}

const DEFAULT_POLL_INTERVAL_MS = 100;
const DEFAULT_TIMEOUT_MS = 10_000;

function defaultNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function defaultTimestampFactory(): string {
  return new Date().toISOString();
}

function defaultScheduler(callback: () => void, delayMs: number): unknown {
  return setTimeout(callback, delayMs);
}

function defaultUnschedule(handle: unknown): void {
  clearTimeout(handle as ReturnType<typeof setTimeout>);
}

function defaultBundleEntries(): BundleResourceTiming[] {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return [];
  }

  return performance
    .getEntriesByType("resource")
    .filter((entry): entry is PerformanceResourceTiming => {
      return typeof (entry as PerformanceResourceTiming).initiatorType === "string";
    });
}

function defaultInteractiveCheck(): boolean {
  return typeof document !== "undefined" && document.readyState === "complete";
}

function isJavaScriptBundle(entry: BundleResourceTiming): boolean {
  if (entry.initiatorType === "script") {
    return true;
  }

  return typeof entry.name === "string" && /\.m?js(\?|$)/i.test(entry.name);
}

function resolveTransferredBytes(entry: BundleResourceTiming): number {
  return entry.transferSize ?? entry.encodedBodySize ?? entry.decodedBodySize ?? 0;
}

function buildMetric(
  name: PerformanceMetricName,
  unit: PerformanceMetric["unit"],
  value: number,
  timestampFactory: () => string,
): PerformanceMetric {
  return {
    name,
    unit,
    value,
    timestamp: timestampFactory(),
  };
}

export function calculateBundleSize(entries: BundleResourceTiming[]): number {
  return entries
    .filter(isJavaScriptBundle)
    .reduce((total, entry) => total + resolveTransferredBytes(entry), 0);
}

export function createPerformanceMetricsArtifact(
  metrics: PerformanceMetric[],
): string {
  return JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      metrics,
    },
    null,
    2,
  );
}

export function createPerformanceMetricsCollector(
  options: PerformanceMetricsCollectorOptions = {},
): PerformanceMetricsCollector {
  const now = options.now ?? defaultNow;
  const timestampFactory = options.timestampFactory ?? defaultTimestampFactory;
  const getBundleEntries = options.getBundleEntries ?? defaultBundleEntries;
  const checkInteractive = options.checkInteractive ?? defaultInteractiveCheck;
  const logger = options.logger ?? console;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const scheduler = options.scheduler ?? defaultScheduler;
  const unschedule = options.unschedule ?? defaultUnschedule;

  const metrics: PerformanceMetric[] = [];
  let startTime = 0;
  let timeoutHandle: unknown;
  let bundleMeasured = false;
  let interactiveMeasured = false;
  let started = false;

  const reportMetrics = (): void => {
    logger.info(createPerformanceMetricsArtifact(metrics));
  };

  const recordBundleSize = (): void => {
    if (bundleMeasured) {
      return;
    }

    metrics.push(
      buildMetric(
        "bundle_size_bytes",
        "bytes",
        calculateBundleSize(getBundleEntries()),
        timestampFactory,
      ),
    );
    bundleMeasured = true;
    reportMetrics();
  };

  const recordTimeToInteractive = (): void => {
    if (interactiveMeasured) {
      return;
    }

    metrics.push(
      buildMetric(
        "time_to_interactive_ms",
        "ms",
        Math.max(0, now() - startTime),
        timestampFactory,
      ),
    );
    interactiveMeasured = true;
    reportMetrics();
  };

  const scheduleNextCheck = (): void => {
    timeoutHandle = scheduler(() => {
      if (!started || interactiveMeasured) {
        return;
      }

      if (checkInteractive()) {
        recordTimeToInteractive();
        return;
      }

      if (now() - startTime < timeoutMs) {
        scheduleNextCheck();
      }
    }, pollIntervalMs);
  };

  const start = (): void => {
    if (started) {
      return;
    }

    started = true;
    startTime = now();
    recordBundleSize();

    if (checkInteractive()) {
      recordTimeToInteractive();
      return;
    }

    scheduleNextCheck();
  };

  const stop = (): void => {
    started = false;

    if (timeoutHandle !== undefined) {
      unschedule(timeoutHandle);
      timeoutHandle = undefined;
    }
  };

  return {
    getMetrics: () => [...metrics],
    reportMetrics,
    start,
    stop,
  };
}

export function usePerformanceMetrics(
  options: PerformanceMetricsCollectorOptions = {},
): PerformanceMetricsCollector {
  const collector = createPerformanceMetricsCollector(options);
  collector.start();
  return collector;
}
