import type { Page } from '@playwright/test'

export async function startExperience(page: Page, { waitForAudio = false } = {}) {
  const overlay = page.locator('#start-overlay')
  if (await overlay.isVisible()) {
    const button = page.getByTestId('start-button')
    await button.waitFor({ state: 'visible' })
    await button.scrollIntoViewIfNeeded()
    await button.evaluate((node) => (node as HTMLButtonElement).click())
    await overlay.waitFor({ state: 'hidden', timeout: 7000 })
  }

  if (waitForAudio) {
    await page.waitForFunction(() => {
      return typeof (window as any).__toneNodes__ !== 'undefined'
    }, null, { timeout: 7000 })
  }
}
