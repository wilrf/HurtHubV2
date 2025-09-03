import { defineConfig, devices } from "@playwright/test";

/**
 * Vercel-only Playwright configuration
 * Uses VERCEL_URL environment variable from GitHub Actions
 * No local development - tests run against preview deployments
 */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Extended timeout for Vercel deployments */
  timeout: 60000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry once for network flakiness */
  retries: 1,
  /* Use single worker for Vercel testing */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }], ['github']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL from Vercel deployment */
    baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://charlotte-econdev-platform.vercel.app',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure for debugging */
    screenshot: "only-on-failure",
    /* Video recording for failed tests */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
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

  /* No webServer - tests run against Vercel deployments */
  // Vercel-only: Tests run against live preview URLs, no local server needed
});
