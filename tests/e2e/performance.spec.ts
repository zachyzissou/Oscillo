// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsed: number
  audioLatency: number
  timestamp: number
}

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.goto('/?perf=1')
    await page.waitForLoadState('networkidle')
    
    // Wait for app to initialize
    await page.waitForSelector('[data-testid="canvas-container"]', { timeout: 30000 })
    
    // Start audio context (required for audio tests)
    await page.click('body')
    await page.waitForTimeout(1000)
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
    
    expect(metrics.length).toBeGreaterThan(25) // At least 25 samples
    
    // Calculate average FPS
    const avgFPS = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length
    const minFPS = Math.min(...metrics.map(m => m.fps))
    
    console.log(`Average FPS: ${avgFPS.toFixed(2)}`)
    console.log(`Minimum FPS: ${minFPS}`)
    
    // Desktop performance targets
    expect(avgFPS).toBeGreaterThan(30)
    expect(minFPS).toBeGreaterThan(15) // Allow occasional drops
    
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
    
    // Stress test: spawn multiple objects and play audio
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="spawn-button"]')
      await page.waitForTimeout(500)
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
    
    // Memory usage targets
    expect(maxMemoryMB).toBeLessThan(200)
    expect(avgMemoryMB).toBeLessThan(150)
  })

  test('audio latency under 50ms', async ({ page }) => {
    // Click to start audio
    await page.click('body')
    await page.waitForTimeout(2000)
    
    const latency = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      const metrics = monitor?.getLatestMetrics()
      return metrics?.audioLatency || 0
    })
    
    console.log(`Audio Latency: ${latency}ms`)
    
    // Audio latency target
    expect(latency).toBeLessThan(50)
    expect(latency).toBeGreaterThan(0) // Should have actual measurement
  })

  test('bundle size under targets', async ({ page }) => {
    // Navigate to see network requests
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Get all JS resources
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = resources.filter(r => r.name.includes('.js'))
      
      let totalSize = 0
      let initialSize = 0
      
      jsResources.forEach(resource => {
        const size = resource.transferSize || 0
        totalSize += size
        
        // Consider initial load (not lazy-loaded chunks)
        if (!resource.name.includes('chunk') || resource.name.includes('main')) {
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
    
    // Bundle size targets
    expect(totalSizeMB).toBeLessThan(2.5) // Total under 2.5MB
    expect(initialSizeMB).toBeLessThan(0.5) // Initial under 500KB
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
    
    // Frame time consistency targets
    expect(avgFrameTime).toBeLessThan(33.33) // Under 30fps target
    expect(maxFrameTime).toBeLessThan(50) // No frame should take more than 50ms
    expect(frameTimeVariance).toBeLessThan(100) // Reasonable consistency
  })

  test('performance under stress', async ({ page }) => {
    const baselineMetrics = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      return monitor?.getAverageMetrics(10)
    })
    
    // Create stress conditions: spawn many objects
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="spawn-button"]')
      await page.waitForTimeout(200)
    }
    
    // Enable multiple effects
    await page.click('[data-testid="effects-toggle"]', { timeout: 5000 })
    
    // Let it run under stress for 10 seconds
    await page.waitForTimeout(10000)
    
    const stressMetrics = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      return monitor?.getAverageMetrics(10)
    })
    
    console.log('Baseline FPS:', baselineMetrics?.fps || 0)
    console.log('Stress FPS:', stressMetrics?.fps || 0)
    
    // Performance should degrade gracefully
    const fpsDrop = (baselineMetrics?.fps || 0) - (stressMetrics?.fps || 0)
    expect(fpsDrop).toBeLessThan(30) // FPS shouldn't drop more than 30
    expect(stressMetrics?.fps || 0).toBeGreaterThan(15) // Should stay above 15fps
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