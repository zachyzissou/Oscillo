import { test, expect, type Page } from '@playwright/test'
import { startExperience } from './utils/startExperience'

const runVisualRegression = process.env.RUN_VISUAL_REGRESSION === '1'
const CONSENT_KEY = 'oscillo.analytics-consent'
const ONBOARDING_KEY = 'oscillo.v2.deck-onboarded'
const OVERLAY_KEY = 'hasSeenOverlay'

const hideWebglCanvas = async (page: Page) => {
  const canvas = page.locator('[data-testid="webgl-canvas"]')
  if (await canvas.count()) {
    await canvas.evaluateAll(nodes => {
      nodes.forEach(node => {
        ;(node as HTMLCanvasElement).style.display = 'none'
      })
    })
  }
}

const suppressTelemetryBanner = async (page: Page) => {
  await page.addStyleTag({
    content: `
      [data-testid="telemetry-banner"] {
        display: none !important;
      }
    `,
  })
}

const clearActiveFocus = async (page: Page) => {
  await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    active?.blur()
  })
}

test.describe('Visual Regression Tests', () => {
  test.skip(!runVisualRegression, 'Set RUN_VISUAL_REGRESSION=1 and update baselines intentionally.')

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ consentKey, onboardingKey, overlayKey }) => {
        globalThis.localStorage.removeItem(consentKey)
        globalThis.localStorage.setItem(onboardingKey, 'true')
        globalThis.localStorage.removeItem(overlayKey)
      },
      { consentKey: CONSENT_KEY, onboardingKey: ONBOARDING_KEY, overlayKey: OVERLAY_KEY }
    )

    await page.goto('/')

    // Keep visual snapshots deterministic.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        html, body, button, input, select, textarea {
          font-family: Arial, Helvetica, sans-serif !important;
        }
      `,
    })
  })

  test('start overlay card visual', async ({ page }) => {
    const card = page.locator('[data-testid="start-overlay"] > div').first()
    await expect(card).toBeVisible({ timeout: 10000 })

    await expect(card).toHaveScreenshot('start-overlay-card.png', {
      threshold: 0.15,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('start overlay desktop layout visual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.getByTestId('start-overlay')).toBeVisible({ timeout: 10000 })

    await expect(page).toHaveScreenshot('start-overlay-desktop.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('start overlay mobile layout visual', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 })
    await expect(page.getByTestId('start-overlay')).toBeVisible({ timeout: 10000 })

    await expect(page).toHaveScreenshot('start-overlay-mobile.png', {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('mobile command deck initializes without expanded flash', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 })
    await startExperience(page)
    await suppressTelemetryBanner(page)

    await hideWebglCanvas(page)

    await expect(page.getByTestId('deck-open-button')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('deck-collapse-button')).toHaveCount(0)
    await clearActiveFocus(page)

    await expect(page.getByTestId('experience-deck')).toHaveScreenshot(
      'experience-deck-mobile-initial.png',
      {
        threshold: 0.15,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      }
    )
  })

  test('telemetry consent banner visual', async ({ page }) => {
    await startExperience(page)

    await hideWebglCanvas(page)

    const banner = page.getByTestId('telemetry-banner')
    await expect(banner).toBeVisible({ timeout: 10000 })

    await expect(banner).toHaveScreenshot('telemetry-banner.png', {
      threshold: 0.15,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })
})
