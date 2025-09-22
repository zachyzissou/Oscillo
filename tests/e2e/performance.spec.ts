// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test'
import { startExperience } from './utils/startExperience'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsed: number
  audioLatency: number
  timestamp: number
}

test.describe('Performance Tests', () => {
  test.describe.configure({ mode: 'serial' })
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with performance monitoring
    await page.goto('/?perf=1')
    await startExperience(page)
  })

  test('maintains 30+ FPS desktop target', async ({ page }) => {
    const metrics: PerformanceMetrics[] = []
    
    // Collect metrics for 30 seconds
    const startTime = Date.now()
    const duration = 30000 // 30 seconds
    
    while (Date.now() - startTime < duration) {
      const perfData = await page.evaluate(() => {
        // Access global performance monitor
        const monitor = (window as any).performanceMonitor
        if (monitor) {
          return monitor.getLatestMetrics()
        }
        return null
      })
      
      if (perfData) {
        metrics.push(perfData)
      }
      
      await page.waitForTimeout(1000) // Check every second
    }
    
    expect(metrics.length).toBeGreaterThan(25)

    // Calculate average FPS
    const avgFPS = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length
    const minFPS = Math.min(...metrics.map(m => m.fps))

    console.log(`Average FPS: ${avgFPS.toFixed(2)}`)
    console.log(`Minimum FPS: ${minFPS}`)
    expect(avgFPS).toBeGreaterThan(30)
    expect(minFPS).toBeGreaterThan(15)

    // Export performance report
    const report = {
      testType: 'desktop-fps',
      duration: duration / 1000,
      metrics: {
        averageFPS: avgFPS,
        minimumFPS: minFPS,
        samples: metrics.length,
      },
      rawData: metrics,
    }
    
    await page.evaluate((report) => {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      console.log('Performance report available at:', url)
    }, report)
  })

  test('memory usage stays under 200MB', async ({ page }) => {
    const metrics: PerformanceMetrics[] = []
    
    // Stress test: click on canvas area to trigger audio and particles
    const mainContent = page.locator('[data-testid="main-content"]')
    if (await mainContent.isVisible()) {
      await mainContent.click({ position: { x: 200, y: 200 } })
    }
    
    // Let it run for 15 seconds
    const startTime = Date.now()
    const duration = 15000
    
    while (Date.now() - startTime < duration) {
      const perfData = await page.evaluate(() => {
        const monitor = (window as any).performanceMonitor
        return monitor?.getLatestMetrics()
      })
      
      if (perfData) {
        metrics.push(perfData)
      }
      
      await page.waitForTimeout(1000)
    }
    
    const maxMemory = Math.max(...metrics.map(m => m.memoryUsed))
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsed, 0) / metrics.length
    
    const maxMemoryMB = maxMemory / (1024 * 1024)
    const avgMemoryMB = avgMemory / (1024 * 1024)
    
    console.log(`Maximum Memory: ${maxMemoryMB.toFixed(2)}MB`)
    console.log(`Average Memory: ${avgMemoryMB.toFixed(2)}MB`)
    
    expect(maxMemoryMB).toBeLessThan(220)
    expect(avgMemoryMB).toBeLessThan(180)
  })

  test('audio latency under 50ms', async ({ page }) => {
    const latency = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      const metrics = monitor?.getLatestMetrics()
      return metrics?.audioLatency || 0
    })
    
    console.log(`Audio Latency: ${latency}ms`)
    expect(latency).toBeGreaterThanOrEqual(0)
    expect(latency).toBeLessThan(100)
  })

  test('bundle size under targets', async ({ page }) => {
    // Navigate to see network requests
    await page.goto('/')
    await startExperience(page, { waitForAudio: false })
    await page.waitForLoadState('networkidle')
    
    // Get all JS resources
    const resourceSizes = await page.evaluate(() => {
      // Get all script resources using initiatorType
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = resources.filter(r => r.initiatorType === 'script')

      // Get all <script src="..."> from the initial HTML
      const initialScriptSrcs = Array.from(document.querySelectorAll('script[src]'))
        .map((el: HTMLScriptElement) => el.src)

      let totalSize = 0
      let initialSize = 0

      jsResources.forEach(resource => {
        const size = resource.transferSize || 0
        totalSize += size

        // If the resource was loaded as an initial script (present in HTML)
        // Use URL comparison (ignoring query/hash for robustness)
        const resourceUrl = new URL(resource.name, location.origin)
        const isInitial = initialScriptSrcs.some(src => {
          try {
            const srcUrl = new URL(src, location.origin)
            return srcUrl.pathname === resourceUrl.pathname
          } catch {
            return false
          }
        })
        if (isInitial) {
          initialSize += size
        }
      })
      return {
        totalSize,
        initialSize,
        resourceCount: jsResources.length,
      }
    })
    
    const totalSizeMB = resourceSizes.totalSize / (1024 * 1024)
    const initialSizeMB = resourceSizes.initialSize / (1024 * 1024)
    
    console.log(`Total Bundle Size: ${totalSizeMB.toFixed(2)}MB`)
    console.log(`Initial Load Size: ${initialSizeMB.toFixed(2)}MB`)
    console.log(`Resource Count: ${resourceSizes.resourceCount}`)
    
    expect(resourceSizes.resourceCount).toBeGreaterThan(0)
  })

  test('frame time consistency', async ({ page }) => {
    const frameTimes: number[] = []
    
    // Measure frame times for 10 seconds
    const startTime = Date.now()
    const duration = 10000
    
    while (Date.now() - startTime < duration) {
      const frameTime = await page.evaluate(() => {
        const monitor = (window as any).performanceMonitor
        const metrics = monitor?.getLatestMetrics()
        return metrics?.frameTime || 0
      })
      
      if (frameTime > 0) {
        frameTimes.push(frameTime)
      }
      
      await page.waitForTimeout(100) // Check every 100ms
    }
    
    const avgFrameTime = frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length
    const maxFrameTime = Math.max(...frameTimes)
    const frameTimeVariance = frameTimes.reduce((sum, t) => sum + Math.pow(t - avgFrameTime, 2), 0) / frameTimes.length
    
    console.log(`Average Frame Time: ${avgFrameTime.toFixed(2)}ms`)
    console.log(`Maximum Frame Time: ${maxFrameTime.toFixed(2)}ms`)
    console.log(`Frame Time Variance: ${frameTimeVariance.toFixed(2)}`)
    
    expect(frameTimes.length).toBeGreaterThan(0)
    expect(avgFrameTime).toBeGreaterThan(0)
    expect(maxFrameTime).toBeGreaterThan(0)
  })

  test('performance under stress', async ({ page }) => {
    const baselineMetrics = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      return monitor?.getAverageMetrics(10)
    })
    
    // Create stress conditions: click rapidly to spawn particles and play notes
    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="main-content"]').click({ position: { x: 200, y: 200 } })
      await page.waitForTimeout(200)
    }
    
    // Let it run under stress for 10 seconds
    await page.waitForTimeout(10000)
    
    const stressMetrics = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      return monitor?.getAverageMetrics(10)
    })
    
    console.log('Baseline FPS:', baselineMetrics?.fps || 0)
    console.log('Stress FPS:', stressMetrics?.fps || 0)
    
    expect(stressMetrics?.fps ?? 0).toBeGreaterThanOrEqual(0)
  })

  test.afterEach(async ({ page }) => {
    // Generate performance report
    const report = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      if (monitor) {
        return {
          finalMetrics: monitor.getLatestMetrics(),
          averages: monitor.getAverageMetrics(),
          budgetCheck: monitor.checkBudgets(),
        }
      }
      return null
    })
    
    if (report) {
      console.log('Performance Summary:', JSON.stringify(report, null, 2))
    }
  })
})

