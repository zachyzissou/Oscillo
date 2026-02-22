import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { startExperience } from './utils/startExperience'

const CONSENT_KEY = 'oscillo.analytics-consent'

async function loadWithDeniedTelemetry(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, 'denied')
  }, CONSENT_KEY)
  await page.goto('/')
  await expect(page.getByTestId('start-overlay')).toBeVisible({ timeout: 10000 })
}

test.describe('Accessibility Tests', () => {
  test('start overlay has no critical automated accessibility violations', async ({ page }) => {
    await loadWithDeniedTelemetry(page)

    const scan = await new AxeBuilder({ page })
      .exclude('[data-testid="webgl-canvas"]')
      .analyze()

    const criticalOrSerious = scan.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    )

    expect(criticalOrSerious).toEqual([])
  })

  test('supports keyboard path from skip link into start control', async ({ page }) => {
    await loadWithDeniedTelemetry(page)

    await page.keyboard.press('Tab')
    await expect(page.locator('.skip-link')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('start-button')).toBeFocused()
  })

  test('provides semantic landmarks and skip-link focus target', async ({ page }) => {
    await loadWithDeniedTelemetry(page)

    const skipLink = page.locator('a.skip-link[href="#main-content"]')
    await expect(skipLink).toBeVisible()

    const main = page.locator('main#main-content[role="main"]')
    await expect(main).toBeVisible()

    await skipLink.focus()
    await page.keyboard.press('Enter')
    await expect(main).toBeFocused()
  })

  test('telemetry consent banner is actionable and dismissible', async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.removeItem(key)
    }, CONSENT_KEY)

    await page.goto('/')
    await startExperience(page)

    const banner = page.getByTestId('telemetry-banner')
    await expect(banner).toBeVisible({ timeout: 10000 })

    await expect(page.getByTestId('telemetry-allow')).toBeVisible()
    await expect(page.getByTestId('telemetry-deny')).toBeVisible()

    await page.getByTestId('telemetry-deny').click()
    await expect(banner).toBeHidden()
  })

  test('remains functional when reduced-motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadWithDeniedTelemetry(page)
    await startExperience(page)
    await expect(page.getByTestId('start-overlay')).toBeHidden()
    await expect(page.getByTestId('main-content')).toBeVisible()
  })

  test('post-start state has no critical automated accessibility violations', async ({ page }) => {
    await loadWithDeniedTelemetry(page)
    await startExperience(page)

    await expect(page.getByTestId('start-overlay')).toBeHidden()
    await expect(page.getByTestId('main-content')).toBeVisible()

    const scan = await new AxeBuilder({ page })
      .exclude('[data-testid="webgl-canvas"]')
      .analyze()

    const criticalOrSerious = scan.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    )

    expect(criticalOrSerious).toEqual([])
  })
})
