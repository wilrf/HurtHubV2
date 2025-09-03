import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Vercel deployment testing
 * Uses VERCEL_URL environment variable from deployment context
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  fullyParallel: true,
  retries: 1, // Retry once for network flakiness
  workers: 1,
  reporter: [['list'], ['html']],
  use: {
    // Use Vercel URL from environment or fallback to production
    baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://charlotte-econdev-platform.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Tests run against Vercel deployments, no local server needed
});