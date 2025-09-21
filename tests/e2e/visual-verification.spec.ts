import { test, expect, Page } from '@playwright/test';

test.describe('Oscillo Application - Visual Verification', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console errors for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Capture page errors
    page.on('pageerror', err => {
      console.log('Page error:', err.message);
    });
    
    await page.goto('/');
  });

  test('application visual state analysis', async () => {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/home-initial-state.png',
      fullPage: true 
    });
    
    // Check what's actually visible on the page
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Page HTML length:', bodyContent.length);
    
    // Look for any elements that might be the start overlay
    const overlayElements = await page.locator('div').all();
    console.log('Found div elements:', overlayElements.length);
    
    // Check for canvas elements
    const canvases = await page.locator('canvas').all();
    console.log('Found canvas elements:', canvases.length);
    
    if (canvases.length > 0) {
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        const isVisible = await canvas.isVisible();
        const bbox = await canvas.boundingBox();
        console.log(`Canvas ${i}: visible=${isVisible}, bbox=`, bbox);
      }
    }
    
    // Look for any text that might indicate the start overlay
    const textContent = await page.textContent('body');
    console.log('Page text content preview:', textContent?.substring(0, 200));
    
    // Check if there are any elements with overlay-related text (start, interactive, music)
    const startElements = await page.getByText(/start|interactive|music/i).all();
    console.log('Found start-related elements:', startElements.length);
    
    if (startElements.length > 0) {
      for (let i = 0; i < startElements.length; i++) {
        const element = startElements[i];
        const isVisible = await element.isVisible();
        const text = await element.textContent();
        console.log(`Start element ${i}: visible=${isVisible}, text="${text}"`);
      }
    }
    
    // Try to find the specific text from ModernStartOverlay
    const overlayHeading = page.getByText(/interactive 3d music experience/i);
    const headingCount = await overlayHeading.count();
    console.log('Overlay heading found:', headingCount);
    
    if (headingCount > 0) {
      const isVisible = await overlayHeading.isVisible();
      console.log('Overlay heading visible:', isVisible);
    }
  });

  test('interactive elements detection', async () => {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Try clicking anywhere on the page to see if it triggers the start overlay
    await page.click('body');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/after-click.png',
      fullPage: true 
    });
    
    // Check if canvas becomes visible after click
    const canvases = await page.locator('canvas').all();
    if (canvases.length > 0) {
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        const isVisible = await canvas.isVisible();
        const bbox = await canvas.boundingBox();
        console.log(`After click - Canvas ${i}: visible=${isVisible}, bbox=`, bbox);
      }
    }
  });

  test('responsive design verification', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/mobile-view.png',
      fullPage: true 
    });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/tablet-view.png',
      fullPage: true 
    });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/desktop-view.png',
      fullPage: true 
    });
  });
});
