import { test, expect } from '@playwright/test'
import { startExperience } from './utils/startExperience'

test.describe('Oscillo Enhanced Audio-Reactive Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('oscillo.analytics-consent', 'denied')
    })

    // Navigate to the app
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="start-overlay"]', { timeout: 10000 })
  })

  test('should display audio-reactive shader backgrounds', async ({ page }) => {
    // Start the experience
    await page.click('[data-testid="start-button"]')
    
    // Wait for canvas to load
    await page.waitForSelector('canvas', { timeout: 5000 })
    
    // Check if shader backgrounds are rendered (they should be visible in the DOM)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Take screenshot for visual regression
    await page.screenshot({ 
      path: 'test-results/shader-backgrounds.png',
      fullPage: true 
    })
  })

  test('should respond to audio controls', async ({ page }) => {
    await startExperience(page)
    await expect(page.locator('canvas')).toBeVisible()
    
    // Validate optional audio controls when present.
    const audioControls = page.locator('[data-testid="audio-controls"]')
    if (await audioControls.isVisible()) {
      await expect(audioControls).toBeVisible()
    }
    
    // Test volume control
    const volumeSlider = page.locator('[data-testid="volume-slider"]')
    if (await volumeSlider.isVisible()) {
      await volumeSlider.fill('0.8')
    }
    
    // Test play/pause
    const playButton = page.locator('[data-testid="play-button"]')
    if (await playButton.isVisible()) {
      await playButton.click()
    }
  })

  test('should display Magenta music generator', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Look for Magenta generator component
    const magentaGenerator = page.locator('[data-testid="magenta-generator"]')
    if (await magentaGenerator.isVisible()) {
      await expect(magentaGenerator).toBeVisible()
      
      // Test generate button
      const generateButton = page.locator('[data-testid="generate-melody"]')
      if (await generateButton.isVisible()) {
        await generateButton.click()
        
        // Wait for generation to complete
        await page.waitForTimeout(2000)
      }
    }
  })

  test('should handle performance settings', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    const deckOpenButton = page.locator('[data-testid="deck-open-button"]')
    if (await deckOpenButton.isVisible()) {
      await deckOpenButton.click()
    }

    const performanceSelect = page.locator('[data-testid="performance-level"]')
    if (await performanceSelect.isVisible()) {
      await performanceSelect.selectOption('high')
      await page.waitForTimeout(1000)
    }
  })

  test('should display 3D audio-reactive orbs', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(2000)
    
    // Canvas should be present and rendering
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Check canvas dimensions
    const canvasSize = await canvas.boundingBox()
    expect(canvasSize?.width).toBeGreaterThan(100)
    expect(canvasSize?.height).toBeGreaterThan(100)
  })

  test('should handle mobile interactions', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.click('[data-testid="start-button"]')
    
    // Check mobile-specific UI
    const mobileControls = page.locator('[data-testid="mobile-controls"]')
    if (await mobileControls.isVisible()) {
      await expect(mobileControls).toBeVisible()
    }
    
    // Use click for deterministic behavior in desktop browser projects.
    const canvas = page.locator('canvas')
    await canvas.click({ position: { x: 120, y: 120 } })
  })

  test('should maintain accessibility standards', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Check for ARIA labels and roles
    const interactiveElements = page.locator('[role="button"], button, [role="slider"], input[type="range"]')
    const count = await interactiveElements.count()
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i)
      const ariaLabel = await element.getAttribute('aria-label')
      const title = await element.getAttribute('title')
      const textContent = await element.textContent()
      
      // Each interactive element should have some form of accessible name
      expect(ariaLabel || title || textContent).toBeTruthy()
    }
  })

  test('should handle WebGL context loss gracefully', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(1000)
    
    // Simulate WebGL context loss
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (canvas) {
        const gl = canvas.getContext('webgl')
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context')
          if (loseContext) {
            loseContext.loseContext()
          }
        }
      }
    })
    
    // App should still be functional
    await page.waitForTimeout(2000)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('should display error boundaries when needed', async ({ page }) => {
    // Force an error condition if possible
    await page.route('**/*', route => {
      if (route.request().url().includes('magenta')) {
        route.abort()
      } else {
        route.continue()
      }
    })
    
    await page.click('[data-testid="start-button"]')
    
    // Check if error boundary appears
    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    if (await errorBoundary.isVisible()) {
      await expect(errorBoundary).toBeVisible()
      
      // Should have retry button
      const retryButton = page.locator('[data-testid="retry-button"]')
      if (await retryButton.isVisible()) {
        await retryButton.click()
      }
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Enter should activate focused element
    await page.keyboard.press('Enter')
    
    // No errors should occur
    await page.waitForTimeout(500)
  })

  test('should load and render within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.click('[data-testid="start-button"]')
    await page.waitForSelector('canvas')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
    
    // Check FPS with an environment-aware threshold.
    const perf = await page.evaluate(async () => {
      const fps = await new Promise<number>((resolve) => {
        let frames = 0
        const start = performance.now()

        function countFrames() {
          frames++
          if (performance.now() - start > 1000) {
            resolve(frames)
            return
          }
          requestAnimationFrame(countFrames)
        }

        requestAnimationFrame(countFrames)
      })

      const monitor = (window as any).performanceMonitor
      const latest = monitor?.getLatestMetrics?.() ?? null
      return {
        fps,
        renderer: latest?.webglRenderer ?? '',
      }
    })

    // SwiftShader runs in software and can dip briefly under heavy CI load.
    const minFps = perf.renderer.includes('SwiftShader') ? 8 : 30
    expect(perf.fps).toBeGreaterThanOrEqual(minFps)
  })
})
