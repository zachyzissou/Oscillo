const { chromium } = require('playwright');

async function testOverlayClick() {
  console.log('=== Testing Overlay Click ===\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 500 // Slow down actions
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen for console messages
    page.on('console', msg => {
      console.log(`Browser: ${msg.text()}`);
    });

    console.log('1. Navigating to app...');
    await page.goto('http://localhost:3004');

    console.log('2. Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Try to find and click the start button
    console.log('3. Looking for start button...');

    // Try multiple selectors
    const selectors = [
      'button:has-text("Start Creating")',
      '[data-testid="start-button"]',
      'button.bg-gradient-to-r',
      '#start-overlay button',
      'text=Start Creating'
    ];

    let buttonFound = false;
    for (const selector of selectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`   ✓ Found button with selector: ${selector}`);
          console.log('4. Clicking start button...');
          await button.click();
          buttonFound = true;
          break;
        }
      } catch (e) {
        console.log(`   ✗ Not found with: ${selector}`);
      }
    }

    if (!buttonFound) {
      console.log('   ❌ No start button found!');

      // Check if overlay exists at all
      const overlay = await page.locator('#start-overlay');
      const overlayCount = await overlay.count();
      console.log(`   Overlay elements found: ${overlayCount}`);

      if (overlayCount > 0) {
        const isVisible = await overlay.isVisible();
        const opacity = await overlay.evaluate(el => window.getComputedStyle(el).opacity);
        const display = await overlay.evaluate(el => window.getComputedStyle(el).display);
        const zIndex = await overlay.evaluate(el => window.getComputedStyle(el).zIndex);

        console.log(`   Overlay visible: ${isVisible}`);
        console.log(`   Overlay opacity: ${opacity}`);
        console.log(`   Overlay display: ${display}`);
        console.log(`   Overlay z-index: ${zIndex}`);
      }
    } else {
      console.log('5. Waiting for audio to initialize...');
      await page.waitForTimeout(2000);

      // Check if overlay is gone
      const overlayGone = await page.locator('#start-overlay').count() === 0;
      console.log(`   Overlay removed: ${overlayGone}`);
    }

    console.log('\n=== Test Complete ===');
    console.log('Press Ctrl+C to close the browser...');

    // Keep browser open
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testOverlayClick().catch(console.error);