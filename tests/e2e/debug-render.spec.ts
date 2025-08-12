import { test } from '@playwright/test';

test('Debug component rendering', async ({ page }) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Log console messages
  console.log('=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  // Check the page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for React hydration
  const hasReactRoot = await page.evaluate(() => {
    const element = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
    return !!element;
  });
  console.log('React root element found:', hasReactRoot);
  
  // Check if JavaScript is working at all
  const jsWorking = await page.evaluate(() => {
    try {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    } catch (e) {
      return false;
    }
  });
  console.log('JavaScript working:', jsWorking);
  
  // Check for main content
  const hasMainContent = await page.evaluate(() => {
    return !!document.querySelector('#main-content');
  });
  console.log('Main content found:', hasMainContent);
  
  // Check all elements with data-testid
  const testIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid]');
    return Array.from(elements).map(el => el.getAttribute('data-testid'));
  });
  console.log('Available test IDs:', testIds);
  
  // Check React components specifically
  const hasImmersiveComponent = await page.evaluate(() => {
    return document.body.textContent?.includes('Musical Universe') || false;
  });
  console.log('Has Musical Universe text:', hasImmersiveComponent);
});