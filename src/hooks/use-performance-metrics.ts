export interface PerformanceMetric {
  name: 'bundle_size_kb' | 'time_to_interactive_ms'
  value: number
  unit: 'kb' | 'ms'
  timestamp: number
}

export interface PerformanceMetricsOptions {
  report?: (metrics: PerformanceMetric[]) => void
  logger?: {
    info: (...args: unknown[]) => void
  }
  getEntriesByType?: (type: string) => Array<{ transferSize?: number }>
  now?: () => number
  loadEventEnd?: number
  domInteractive?: number
  transferSize?: number
}

export interface PerformanceMetricsController {
  collectMetrics: () => PerformanceMetric[]
  reportMetrics: () => PerformanceMetric[]
}

const DEFAULT_LOGGER = {
  info: (...args: unknown[]) => console.info(...args),
}

function resolveTransferSize(
  getEntriesByType?: (type: string) => Array<{ transferSize?: number }>,
  explicitTransferSize?: number,
): number {
  if (typeof explicitTransferSize === 'number') {
    return explicitTransferSize
  }

  if (!getEntriesByType) {
    return 0
  }

  const resourceEntries = getEntriesByType('resource')
  return resourceEntries.reduce((total, entry) => total + (typeof entry.transferSize === 'number' ? entry.transferSize : 0), 0)
}

function resolveTimeToInteractive(now: () => number, loadEventEnd?: number, domInteractive?: number): number {
  if (typeof loadEventEnd === 'number' && loadEventEnd > 0) {
    return loadEventEnd
  }

  if (typeof domInteractive === 'number' && domInteractive > 0) {
    return domInteractive
  }

  return now()
}

export function collectPerformanceMetrics(options: PerformanceMetricsOptions = {}): PerformanceMetric[] {
  const now = options.now ?? (() => Date.now())
  const transferSize = resolveTransferSize(options.getEntriesByType, options.transferSize)
  const timeToInteractive = resolveTimeToInteractive(now, options.loadEventEnd, options.domInteractive)
  const timestamp = now()

  return [
    {
      name: 'bundle_size_kb',
      value: Number((transferSize / 1024).toFixed(2)),
      unit: 'kb',
      timestamp,
    },
    {
      name: 'time_to_interactive_ms',
      value: Number(timeToInteractive.toFixed(2)),
      unit: 'ms',
      timestamp,
    },
  ]
}

export function reportPerformanceMetrics(
  metrics: PerformanceMetric[],
  options: Pick<PerformanceMetricsOptions, 'logger' | 'report'> = {},
): PerformanceMetric[] {
  const logger = options.logger ?? DEFAULT_LOGGER

  logger.info('[performance-metrics]', JSON.stringify(metrics))
  options.report?.(metrics)

  return metrics
}

export function createPerformanceMetricsController(
  options: PerformanceMetricsOptions = {},
): PerformanceMetricsController {
  return {
    collectMetrics: () => collectPerformanceMetrics(options),
    reportMetrics: () => reportPerformanceMetrics(collectPerformanceMetrics(options), options),
  }
}

export function usePerformanceMetrics(options: PerformanceMetricsOptions = {}): PerformanceMetricsController {
  return createPerformanceMetricsController(options)
}
