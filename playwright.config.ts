import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Set a reasonable timeout for CI */
  timeout: process.env.CI ? 30000 : 60000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only - reduced from 2 to 1 for faster feedback */
  retries: process.env.CI ? 1 : 0,
  /* Use 2 parallel workers in CI for stability */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? "http://localhost:4173" : "http://localhost:5173",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: process.env.CI 
    ? [
        // In CI, only test Chromium for speed
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        // Locally, test all browsers
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },
        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? "npm run preview" : "npm run dev",
    url: process.env.CI ? "http://localhost:4173" : "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
