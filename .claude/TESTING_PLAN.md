# Testing Plan - Hurt Hub V2

*Generated: 2025-09-02*
*Last Updated: 2025-09-02*  
*Framework: Playwright for E2E Testing*

---

## 📋 Executive Summary

Playwright is **already installed and configured** in the project. This document outlines the comprehensive testing strategy for frontend E2E testing using Playwright.

---

## 🎯 Testing Objectives

1. **Ensure critical user flows work end-to-end**
2. **Catch regressions before deployment**
3. **Validate AI chat interactions**
4. **Test cross-browser compatibility**
5. **Verify responsive design**
6. **Ensure accessibility compliance**

---

## 🛠️ Current Testing Setup

### **Installed & Configured**
- ✅ Playwright test runner (`@playwright/test`)
- ✅ Configuration file (`playwright.config.ts`)
- ✅ Test directory structure (`tests/e2e/`)
- ✅ NPM scripts ready to use
- ✅ CI/CD integration ready

### **Available Commands**
```bash
# Run all tests
npm run test:e2e

# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Debug tests step-by-step
npm run test:e2e:debug

# Run tests with browser visible
npm run test:e2e:headed

# View HTML test report
npm run test:e2e:report
```

### **Configuration Highlights**
- **Test Directory**: `tests/e2e/`
- **Base URL**: `http://localhost:5173` (dev), `http://localhost:4173` (CI)
- **Browsers**: Chrome, Firefox, Safari (Chrome only in CI for speed)
- **Parallel Execution**: Yes (locally), No (CI for stability)
- **Auto-retry**: 1 retry in CI
- **Screenshots**: On failure
- **Trace**: On first retry

---

## 🧪 Proposed Test Suite

### **1. AI Chat Features** (`tests/e2e/ai-chat.spec.ts`)

#### Business Intelligence Chat
```typescript
test.describe("Business Intelligence AI Chat", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/business-intelligence");
  });

  test("should send message and receive AI response", async ({ page }) => {
    // Type message
    await page.fill('[data-testid="chat-input"]', 'Tell me about tech companies in Charlotte');
    await page.click('[data-testid="send-button"]');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="ai-message"]')).toContainText(/compan/i);
  });

  test("should display company data in AI responses", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', 'Show me companies with over $1M revenue');
    await page.click('[data-testid="send-button"]');
    
    // Verify structured data appears
    await expect(page.locator('[data-testid="company-card"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="revenue-metric"]')).toBeVisible();
  });

  test("should maintain chat history", async ({ page }) => {
    // Send first message
    await page.fill('[data-testid="chat-input"]', 'First question');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-message"]');
    
    // Send second message
    await page.fill('[data-testid="chat-input"]', 'Second question');
    await page.click('[data-testid="send-button"]');
    
    // Verify both messages exist
    const messages = page.locator('[data-testid="chat-message"]');
    await expect(messages).toHaveCount(4); // 2 user + 2 AI
  });
});
```

#### Community Pulse Chat
```typescript
test.describe("Community Pulse AI Chat", () => {
  test("should provide community-focused responses", async ({ page }) => {
    await page.goto("/community-pulse");
    
    await page.fill('[data-testid="chat-input"]', 'What are the latest business developments?');
    await page.click('[data-testid="send-button"]');
    
    await expect(page.locator('[data-testid="ai-message"]')).toContainText(/development|community|local/i);
  });
});
```

### **2. Search & Discovery** (`tests/e2e/search-companies.spec.ts`)

```typescript
test.describe("Company Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should search companies by name", async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'Bank of America');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-result"]').first()).toContainText(/Bank of America/i);
  });

  test("should filter by industry", async ({ page }) => {
    await page.selectOption('[data-testid="industry-filter"]', 'Technology');
    await page.click('[data-testid="apply-filters"]');
    
    const results = page.locator('[data-testid="company-result"]');
    await expect(results.first()).toBeVisible();
    
    // Verify all results are tech companies
    const industries = await results.locator('[data-testid="industry-tag"]').allTextContents();
    industries.forEach(industry => {
      expect(industry).toContain('Technology');
    });
  });

  test("should filter by revenue range", async ({ page }) => {
    await page.fill('[data-testid="min-revenue"]', '1000000');
    await page.fill('[data-testid="max-revenue"]', '10000000');
    await page.click('[data-testid="apply-filters"]');
    
    await expect(page.locator('[data-testid="company-result"]').first()).toBeVisible();
  });

  test("should handle no results gracefully", async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'xyznonexistentcompany123');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText(/No companies found/i);
  });
});
```

