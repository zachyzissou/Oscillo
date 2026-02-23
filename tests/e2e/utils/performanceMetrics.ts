import type { Page } from '@playwright/test'

export interface RuntimeMetricsSnapshot {
  fps: number
  frameTimeMs: number
  memoryMb: number
  audioLatencyMs: number
  renderer: string
}

export interface BundleFootprintSnapshot {
  resourceCount: number
  totalJsMb: number
  initialJsMb: number
}

export async function readBundleFootprint(page: Page): Promise<BundleFootprintSnapshot> {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const scriptResources = resources.filter(resource => resource.initiatorType === 'script')
    const initialScriptSrcs = Array.from(document.querySelectorAll('script[src]')).map(
      (element: HTMLScriptElement) => element.src
    )

    let totalJsBytes = 0
    let initialJsBytes = 0

    scriptResources.forEach(resource => {
      const resourceSize =
        resource.transferSize || resource.encodedBodySize || resource.decodedBodySize || 0
      totalJsBytes += resourceSize

      const resourceUrl = new URL(resource.name, location.origin)
      const loadedInInitialHtml = initialScriptSrcs.some(scriptSrc => {
        try {
          const scriptUrl = new URL(scriptSrc, location.origin)
          return scriptUrl.pathname === resourceUrl.pathname
        } catch {
          return false
        }
      })

      if (loadedInInitialHtml) {
        initialJsBytes += resourceSize
      }
    })

    return {
      resourceCount: scriptResources.length,
      totalJsMb: Number(totalJsBytes / (1024 * 1024)),
      initialJsMb: Number(initialJsBytes / (1024 * 1024)),
    }
  })
}

export async function readStableRuntimeMetrics(
  page: Page,
  { attempts = 10, intervalMs = 400 }: { attempts?: number; intervalMs?: number } = {}
): Promise<RuntimeMetricsSnapshot> {
  for (let i = 0; i < attempts; i++) {
    const runtimeSnapshot = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      const avg = monitor?.getAverageMetrics?.(10) ?? {}
      const latest = monitor?.getLatestMetrics?.() ?? {}

      return {
        fps: Number(avg?.fps ?? latest?.fps ?? 0),
        frameTimeMs: Number(avg?.frameTime ?? latest?.frameTime ?? 0),
        memoryMb: Number((avg?.memoryUsed ?? latest?.memoryUsed ?? 0) / (1024 * 1024)),
        audioLatencyMs: Number(avg?.audioLatency ?? latest?.audioLatency ?? 0),
        renderer: String(latest?.webglRenderer ?? ''),
      }
    })

    if (runtimeSnapshot.fps > 0 && runtimeSnapshot.frameTimeMs > 0) {
      return runtimeSnapshot
    }

    await page.waitForTimeout(intervalMs)
  }

  return page.evaluate(() => {
    const monitor = (window as any).performanceMonitor
    const latest = monitor?.getLatestMetrics?.() ?? {}
    return {
      fps: Number(latest?.fps ?? 0),
      frameTimeMs: Number(latest?.frameTime ?? 0),
      memoryMb: Number((latest?.memoryUsed ?? 0) / (1024 * 1024)),
      audioLatencyMs: Number(latest?.audioLatency ?? 0),
      renderer: String(latest?.webglRenderer ?? ''),
    }
  })
}
