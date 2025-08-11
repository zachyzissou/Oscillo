// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for app to initialize
    await page.waitForSelector('[data-testid="canvas-container"]', { timeout: 30000 })
  })

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('#canvas') // Skip WebGL canvas as it's inherently visual
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Test Tab navigation through interactive elements
    await page.keyboard.press('Tab')
    
    // Should focus on the spawn button first
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(focusedElement).toBe('spawn-button')
    
    // Continue tabbing to other controls
    await page.keyboard.press('Tab')
    const nextFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT', 'SELECT']).toContain(nextFocused)
  })

  test('should provide proper ARIA labels', async ({ page }) => {
    // Check spawn button has proper labeling
    const spawnButton = page.locator('[data-testid="spawn-button"]')
    await expect(spawnButton).toHaveAttribute('aria-label')
    
    // Check audio controls have labels
    const audioControls = page.locator('[data-testid*="audio"]')
    const count = await audioControls.count()
    
    for (let i = 0; i < count; i++) {
      const control = audioControls.nth(i)
      const hasLabel = await control.evaluate(el => 
        el.hasAttribute('aria-label') || 
        el.hasAttribute('aria-labelledby') ||
        el.closest('label') !== null
      )
      expect(hasLabel).toBe(true)
    }
  })

  test('should provide audio descriptions for visual feedback', async ({ page }) => {
    // Click spawn button and check for audio feedback description
    await page.click('[data-testid="spawn-button"]')
    
    // Look for screen reader announcements or live regions
    const liveRegion = page.locator('[aria-live]')
    await expect(liveRegion).toBeVisible()
    
    // Check that important state changes are announced
    const announcement = await liveRegion.textContent()
    expect(announcement).toContain('shape') // Should announce shape creation
  })

  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    
    // Should have at least one main heading
    expect(headings.length).toBeGreaterThan(0)
    
    // Check heading hierarchy (simplified check)
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
    )
    
    // First heading should be h1 or h2
    expect(headingLevels[0]).toBeLessThanOrEqual(2)
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check that animations are reduced or disabled
    const animatedElements = page.locator('[style*="transition"], [class*="animate"]')
    const count = await animatedElements.count()
    
    for (let i = 0; i < count; i++) {
      const element = animatedElements.nth(i)
      const styles = await element.evaluate(el => getComputedStyle(el))
      
      // Animation duration should be very short or none
      expect(
        styles.animationDuration === 'none' || 
        styles.animationDuration === '0s' ||
        styles.transitionDuration === 'none' ||
        styles.transitionDuration === '0s'
      ).toBe(true)
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .exclude('#canvas')
      .analyze()

    const contrastViolations = contrastResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(contrastViolations).toEqual([])
  })

  test('should support screen reader users', async ({ page }) => {
    // Test with screen reader simulation
    await page.addInitScript(() => {
      // Mock screen reader behavior
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: navigator.userAgent + ' NVDA/2023.1'
      })
    })
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check for proper landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').count()
    expect(landmarks).toBeGreaterThan(0)
    
    // Check for skip links
    const skipLink = page.locator('a[href="#main"], a[href="#content"]').first()
    if (await skipLink.count() > 0) {
      await expect(skipLink).toHaveText(/skip/i)
    }
  })

  test('should handle focus management', async ({ page }) => {
    // Open bottom drawer (if it exists)
    const drawerTrigger = page.locator('[data-testid*="drawer"], [data-testid*="menu"]').first()
    
    if (await drawerTrigger.count() > 0) {
      await drawerTrigger.click()
      
      // Focus should move to the drawer
      const focusedElement = await page.evaluate(() => document.activeElement)
      expect(focusedElement).toBeTruthy()
      
      // Test escape key closes drawer and returns focus
      await page.keyboard.press('Escape')
      
      // Focus should return to trigger or body
      const returnedFocus = await page.evaluate(() => document.activeElement?.tagName)
      expect(['BUTTON', 'BODY']).toContain(returnedFocus)
    }
  })

  test('should provide alternative text for images', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const hasAlt = await img.getAttribute('alt')
      const isDecorative = await img.getAttribute('role') === 'presentation'
      
      // Images should have alt text or be marked as decorative
      expect(hasAlt !== null || isDecorative).toBe(true)
    }
  })

  test('should work with high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addInitScript(() => {
      const style = document.createElement('style')
      style.textContent = `
        @media (prefers-contrast: high) {
          * {
            background-color: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
      document.head.appendChild(style)
    })
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // App should still be functional
    await page.click('[data-testid="spawn-button"]')
    await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible()
  })
})