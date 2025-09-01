import { test, expect } from "@playwright/test";

test.describe("Charlotte Economic Development Platform", () => {
  test("should display the homepage correctly", async ({ page }) => {
    await page.goto("/");

    // Check if the page loads
    await expect(page).toHaveTitle(/Charlotte Economic Development Platform/);

    // Check for main navigation elements
    await expect(page.locator("nav")).toBeVisible();

    // Check for main content area
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate between pages", async ({ page }) => {
    await page.goto("/");

    // Test navigation to Community Pulse
    await page.click("text=Community Pulse");
    await expect(page).toHaveURL(/.*community/);

    // Test navigation to Business Intelligence
    await page.click("text=Business Intelligence");
    await expect(page).toHaveURL(/.*business-intelligence/);

    // Test navigation back to home
    await page.click("text=Home");
    await expect(page).toHaveURL("/");
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check if mobile navigation is working
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("should handle theme switching", async ({ page }) => {
    await page.goto("/");

    // Look for theme toggle button and click it
    const themeToggle = page.locator(
      '[aria-label*="theme"], [data-testid="theme-toggle"]',
    );
    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Verify theme change (look for dark mode class or attribute)
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        /dark|light/,
      );
    }
  });
});

test.describe("Search Functionality", () => {
  test("should allow searching for companies", async ({ page }) => {
    await page.goto("/");

    // Look for search input - use first() to handle multiple matches
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i]',
    ).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test company");
      await searchInput.press("Enter");

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check if search results are displayed
      await expect(page.locator("main")).toContainText(
        /result|company|search/i,
      );
    }
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading structure
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Ensure there's only one h1
    await expect(h1).toHaveCount(1);
  });

  test("should have proper focus management", async ({ page }) => {
    await page.goto("/");

    // Test keyboard navigation
    await page.keyboard.press("Tab");

    // Check if first focusable element is focused
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/");

    // Check for navigation landmarks
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});
