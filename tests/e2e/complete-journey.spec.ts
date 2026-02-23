import { expect, test, type Page } from '@playwright/test'
import { startExperience } from './utils/startExperience'

const CONSENT_KEY = 'oscillo.analytics-consent'
const ONBOARDING_KEY = 'oscillo.v2.deck-onboarded'
const OVERLAY_KEY = 'hasSeenOverlay'

type ConsentValue = 'granted' | 'denied' | 'unknown'

async function bootstrapJourney(page: Page, consent: ConsentValue = 'denied') {
  await page.addInitScript(
    ({ consentKey, onboardingKey, overlayKey, consentValue }) => {
      globalThis.localStorage.setItem(onboardingKey, 'true')
      globalThis.localStorage.removeItem(overlayKey)

      if (consentValue === 'unknown') {
        globalThis.localStorage.removeItem(consentKey)
      } else {
        globalThis.localStorage.setItem(consentKey, consentValue)
      }
    },
    {
      consentKey: CONSENT_KEY,
      onboardingKey: ONBOARDING_KEY,
      overlayKey: OVERLAY_KEY,
      consentValue: consent,
    }
  )

  await page.goto('/')
}

test.describe('UI/UX v2 Journey Validation', () => {
  test('desktop journey stays coherent from Start -> Create -> Control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await bootstrapJourney(page, 'denied')

    const overlay = page.getByTestId('start-overlay')
    await expect(overlay).toBeVisible({ timeout: 10000 })
    await expect(overlay.getByRole('heading', { name: /interactive 3d music/i })).toBeVisible()
    await expect(page.getByTestId('start-button')).toBeVisible()

    await startExperience(page)

    await expect(overlay).toBeHidden({ timeout: 10000 })
    await expect(page.getByTestId('deck-action-rail')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('deck-collapse-button')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('tempo-slider')).toBeVisible()

    await page.getByTestId('key-select').selectOption('D')
    await expect(page.getByTestId('key-select')).toHaveValue('D')

    const modeCycle = page.getByTestId('deck-rail-mode-cycle')
    const modeBefore = (await modeCycle.textContent())?.trim() ?? ''
    await page.keyboard.press('m')
    await expect
      .poll(async () => (await modeCycle.textContent())?.trim() ?? '', { timeout: 5000 })
      .not.toBe(modeBefore)
  })

  test('mobile journey preserves discoverability and trust controls', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 })
    await bootstrapJourney(page, 'unknown')
    await startExperience(page)

    const railToggle = page.getByTestId('deck-rail-toggle')
    await expect(railToggle).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('deck-open-button')).toBeVisible({ timeout: 10000 })

    await railToggle.click()
    await expect(page.getByTestId('deck-collapse-button')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('deck-snap-points')).toBeVisible({ timeout: 10000 })

    const telemetry = page.getByTestId('telemetry-banner')
    await expect(telemetry).toBeVisible({ timeout: 10000 })
    await expect(telemetry).toHaveClass(/UiPrimitives_surface/)

    const detailsToggle = page.getByTestId('telemetry-details-toggle')
    await expect(detailsToggle).toHaveAttribute('aria-expanded', 'false')
    await detailsToggle.click()
    await expect(detailsToggle).toHaveAttribute('aria-expanded', 'true')

    await page.getByTestId('telemetry-deny').click()
    await expect(telemetry).toBeHidden()
  })

  test('journey quality gate keeps startup time and console health stable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await bootstrapJourney(page, 'denied')

    const consoleErrors: string[] = []
    page.on('console', message => {
      if (message.type() !== 'error') return
      const text = message.text()
      if (
        text.includes('favicon') ||
        text.includes('service worker') ||
        text.includes('WebGL') ||
        text.includes('AudioContext')
      ) {
        return
      }
      consoleErrors.push(text)
    })

    const journeyStart = Date.now()
    await startExperience(page)
    await expect(page.getByTestId('deck-action-rail')).toBeVisible({ timeout: 10000 })
    const timeToControl = Date.now() - journeyStart

    expect(timeToControl).toBeLessThan(10000)
    expect(consoleErrors).toEqual([])
  })
})
