import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for testing with vercel dev
 * (external server already running)
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  fullyParallel: true,
  retries: 0,
  workers: 1, // Use single worker for this test
  reporter: [['list'], ['html']],
  use: {
    baseURL: 'http://localhost:3009', // Match Vercel dev server
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
  // No webServer - we're using external vercel dev
});