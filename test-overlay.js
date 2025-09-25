const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[Browser Console]: ${text}`);
    logs.push(text);
  });

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Wait a bit for React to render
  await page.waitForTimeout(2000);

  // Check for start overlay
  const overlayVisible = await page.locator('#start-overlay').isVisible().catch(() => false);
  console.log(`\n✓ Start Overlay Visible: ${overlayVisible ? 'YES ✅' : 'NO ❌'}`);

  // Check localStorage
  const localStorageValue = await page.evaluate(() => localStorage.getItem('hasSeenOverlay'));
  console.log(`✓ localStorage hasSeenOverlay: ${localStorageValue || 'null'}`);

  // Check for audio debug panel
  const debugPanelExists = await page.locator('text=Audio Debug Panel').isVisible().catch(() => false);
  console.log(`✓ Audio Debug Panel Visible: ${debugPanelExists ? 'YES ✅' : 'NO ❌'}`);

  // Get page title to verify it loaded
  const title = await page.title();
  console.log(`✓ Page Title: ${title}`);

  // Check if there are any React errors
  const reactErrors = logs.filter(log => log.includes('Error') || log.includes('Warning'));
  if (reactErrors.length > 0) {
    console.log('\n⚠ React Errors/Warnings Found:');
    reactErrors.forEach(err => console.log(`  - ${err}`));
  }

  // Check for ModernStartOverlay console logs
  const overlayLogs = logs.filter(log => log.includes('[ModernStartOverlay]'));
  if (overlayLogs.length > 0) {
    console.log('\n📋 ModernStartOverlay Debug Logs:');
    overlayLogs.forEach(log => console.log(`  ${log}`));
  } else {
    console.log('\n❌ No ModernStartOverlay debug logs found - component may not be mounting');
  }

  // Try to find the start button
  const startButton = await page.locator('[data-testid="start-button"]').isVisible().catch(() => false);
  console.log(`✓ Start Button Visible: ${startButton ? 'YES ✅' : 'NO ❌'}`);

  // Get the full HTML to see what's actually rendered
  const bodyHTML = await page.locator('body').innerHTML();
  const hasCanvas = bodyHTML.includes('canvas');
  const hasOverlayInDOM = bodyHTML.includes('start-overlay');

  console.log(`\n✓ Canvas Element in DOM: ${hasCanvas ? 'YES' : 'NO'}`);
  console.log(`✓ Start Overlay ID in DOM: ${hasOverlayInDOM ? 'YES' : 'NO'}`);

  await browser.close();

  console.log('\n========================================');
  console.log('Test Complete. Summary:');
  console.log(`- Overlay Visible: ${overlayVisible ? '✅' : '❌'}`);
  console.log(`- Debug Panel: ${debugPanelExists ? '✅' : '❌'}`);
  console.log(`- Start Button: ${startButton ? '✅' : '❌'}`);
  console.log(`- ModernStartOverlay Logs: ${overlayLogs.length > 0 ? '✅' : '❌'}`);
  console.log('========================================');

  process.exit(overlayVisible ? 0 : 1);
})();