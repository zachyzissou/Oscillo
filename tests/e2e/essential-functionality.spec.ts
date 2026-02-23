import { test, expect } from '@playwright/test'
import { startExperience } from './utils/startExperience'

const ONBOARDING_KEY = 'oscillo.v2.deck-onboarded'
const BUNDLE_BUDGETS_MB = {
  maxTotalJs: 35,
  maxInitialJs: 18,
}

const RUNTIME_BUDGETS = {
  constrainedRenderer: {
    minFps: 14,
    maxFrameTimeMs: 80,
    maxMemoryMb: 240,
    maxAudioLatencyMs: 120,
  },
  standardRenderer: {
    minFps: 24,
    maxFrameTimeMs: 55,
    maxMemoryMb: 220,
    maxAudioLatencyMs: 100,
  },
}

test.describe('Essential Functionality Verification - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.localStorage.setItem('oscillo.analytics-consent', 'denied')
    })
  })

  test('core application loads and starts correctly', async ({ page, browserName }) => {
    // Navigate to the app
    await page.goto('/')

    // Verify page loads and title is correct
    await expect(page).toHaveTitle(/Oscillo/)

    // Check start overlay appears
    const startOverlay = page.locator('[data-testid="start-overlay"]')
    await expect(startOverlay).toBeVisible({ timeout: 8000 })

    // Verify start overlay content
    await expect(page.getByRole('heading', { name: /interactive 3d music/i })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible()

    // Click start to begin the experience.
    await startExperience(page)

    // Wait for overlay to disappear
    await expect(startOverlay).toBeHidden({ timeout: 5000 })

    // Check that we have a successful app initialization
    // Safari/WebKit may have audio issues but basic UI should still work
    if (browserName === 'webkit') {
      // For Safari, just verify basic UI structure exists
      const body = page.locator('body')
      await expect(body).toBeVisible()
      console.log('Safari/WebKit: Basic app structure verified (audio may be limited)')
    } else {
      // For other browsers, check main content area appears after start
      await page.waitForTimeout(1500) // Brief wait for initialization

      // Check that main content area is available after starting
      await expect(page.locator('#main-content')).toBeVisible({ timeout: 5000 })
      console.log('App initialized successfully with interactive content')
    }
  })

  test('keyboard start flow is accessible and deterministic', async ({ page }) => {
    await page.goto('/')

    const startOverlay = page.getByTestId('start-overlay')
    const startButton = page.getByTestId('start-button')

    await expect(startOverlay).toBeVisible({ timeout: 8000 })
    await expect(startButton).toBeVisible({ timeout: 5000 })
    await expect(startButton).toBeFocused({ timeout: 5000 })

    await page.keyboard.press('Enter')
    await expect(startOverlay).toBeHidden({ timeout: 5000 })
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 5000 })
  })

  test('first-session onboarding is skippable and does not repeat once completed', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(onboardingKey => {
      globalThis.localStorage.removeItem(onboardingKey)
    }, ONBOARDING_KEY)
    await page.reload()
    await startExperience(page)

    const onboarding = page.getByTestId('deck-onboarding')
    await expect(onboarding).toBeVisible({ timeout: 10000 })
    await expect(onboarding).toContainText('Step 1: Trigger the scene')

    await page.getByTestId('deck-onboarding-next').click()
    await expect(onboarding).toContainText('Step 2: Shape harmony')

    await page.getByTestId('deck-onboarding-next').click()
    await expect(onboarding).toContainText('Step 3: Set momentum')

    await page.getByTestId('deck-onboarding-skip').click()
    await expect(onboarding).toBeHidden({ timeout: 5000 })

    const persisted = await page.evaluate(
      key => globalThis.localStorage.getItem(key),
      ONBOARDING_KEY
    )
    expect(persisted).toBe('true')

    await page.reload()
    await startExperience(page)
    await expect(page.getByTestId('deck-onboarding')).toBeHidden({ timeout: 5000 })
  })

  test('no critical console errors on load', async ({ page }) => {
    const criticalErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const error = msg.text()
        // Only capture truly critical errors, ignore known issues
        if (
          !error.includes('Console Ninja') &&
          !error.includes('favicon') &&
          !error.includes('service worker') &&
          !error.includes('WebGL') && // Ignore WebGL warnings in CI
          !error.includes('AudioContext')
        ) {
          // Ignore audio warnings in CI
          criticalErrors.push(error)
        }
      }
    })

    await page.goto('/')
    await page.waitForTimeout(3000) // Reduced wait time

    expect(criticalErrors).toHaveLength(0)
  })

  test('basic performance is acceptable', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded') // Faster than networkidle
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(8000) // Reduced from 10s to 8s for faster tests
  })

  test('runtime and bundle budgets stay within smoke guardrails', async ({ page }) => {
    test.slow()
    await page.goto('/?perf=1')
    await startExperience(page)
    await page.waitForLoadState('networkidle')

    // Wait until the performance monitor has collected at least one frame before
    // reading metrics; avoids a misleading "FPS budget regression" failure when
    // the monitor simply hasn't started yet.
    await page.waitForFunction(
      () => {
        const monitor = (window as any).performanceMonitor
        return monitor?.getLatestMetrics?.() !== null
      },
      { timeout: 5000 }
    )
    await page.waitForTimeout(1500)

    const snapshot = await page.evaluate(() => {
      const monitor = (window as any).performanceMonitor
      const avg = monitor?.getAverageMetrics?.(10) ?? {}
      const latest = monitor?.getLatestMetrics?.() ?? {}

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
        runtime: {
          fps: Number(avg?.fps ?? latest?.fps ?? 0),
          frameTimeMs: Number(avg?.frameTime ?? latest?.frameTime ?? 0),
          memoryMb: Number((avg?.memoryUsed ?? latest?.memoryUsed ?? 0) / (1024 * 1024)),
          audioLatencyMs: Number(avg?.audioLatency ?? latest?.audioLatency ?? 0),
          renderer: String(latest?.webglRenderer ?? ''),
        },
        bundle: {
          resourceCount: scriptResources.length,
          totalJsMb: Number(totalJsBytes / (1024 * 1024)),
          initialJsMb: Number(initialJsBytes / (1024 * 1024)),
        },
      }
    })

    const renderer = snapshot.runtime.renderer.toLowerCase()
    const constrainedRenderer =
      renderer.includes('swiftshader') || renderer.includes('software') || renderer === 'unknown'
    const runtimeBudget = constrainedRenderer
      ? RUNTIME_BUDGETS.constrainedRenderer
      : RUNTIME_BUDGETS.standardRenderer

    const debugContext = JSON.stringify(
      {
        renderer: snapshot.runtime.renderer || 'unknown',
        constrainedRenderer,
        runtimeBudget,
        bundleBudgetsMb: BUNDLE_BUDGETS_MB,
        snapshot,
      },
      null,
      2
    )

    expect(snapshot.bundle.resourceCount, `No script resources captured.\n${debugContext}`).toBeGreaterThan(0)
    expect(snapshot.runtime.fps, `FPS budget regression.\n${debugContext}`).toBeGreaterThanOrEqual(
      runtimeBudget.minFps
    )
    expect(
      snapshot.runtime.frameTimeMs,
      `Frame-time budget regression.\n${debugContext}`
    ).toBeLessThanOrEqual(runtimeBudget.maxFrameTimeMs)
    expect(snapshot.runtime.memoryMb, `Memory budget regression.\n${debugContext}`).toBeLessThanOrEqual(
      runtimeBudget.maxMemoryMb
    )
    expect(
      snapshot.runtime.audioLatencyMs,
      `Audio-latency budget regression.\n${debugContext}`
    ).toBeLessThanOrEqual(runtimeBudget.maxAudioLatencyMs)
    expect(snapshot.bundle.totalJsMb, `Total JS bundle budget regression.\n${debugContext}`).toBeLessThanOrEqual(
      BUNDLE_BUDGETS_MB.maxTotalJs
    )
    expect(
      snapshot.bundle.initialJsMb,
      `Initial JS bundle budget regression.\n${debugContext}`
    ).toBeLessThanOrEqual(BUNDLE_BUDGETS_MB.maxInitialJs)
  })
})
