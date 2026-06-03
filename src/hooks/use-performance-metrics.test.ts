import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  collectPerformanceMetrics,
  createPerformanceMetricsController,
  reportPerformanceMetrics,
} from './use-performance-metrics'

describe('performance metrics collection', () => {
  it('measures bundle size from transfer sizes and time to interactive from load event end', () => {
    const metrics = collectPerformanceMetrics({
      now: () => 1234,
      loadEventEnd: 850,
      getEntriesByType: (type) =>
        type === 'resource' ? [{ transferSize: 1024 }, { transferSize: 2048 }] : [],
    })

    assert.deepEqual(metrics, [
      {
        name: 'bundle_size_kb',
        value: 3,
        unit: 'kb',
        timestamp: 1234,
      },
      {
        name: 'time_to_interactive_ms',
        value: 850,
        unit: 'ms',
        timestamp: 1234,
      },
    ])
  })

  it('falls back to domInteractive and reports metrics to logger and CI callback', () => {
    const logged: string[] = []
    let reportedJson = ''

    const metrics = collectPerformanceMetrics({
      now: () => 500,
      domInteractive: 321,
      transferSize: 512,
    })

    const returned = reportPerformanceMetrics(metrics, {
      logger: {
        info: (message: unknown, payload: unknown) => {
          logged.push(`${String(message)} ${String(payload)}`)
        },
      },
      report: (reportedMetrics) => {
        reportedJson = JSON.stringify(reportedMetrics)
      },
    })

    assert.equal(returned, metrics)
    assert.match(logged[0] ?? '', /\[performance-metrics\]/)
    assert.equal(reportedJson, JSON.stringify(metrics))
    assert.equal(metrics[0]?.value, 0.5)
    assert.equal(metrics[1]?.value, 321)
  })

  it('creates a controller that collects and reports on demand', () => {
    const reports: string[] = []
    const controller = createPerformanceMetricsController({
      now: () => 42,
      loadEventEnd: 64,
      transferSize: 2048,
      report: (metrics) => {
        reports.push(JSON.stringify(metrics))
      },
      logger: {
        info: () => {
          // no-op for test
        },
      },
    })

    const collected = controller.collectMetrics()
    const reported = controller.reportMetrics()

    assert.equal(collected[0]?.value, 2)
    assert.equal(reported[1]?.value, 64)
    assert.equal(reports.length, 1)
  })
})
