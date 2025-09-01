import type { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting E2E test teardown...");

  try {
    // Perform any global cleanup tasks here
    // Example: clean up test data, close external connections, etc.

    console.log("✅ E2E test teardown completed");
  } catch (error) {
    console.error("❌ E2E test teardown failed:", error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;
