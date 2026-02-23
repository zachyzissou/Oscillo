import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { startExperience } from './utils/startExperience'

const CONSENT_KEY = 'oscillo.analytics-consent'

async function loadWithDeniedTelemetry(page: Page) {
  await page.addInitScript(key => {
    globalThis.localStorage.setItem(key, 'denied')
  }, CONSENT_KEY)
  await page.goto('/')
  await expect(page.getByTestId('start-overlay')).toBeVisible({ timeout: 10000 })
}

test.describe('Accessibility Tests', () => {
  test('start overlay has no critical automated accessibility violations', async ({ page }) => {
    await loadWithDeniedTelemetry(page)

    const scan = await new AxeBuilder({ page }).exclude('[data-testid="webgl-canvas"]').analyze()

    const criticalOrSerious = scan.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    )

    expect(criticalOrSerious).toEqual([])
  })

  test('supports keyboard path from skip link into start control', async ({ page }) => {
    await loadWithDeniedTelemetry(page)

    await expect(page.getByTestId('start-button')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
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
    await page.addInitScript(key => {
      globalThis.localStorage.removeItem(key)
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

    const deckCollapse = page.getByTestId('deck-collapse-button')
    await expect(deckCollapse).toBeVisible()
    const transitionDuration = await deckCollapse.evaluate(
      node => getComputedStyle(node).transitionDuration
    )
    const pulseAnimationName = await page
      .getByTestId('deck-pulse-indicator')
      .evaluate(node => getComputedStyle(node).animationName)

    expect(transitionDuration).toBe('0s')
    expect(pulseAnimationName).toBe('none')
  })

  test('command deck preserves keyboard focus while collapsing and reopening', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await loadWithDeniedTelemetry(page)
    await startExperience(page)

    const collapseButton = page.getByTestId('deck-collapse-button')
    await expect(collapseButton).toBeVisible({ timeout: 10000 })
    await collapseButton.focus()
    await expect(collapseButton).toBeFocused()
    await page.keyboard.press('Enter')

    const openButton = page.getByTestId('deck-open-button')
    await expect(openButton).toBeVisible({ timeout: 10000 })
    await expect(openButton).toBeFocused()
    await page.keyboard.press('Enter')

    const keySelect = page.getByTestId('key-select')
    await expect(keySelect).toBeVisible({ timeout: 10000 })
    await expect(keySelect).toBeFocused()
  })

  test('persistent action rail keeps touch and keyboard control paths reachable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 851 })
    await loadWithDeniedTelemetry(page)
    await startExperience(page)

    const rail = page.getByTestId('deck-action-rail')
    const railToggle = page.getByTestId('deck-rail-toggle')

    await expect(rail).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('deck-open-button')).toBeVisible({ timeout: 10000 })

    await railToggle.click()
    await expect(page.getByTestId('deck-collapse-button')).toBeVisible({ timeout: 10000 })

    await railToggle.click()
    await expect(page.getByTestId('deck-open-button')).toBeVisible({ timeout: 10000 })

    await railToggle.click()
    await expect(page.getByTestId('deck-collapse-button')).toBeVisible({ timeout: 10000 })

    await page.locator('main#main-content').click({ position: { x: 24, y: 24 } })

    const modeBefore = await page.getByTestId('deck-rail-mode-cycle').innerText()
    await page.keyboard.press('m')
    const modeAfter = await page.getByTestId('deck-rail-mode-cycle').innerText()
    expect(modeAfter).not.toBe(modeBefore)

    const tempoSlider = page.getByTestId('tempo-slider')
    const tempoBefore = Number(await tempoSlider.inputValue())
    await page.keyboard.press(']')
    const tempoRaised = Number(await tempoSlider.inputValue())
    await page.keyboard.press('[')
    const tempoReturned = Number(await tempoSlider.inputValue())

    expect(tempoRaised).toBe(tempoBefore + 5)
    expect(tempoReturned).toBe(tempoBefore)
  })

  test('post-start state has no critical automated accessibility violations', async ({ page }) => {
    await loadWithDeniedTelemetry(page)
    await startExperience(page)

    await expect(page.getByTestId('start-overlay')).toBeHidden()
    await expect(page.getByTestId('main-content')).toBeVisible()

    const scan = await new AxeBuilder({ page }).exclude('[data-testid="webgl-canvas"]').analyze()

    const criticalOrSerious = scan.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    )

    expect(criticalOrSerious).toEqual([])
  })
})
