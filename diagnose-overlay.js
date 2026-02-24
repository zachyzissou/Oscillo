const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function diagnoseOverlay() {
  console.log('=== Starting Overlay Diagnostic ===\n');

  // Create results directory
  const resultsDir = path.join(__dirname, 'diagnostic-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  let browser;
  try {
    // Launch browser in headless mode
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // Capture all console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
      console.log(`Browser Console: ${logEntry}`);
    });

    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
      console.log(`Page Error: ${err.message}`);
    });

    console.log(`1. Navigating to ${BASE_URL}...`);

    // Navigate with network idle wait
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('2. Page loaded. Waiting for content...');
    await page.waitForTimeout(3000); // Wait for React to fully render

    // Take screenshot
    const screenshotPath = path.join(resultsDir, 'page-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`3. Screenshot saved to: ${screenshotPath}`);

    // Get page title
    const title = await page.title();
    console.log(`4. Page Title: "${title}"`);

    // Check for overlay element
    console.log('\n5. Checking for overlay element...');
    const overlayExists = await page.locator('#start-overlay').count() > 0;

    if (overlayExists) {
      const overlayVisible = await page.locator('#start-overlay').isVisible();
      const overlayHTML = await page.locator('#start-overlay').innerHTML().catch(() => 'Could not get HTML');
      console.log(`   - Overlay exists: YES`);
      console.log(`   - Overlay visible: ${overlayVisible ? 'YES' : 'NO'}`);

      // Save overlay HTML
      fs.writeFileSync(
        path.join(resultsDir, 'overlay-content.html'),
        overlayHTML
      );
    } else {
      console.log(`   - Overlay exists: NO`);
    }

    // Check for start button
    const startButtonExists = await page.locator('[data-testid="start-button"]').count() > 0;
    console.log(`6. Start button exists: ${startButtonExists ? 'YES' : 'NO'}`);

    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      return {
        hasSeenOverlay: localStorage.getItem('hasSeenOverlay'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log(`7. localStorage hasSeenOverlay: "${localStorageData.hasSeenOverlay}"`);

    // Get full page HTML
    const pageHTML = await page.content();
    fs.writeFileSync(
      path.join(resultsDir, 'page-full.html'),
      pageHTML
    );
    console.log(`8. Full page HTML saved (${pageHTML.length} characters)`);

    // Get body HTML for inspection
    const bodyHTML = await page.locator('body').innerHTML();
    fs.writeFileSync(
      path.join(resultsDir, 'body-content.html'),
      bodyHTML
    );

    // Save console logs
    fs.writeFileSync(
      path.join(resultsDir, 'console-logs.txt'),
      consoleLogs.join('\n') || 'No console logs captured'
    );

    // Check for specific elements
    console.log('\n9. Element Detection:');
    const elements = {
      'Canvas': await page.locator('canvas').count(),
      'Audio Debug Panel': await page.locator('text=Audio Debug Panel').count(),
      'Three.js container': await page.locator('div[style*="position: fixed"]').count(),
      'React root': await page.locator('#__next').count() || await page.locator('#root').count(),
      'Start overlay divs': await page.locator('div[id*="start"], div[class*="overlay"]').count()
    };

    for (const [name, count] of Object.entries(elements)) {
      console.log(`   - ${name}: ${count}`);
    }

    // Generate diagnostic report
    const report = {
      timestamp: new Date().toISOString(),
      pageTitle: title,
      overlay: {
        exists: overlayExists,
        visible: overlayExists ? await page.locator('#start-overlay').isVisible() : false
      },
      localStorage: localStorageData,
      elements: elements,
      consoleLogs: consoleLogs.length,
      pageErrors: pageErrors,
      htmlLength: pageHTML.length
    };

    fs.writeFileSync(
      path.join(resultsDir, 'diagnostic-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== Diagnostic Complete ===');
    console.log(`Results saved to: ${resultsDir}`);
    console.log('\nSummary:');
    console.log(`- Overlay found: ${report.overlay.exists ? '✅' : '❌'}`);
    console.log(`- Overlay visible: ${report.overlay.visible ? '✅' : '❌'}`);
    console.log(`- Console logs: ${consoleLogs.length}`);
    console.log(`- Page errors: ${pageErrors.length}`);

    return report;

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the diagnostic
diagnoseOverlay()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