### **3. Company Details** (`tests/e2e/company-details.spec.ts`)

```typescript
test.describe("Company Details Page", () => {
  test("should display company information", async ({ page }) => {
    // Navigate to a specific company
    await page.goto("/company/1"); // Assuming ID-based routing
    
    // Verify key information is displayed
    await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="employee-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-industry"]')).toBeVisible();
  });

  test("should show company developments", async ({ page }) => {
    await page.goto("/company/1");
    
    await expect(page.locator('[data-testid="developments-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="development-item"]').first()).toBeVisible();
  });

  test("should navigate to related companies", async ({ page }) => {
    await page.goto("/company/1");
    
    const relatedCompany = page.locator('[data-testid="related-company"]').first();
    const companyName = await relatedCompany.textContent();
    
    await relatedCompany.click();
    
    await expect(page.locator('[data-testid="company-name"]')).toContainText(companyName);
  });
});
```

### **4. Dashboard & Analytics** (`tests/e2e/dashboard.spec.ts`)

```typescript
test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display key metrics", async ({ page }) => {
    await expect(page.locator('[data-testid="total-companies"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-employees"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-rate"]')).toBeVisible();
  });

  test("should render charts", async ({ page }) => {
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="industry-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-timeline"]')).toBeVisible();
  });

  test("should update metrics when filters change", async ({ page }) => {
    const initialRevenue = await page.locator('[data-testid="total-revenue"]').textContent();
    
    await page.selectOption('[data-testid="time-range"]', '30days');
    await page.waitForLoadState('networkidle');
    
    const updatedRevenue = await page.locator('[data-testid="total-revenue"]').textContent();
    expect(updatedRevenue).not.toBe(initialRevenue);
  });
});
```

### **5. Authentication** (`tests/e2e/auth.spec.ts`)

```typescript
test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/Invalid/i);
  });

  test("should logout successfully", async ({ page, context }) => {
    // First login
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Then logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
  });

  test("should protect authenticated routes", async ({ page }) => {
    // Try to access protected route without login
    await page.goto("/dashboard");
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
```

### **6. Accessibility** (`tests/e2e/accessibility.spec.ts`)

```typescript
test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
    
    // Check heading order
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");
    
    // Tab through interactive elements
    await page.keyboard.press("Tab");
    let focusedElement = await page.locator(":focus").getAttribute("data-testid");
    expect(focusedElement).toBeTruthy();
    
    await page.keyboard.press("Tab");
    focusedElement = await page.locator(":focus").getAttribute("data-testid");
    expect(focusedElement).toBeTruthy();
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/");
    
    // Check main navigation
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveAttribute("aria-label");
    
    // Check main content
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check buttons have accessible text
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
```

### **7. Performance** (`tests/e2e/performance.spec.ts`)

```typescript
test.describe("Performance", () => {
  test("should load homepage within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });

  test("should lazy load images", async ({ page }) => {
    await page.goto("/");
    
    const images = page.locator("img[loading='lazy']");
    const lazyImageCount = await images.count();
    expect(lazyImageCount).toBeGreaterThan(0);
  });

  test("should handle large data sets efficiently", async ({ page }) => {
    await page.goto("/");
    
    // Search for all companies
    await page.click('[data-testid="show-all-companies"]');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="company-result"]');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000); // 2 seconds for large list
  });
});
```

---

## 📁 Test Helper Utilities

### **Page Object Model** (`tests/e2e/helpers/pages/`)

```typescript
// tests/e2e/helpers/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}
  
  async navigate() {
    await this.page.goto('/dashboard');
  }
  
  async getTotalRevenue() {
    return this.page.locator('[data-testid="total-revenue"]').textContent();
  }
  
  async filterByDateRange(range: string) {
    await this.page.selectOption('[data-testid="time-range"]', range);
    await this.page.waitForLoadState('networkidle');
  }
}
```

### **Test Data Factory** (`tests/e2e/helpers/factories/`)

