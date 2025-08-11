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
  
  // Optimized web server configuration for faster startup
  webServer: {
    command: process.env.CI ? 'npm run build && npm start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: true, // Always reuse for testing
    timeout: process.env.CI ? 90000 : 120000, // Increased timeout for CI build
    stderr: 'pipe',
    stdout: 'pipe',
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off', // Disable tracing for CI to avoid FFmpeg issues
    video: 'off', // Disable video recording for CI
    screenshot: 'only-on-failure',
    navigationTimeout: 30 * 1000, // 30 seconds for navigation
    actionTimeout: 15 * 1000, // 15 seconds for actions
    // Headless mode for CI compatibility
    headless: true,
    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
    // Chromium args for CI environment
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--use-gl=swiftshader',
        '--single-process'
      ]
    }
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimize viewport for faster rendering
        viewport: { width: 1280, height: 720 },
        // Use system chrome if available
        executablePath: '/usr/bin/google-chrome',
        // Override launch options for CI
        launchOptions: {
          executablePath: '/usr/bin/google-chrome',
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--use-gl=swiftshader',
            '--single-process',
            '--no-first-run',
            '--disable-extensions',
            '--disable-default-apps',
            '--headless'
          ]
        }
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
