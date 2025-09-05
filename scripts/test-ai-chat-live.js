#!/usr/bin/env node

/**
 * Test AI Chat on Live Production Site
 * Uses Playwright to interact with the AI assistant
 */

import { chromium } from "playwright";

async function testAIChat() {
  console.log("🚀 Launching browser to test AI chat...");

  const browser = await chromium.launch({
    headless: true, // Set to false if you want to see the browser
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Navigate to the site
    console.log("📍 Navigating to https://hurt-hub-v2.vercel.app...");
    await page.goto("https://hurt-hub-v2.vercel.app", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Click on Business Intelligence
    console.log("🏢 Clicking on Business Intelligence...");
    await page.click("text=Business Intelligence", { timeout: 10000 });

    // Wait for AI chat to load - look for the actual input element
    console.log("⏳ Waiting for AI chat to load...");
    await page.waitForTimeout(3000); // Give page time to load

    // Try different selectors for the chat input
    let chatInput;
    try {
      chatInput = await page.locator('input[type="text"]').first();
    } catch {
      chatInput = await page.locator("textarea").first();
    }

    // Test 1: Ask about total companies
    console.log("\n📝 Test 1: Asking about total companies...");
    await chatInput.fill("How many total companies are in the database?");
    await chatInput.press("Enter");

    // Wait for response
    await page.waitForTimeout(5000);

    // Get the last message
    const messages = await page
      .locator('[class*="message"], div[role="log"], .prose')
      .allTextContents();
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : "No response found";
    console.log(
      "🤖 AI Response:",
      lastMessage.substring(0, Math.min(200, lastMessage.length)) +
        (lastMessage.length > 200 ? "..." : ""),
    );

    // Test 2: Ask about restaurants
    console.log("\n📝 Test 2: Asking about Charlotte restaurants...");
    await chatInput.fill(
      "List some Charlotte food service businesses like Albertine, Bos on Noda, or Kitchen + Kocktails",
    );
    await chatInput.press("Enter");

    await page.waitForTimeout(5000);

    const messages2 = await page
      .locator('[class*="message"], div[role="log"], .prose')
      .allTextContents();
    const lastMessage2 =
      messages2.length > 0
        ? messages2[messages2.length - 1]
        : "No response found";
    console.log(
      "🤖 AI Response:",
      lastMessage2.substring(0, Math.min(200, lastMessage2.length)) +
        (lastMessage2.length > 200 ? "..." : ""),
    );

    // Test 3: Ask about specific industry
    console.log("\n📝 Test 3: Asking about technology companies...");
    await chatInput.fill("Show me all technology companies with their revenue");
    await chatInput.press("Enter");

    await page.waitForTimeout(5000);

    const messages3 = await page
      .locator('[class*="message"], div[role="log"], .prose')
      .allTextContents();
    const lastMessage3 =
      messages3.length > 0
        ? messages3[messages3.length - 1]
        : "No response found";
    console.log(
      "🤖 AI Response:",
      lastMessage3.substring(0, Math.min(200, lastMessage3.length)) +
        (lastMessage3.length > 200 ? "..." : ""),
    );

    // Take a screenshot
    console.log("\n📸 Taking screenshot...");
    await page.screenshot({ path: "ai-chat-test.png", fullPage: true });
    console.log("✅ Screenshot saved as ai-chat-test.png");

    // Check if responses mention actual data
    const allResponses = messages
      .concat(messages2, messages3)
      .join(" ")
      .toLowerCase();

    console.log("\n📊 Analysis Results:");
    if (
      allResponses.includes("299") ||
      allResponses.includes("two hundred ninety")
    ) {
      console.log("✅ AI correctly identifies 299 companies!");
    } else if (allResponses.includes("50") || allResponses.includes("fifty")) {
      console.log("⚠️ AI sees limited data (50 companies)");
    }

    if (
      allResponses.includes("albertine") ||
      allResponses.includes("kitchen") ||
      allResponses.includes("food")
    ) {
      console.log("✅ AI can access restaurant data!");
    } else {
      console.log("⚠️ AI might not be seeing restaurant data");
    }

    if (
      allResponses.includes("honeywell") ||
      allResponses.includes("technology")
    ) {
      console.log("✅ AI can query by industry!");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Take error screenshot
    await page.screenshot({ path: "ai-chat-error.png", fullPage: true });
    console.log("📸 Error screenshot saved as ai-chat-error.png");
  } finally {
    await browser.close();
    console.log("\n🏁 Test complete!");
  }
}

// Run the test
testAIChat().catch(console.error);
