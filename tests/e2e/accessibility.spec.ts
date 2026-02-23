import { test, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
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

async function loadWithUnknownTelemetry(page: Page) {
  await page.addInitScript(key => {
    globalThis.localStorage.removeItem(key)
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
    await loadWithUnknownTelemetry(page)
    await startExperience(page)

    const banner = page.getByTestId('telemetry-banner')
    await expect(banner).toBeVisible({ timeout: 10000 })

    await expect(page.getByTestId('telemetry-allow')).toBeVisible()
    await expect(page.getByTestId('telemetry-deny')).toBeVisible()

    await page.getByTestId('telemetry-deny').click()
    await expect(banner).toBeHidden()
  })

  test('telemetry banner keyboard path is deterministic and returns focus to deck controls', async ({
    page,
  }) => {
    await loadWithUnknownTelemetry(page)
    await startExperience(page)

    const allow = page.getByTestId('telemetry-allow')
    const deny = page.getByTestId('telemetry-deny')
    await expect(allow).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(deny).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('telemetry-banner')).toBeHidden()
    await expect(page.getByTestId('deck-rail-toggle')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('deck-rail-tempo-down')).toBeFocused()
  })

  test('focus indicators stay consistent across primary interactive surfaces', async ({ page }) => {
    const readFocusStyles = async (target: Locator) => {
      await target.focus()
      return target.evaluate(node => {
        const computed = getComputedStyle(node)
        return {
          color: computed.outlineColor,
          style: computed.outlineStyle,
          width: computed.outlineWidth,
        }
      })
    }

    await loadWithUnknownTelemetry(page)
    const startFocus = await readFocusStyles(page.getByTestId('start-button'))
    await startExperience(page)
    const allowFocus = await readFocusStyles(page.getByTestId('telemetry-allow'))
    await page.getByTestId('telemetry-deny').click()
    await expect(page.getByTestId('deck-rail-toggle')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('deck-rail-tempo-down')).toBeFocused()
    const deckFocus = await page.getByTestId('deck-rail-tempo-down').evaluate(node => {
      const computed = getComputedStyle(node)
      return {
        color: computed.outlineColor,
        style: computed.outlineStyle,
        width: computed.outlineWidth,
      }
    })

    expect(startFocus.style).toBe('solid')
    expect(allowFocus.style).toBe('solid')
    expect(deckFocus.style).toBe('solid')
    expect(startFocus.width).toBe(allowFocus.width)
    expect(allowFocus.width).toBe(deckFocus.width)
    expect(startFocus.color).toBe(allowFocus.color)
    expect(allowFocus.color).toBe(deckFocus.color)
  })

  test('screen-reader announcements describe key state changes', async ({ page }) => {
    await loadWithUnknownTelemetry(page)

    const announcer = page.getByTestId('sr-announcer-polite')
    await expect(announcer).toContainText('Start overlay ready')

    await page.getByTestId('start-button').click()
    await expect(page.getByTestId('start-overlay')).toBeHidden({ timeout: 10000 })
    await expect(page.getByTestId('telemetry-banner')).toBeVisible({ timeout: 10000 })
    await expect(announcer).toContainText('Telemetry choice available. Allow or choose Not now.')

    await page.getByTestId('telemetry-deny').click()
    await expect(announcer).toContainText('Telemetry sharing disabled.')

    await page.getByTestId('deck-rail-mode-cycle').click()
    await expect(announcer).toContainText(/Mode set to/)
  })

  test('remains functional when reduced-motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loadWithDeniedTelemetry(page)
    const overlayOrnamentDisplay = await page
      .getByTestId('start-overlay')
      .evaluate(node => getComputedStyle(node, '::before').display)
    expect(overlayOrnamentDisplay).toBe('none')

    await startExperience(page)
    await expect(page.getByTestId('start-overlay')).toBeHidden()
    await expect(page.getByTestId('main-content')).toBeVisible()

    const deckCollapse = page.getByTestId('deck-collapse-button')
    await expect(deckCollapse).toBeVisible()
    const transitionDurationSeconds = await deckCollapse.evaluate(node => {
      const firstValue = getComputedStyle(node).transitionDuration.split(',')[0]?.trim() ?? '0s'
      if (firstValue.endsWith('ms')) {
        return Number.parseFloat(firstValue) / 1000
      }
      return Number.parseFloat(firstValue)
    })
    await deckCollapse.hover()
    const hoverTranslateY = await deckCollapse.evaluate(node => {
      const transformValue = getComputedStyle(node).transform
      if (transformValue === 'none') return 0
      const matrix = new DOMMatrixReadOnly(transformValue)
      return matrix.m42
    })
    const pulseAnimationName = await page
      .getByTestId('deck-pulse-indicator')
      .evaluate(node => getComputedStyle(node).animationName)

    expect(transitionDurationSeconds).toBeLessThanOrEqual(0.12)
    expect(Math.abs(hoverTranslateY)).toBeLessThanOrEqual(0.1)
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

  test('mobile bottom sheet exposes stable snap points with ergonomic targets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 851 })
    await loadWithDeniedTelemetry(page)
    await startExperience(page)

    const shell = page.locator('#experience-deck-shell')
    const railToggle = page.getByTestId('deck-rail-toggle')
    const snapPeek = page.getByTestId('deck-snap-peek')
    const snapFull = page.getByTestId('deck-snap-full')
    const snapHide = page.getByTestId('deck-snap-collapsed')

    await expect(page.getByTestId('deck-open-button')).toBeVisible({ timeout: 10000 })
    await railToggle.click()

    await expect(shell).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('deck-snap-points')).toBeVisible({ timeout: 10000 })

    const peekHeight = (await shell.boundingBox())?.height ?? 0

    await snapFull.click()
    await expect
      .poll(async () => (await shell.boundingBox())?.height ?? 0)
      .toBeGreaterThan(peekHeight + 30)
    const fullHeight = (await shell.boundingBox())?.height ?? 0

    await snapPeek.click()
    await expect
      .poll(async () => (await shell.boundingBox())?.height ?? 0)
      .toBeLessThan(fullHeight - 20)

    const targetHeights = await Promise.all(
      [snapPeek, snapFull, snapHide].map(locator => locator.boundingBox())
    )
    targetHeights.forEach(target => {
      expect(target?.height ?? 0).toBeGreaterThanOrEqual(38)
    })

    await snapHide.click()
    await expect(page.getByTestId('deck-open-button')).toBeVisible({ timeout: 10000 })
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
