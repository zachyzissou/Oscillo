import type { Page } from '@playwright/test'

export async function startExperience(page: Page, { waitForAudio = false } = {}) {
  const overlay = page.locator('#start-overlay')
  const button = page.getByTestId('start-button')
  const canStart = await button
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false)

  if (canStart) {
    await button.scrollIntoViewIfNeeded()
    await button.click({ force: true })
    await overlay.waitFor({ state: 'hidden', timeout: 7000 })
  }

  if (waitForAudio) {
    await page.waitForFunction(() => {
      return typeof (window as any).__toneNodes__ !== 'undefined'
    }, null, { timeout: 7000 })
  }
}
