import { test, expect } from "@playwright/test";

test.describe("Basic Tests", () => {
  test("should load homepage", async ({ page }) => {
    // Simple test that just checks if the page loads
    await page.goto("/", { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Just check that we have a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test("should have navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Check for any nav element
    const navExists = await page.locator("nav").count();
    expect(navExists).toBeGreaterThan(0);
  });
});