const { defineConfig, devices } = require('@playwright/test');
const os = require('node:os');
const path = require('node:path');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: path.join(os.tmpdir(), 'locksora-playwright-results'),
  timeout: 30_000,
  fullyParallel: false,
  workers: process.env.CI ? 3 : 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:43117',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'tablet-chromium', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 1000 } } }
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:43117',
    reuseExistingServer: false,
    timeout: 120_000
  }
});
