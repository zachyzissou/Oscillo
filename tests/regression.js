const { test: baseTest, expect, chromium } = require('@playwright/test');
const { spawn } = require('child_process');

(async () => {
  const server = spawn('npm', ['start'], { stdio: 'inherit' });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
  } finally {
    await browser.close();
    server.kill();
  }

  if (errors.some((e) => e.includes('maxVertexTextures'))) {
    console.error('Found maxVertexTextures error:', errors);
    process.exit(1);
  } else {
    console.log('No maxVertexTextures error detected.');
  }
})();
