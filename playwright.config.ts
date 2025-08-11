import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  timeout: 60 * 1000, // 60 seconds per test
  
  // Web server configuration - only start if needed
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
    stderr: 'pipe',
    stdout: 'pipe',
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: process.env.CI ? 'off' : 'on-first-retry',
    video: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30 * 1000, // 30 seconds for navigation
    actionTimeout: 15 * 1000, // 15 seconds for actions
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use system Chrome for CI reliability
        channel: process.env.CI ? 'chrome' : undefined,
        // Optimize viewport for faster rendering
        viewport: { width: 1280, height: 720 },
        // Disable certain features for CI stability
        launchOptions: process.env.CI ? {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        } : {}
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Optimize mobile viewport
        viewport: { width: 393, height: 851 }
      },
    },
    // Full browser testing only for staging
    ...(process.env.GITHUB_REF === 'refs/heads/staging' ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],
  
  // Note: timeout already set above for consistency
  
  // Faster assertion timeout
  expect: {
    timeout: 8000, // Reduced from 10s to 8s
  },
  
  // Output directory
  outputDir: 'test-results/',
});
