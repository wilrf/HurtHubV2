import { chromium, type FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting E2E test setup...");

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the Vercel deployment to be ready
    const testUrl = process.env.TEST_URL || config.webServer?.url || "https://hurt-hub-v2.vercel.app";
    console.log(`⏳ Waiting for deployment at ${testUrl}...`);
    await page.goto(testUrl);
    await page.waitForSelector("body", { timeout: 30000 });

    // Perform any global setup tasks here
    // Example: seed test data, authenticate test users, etc.

    console.log("✅ E2E test setup completed");
  } catch (error) {
    console.error("❌ E2E test setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
