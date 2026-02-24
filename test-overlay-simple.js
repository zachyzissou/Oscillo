const { chromium } = require('@playwright/test');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      timeout: 10000
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Set page timeout
    page.setDefaultTimeout(10000);

    console.log(`Navigating to ${BASE_URL}...`);

    try {
      await page.goto(BASE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      console.log('✅ Page loaded');
    } catch (e) {
      console.error('❌ Failed to load page:', e.message);
      process.exit(1);
    }

    // Quick check for overlay
    try {
      const overlayExists = await page.locator('#start-overlay').count() > 0;
      console.log(`Start Overlay in DOM: ${overlayExists ? 'YES ✅' : 'NO ❌'}`);

      if (overlayExists) {
        const isVisible = await page.locator('#start-overlay').isVisible();
        console.log(`Start Overlay Visible: ${isVisible ? 'YES ✅' : 'NO ❌'}`);
      }
    } catch (e) {
      console.log('Error checking overlay:', e.message);
    }

    // Check for debug panel
    try {
      const debugPanelExists = await page.locator('text=Audio Debug Panel').count() > 0;
      console.log(`Audio Debug Panel Exists: ${debugPanelExists ? 'YES ✅' : 'NO ❌'}`);
    } catch (e) {
      console.log('Error checking debug panel:', e.message);
    }

    // Get page title
    const title = await page.title();
    console.log(`Page Title: "${title}"`);

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
