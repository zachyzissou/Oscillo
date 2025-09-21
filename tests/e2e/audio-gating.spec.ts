import { test, expect } from '@playwright/test'
import { startExperience } from './utils/startExperience'

test.describe('Audio Gating & Hydration Safety', () => {
  test('does not initialize audio before Start; initializes after', async ({ page }) => {
    const logs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      logs.push(text)
    })

    await page.goto('/')

    // Start overlay should be visible
    const startOverlay = page.locator('#start-overlay')
    await expect(startOverlay).toBeVisible()

    // Before starting, audio internals should not be present
    const beforeAudio = await page.evaluate(() => ({
      hasToneNodes: typeof (window as any).__toneNodes__ !== 'undefined',
    }))
    expect(beforeAudio.hasToneNodes).toBeFalsy()

    await startExperience(page, { waitForAudio: true })

    // After starting, audio internals should appear eventually
    await expect.poll(async () => {
      return page.evaluate(() => typeof (window as any).__toneNodes__ !== 'undefined')
    }, { message: 'Audio engine did not initialize' }).toBeTruthy()

    // Sanity: Page had no hydration errors
    const joinedLogs = logs.join('\n')
    expect(joinedLogs).not.toMatch(/hydration/i)
    expect(joinedLogs).not.toMatch(/did not match/i)
  })
})