```typescript
// tests/e2e/helpers/factories/companyFactory.ts
export const createTestCompany = (overrides = {}) => ({
  name: 'Test Company',
  industry: 'Technology',
  revenue: 5000000,
  employees_count: 100,
  website: 'https://testcompany.com',
  ...overrides
});
```

### **Common Assertions** (`tests/e2e/helpers/assertions/`)

```typescript
// tests/e2e/helpers/assertions/aiChat.ts
export async function expectValidAIResponse(page: Page) {
  const aiMessage = page.locator('[data-testid="ai-message"]').last();
  await expect(aiMessage).toBeVisible({ timeout: 30000 });
  
  const text = await aiMessage.textContent();
  expect(text).toBeTruthy();
  expect(text.length).toBeGreaterThan(10);
}
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Critical Path Testing** (Week 1)
- [ ] AI Chat basic functionality
- [ ] Company search
- [ ] Dashboard metrics display
- [ ] Basic authentication

### **Phase 2: Feature Coverage** (Week 2)
- [ ] Company details pages
- [ ] Advanced filters
- [ ] Data visualizations
- [ ] Session management

### **Phase 3: Quality & Performance** (Week 3)
- [ ] Accessibility testing
- [ ] Performance benchmarks
- [ ] Cross-browser testing
- [ ] Mobile responsiveness

### **Phase 4: CI/CD Integration** (Week 4)
- [ ] GitHub Actions workflow
- [ ] Automated test runs on PR
- [ ] Test result reporting
- [ ] Performance monitoring

---

## 🔧 CI/CD Integration

### **GitHub Actions Workflow**
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 Test Metrics & Reporting

### **Key Metrics to Track**
1. **Test Coverage**: % of user flows covered
2. **Pass Rate**: % of tests passing
3. **Execution Time**: Average test suite runtime
4. **Flakiness**: Tests that fail intermittently
5. **Browser Coverage**: Tests passing across browsers

### **Reporting Tools**
- **HTML Report**: Built-in Playwright reporter
- **Allure Report**: Rich test reports with history
- **Slack Integration**: Test failure notifications
- **Dashboard**: Custom metrics dashboard

---

## 🛡️ Best Practices

### **Test Writing Guidelines**
1. **Use data-testid attributes** for reliable element selection
2. **Avoid hardcoded waits** - use Playwright's auto-waiting
3. **Keep tests independent** - each test should run in isolation
4. **Use Page Object Model** for maintainability
5. **Write descriptive test names** that explain the scenario
6. **Add comments** for complex test logic
7. **Handle test data cleanup** to avoid pollution

### **Debugging Tips**
```bash
# Debug a specific test
npx playwright test --debug tests/e2e/ai-chat.spec.ts

# Run with headed browser
npx playwright test --headed

# Generate trace for debugging
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### **Performance Optimization**
1. **Run tests in parallel** where possible
2. **Use test.describe.parallel()** for independent tests
3. **Minimize test data setup**
4. **Cache authentication state**
5. **Use API mocking for external services**

---

## 🔍 Monitoring & Maintenance

### **Weekly Tasks**
- Review test failures
- Update selectors if UI changed
- Add tests for new features
- Remove obsolete tests

### **Monthly Tasks**
- Review test performance
- Update Playwright version
- Audit test coverage
- Clean up test data

### **Quarterly Tasks**
- Full test suite review
- Performance baseline update
- Cross-browser compatibility check
- Accessibility audit

---

## 📚 Resources

### **Documentation**
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### **Tools**
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Playwright Inspector](https://playwright.dev/docs/inspector)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

### **Community**
- [Playwright Discord](https://discord.gg/playwright)
- [GitHub Issues](https://github.com/microsoft/playwright/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/playwright)

---

## 🚨 Immediate Actions

1. **Run existing tests** to verify setup:
   ```bash
   npm run test:e2e
   ```

2. **Fix skipped tests** in `tests/e2e/example.spec.ts`

3. **Add data-testid attributes** to key UI elements

4. **Create first real test** for AI chat feature

5. **Set up CI pipeline** for automated testing

---

*This testing plan provides a comprehensive roadmap for implementing E2E testing with Playwright. Start with Phase 1 critical tests and expand coverage incrementally.*