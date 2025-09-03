import { test, expect } from '@playwright/test';

/**
 * Vercel.json Rewrite Fix Validation Tests
 * 
 * Tests the fix for static asset serving that was causing:
 * - manifest.json to return HTML instead of JSON
 * - Vite import analysis errors
 * - General static asset serving issues
 */

const BASE_URL = 'http://localhost:3005';

test.describe('Static Asset Serving Fix Validation', () => {

  test('manifest.json should return valid JSON, not HTML', async ({ request, page }) => {
    // Direct API request test
    const response = await request.get(`${BASE_URL}/manifest.json`);
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
    
    const data = await response.json();
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('short_name');
    
    console.log('✅ manifest.json returns valid JSON');
    
    // Browser test - check if browser can parse it correctly
    await page.goto(BASE_URL);
    
    const manifestResponse = await page.waitForResponse(
      response => response.url().includes('manifest.json'),
      { timeout: 10000 }
    );
    
    expect(manifestResponse.status()).toBe(200);
    const responseText = await manifestResponse.text();
    expect(responseText).not.toContain('<!doctype html>');
    expect(responseText).toContain('"name"');
    
    console.log('✅ Browser successfully loads manifest.json without HTML');
  });

  test('static assets should load correctly', async ({ request, page }) => {
    // Test assets directory
    await page.goto(BASE_URL);
    
    // Wait for page to load and check for any JS/CSS assets
    await page.waitForLoadState('networkidle');
    
    // Check if any assets loaded
    const assetsRequests = [];
    page.on('response', response => {
      if (response.url().includes('/assets/')) {
        assetsRequests.push(response);
      }
    });
    
    // Force a refresh to capture asset requests
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log(`✅ Found ${assetsRequests.length} asset requests`);
    
    // Verify at least some assets loaded successfully
    const successfulAssets = assetsRequests.filter(req => req.status() === 200);
    expect(successfulAssets.length).toBeGreaterThan(0);
    
    console.log(`✅ ${successfulAssets.length} assets loaded successfully`);
  });

  test('improvedDemoData.json should return JSON if it exists', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/improvedDemoData.json`);
    
    if (response.status() === 200) {
      const responseText = await response.text();
      expect(responseText).not.toContain('<!doctype html>');
      
      // Should be valid JSON
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      
      console.log('✅ improvedDemoData.json returns valid JSON');
    } else {
      console.log('ℹ️ improvedDemoData.json not found (404) - this is fine');
    }
  });

  test('should not have Vite import analysis errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check for specific Vite import analysis errors
    const viteErrors = consoleErrors.filter(error => 
      error.includes('import-analysis') || 
      error.includes('Unexpected token') ||
      error.includes('SyntaxError')
    );
    
    expect(viteErrors.length).toBe(0);
    
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors found:', consoleErrors);
    } else {
      console.log('✅ No Vite import analysis errors');
    }
  });

});

test.describe('React Router Functionality', () => {

  test('homepage should load correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Should not show 404 or error page
    const content = await page.textContent('body');
    expect(content).not.toContain('404');
    expect(content).not.toContain('Not Found');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/homepage-loaded.png', fullPage: true });
    
    console.log('✅ Homepage loads successfully');
  });

  test('client-side routing should work', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Test direct navigation to a route
    await page.goto(`${BASE_URL}/business-intelligence`);
    await page.waitForLoadState('networkidle');
    
    // Should serve the SPA, not 404
    const response = await page.goto(`${BASE_URL}/business-intelligence`);
    expect(response?.status()).toBe(200);
    
    // Should contain React app content, not 404
    const content = await page.textContent('body');
    expect(content).not.toContain('404');
    
    console.log('✅ Client-side routing works');
  });

  test('non-existent routes should serve SPA for React Router', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/some-random-route`);
    expect(response?.status()).toBe(200);
    
    // Should serve index.html (SPA) to let React Router handle it
    const content = await page.content();
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('<div id="root">');
    
    console.log('✅ Non-existent routes serve SPA correctly');
  });

});

test.describe('API Endpoints', () => {

  test('API routes should not be affected', async ({ request }) => {
    // Test a known API endpoint
    const response = await request.get(`${BASE_URL}/api/businesses?limit=1`);
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('businesses');
      console.log('✅ API endpoints work correctly');
    } else {
      console.log(`ℹ️ API endpoint returned ${response.status()} - may need environment setup`);
    }
  });

});

test.describe('Error Handling', () => {

  test('non-existent static assets should 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/assets/nonexistent.js`);
    
    // Should 404, not serve HTML
    expect(response.status()).toBe(404);
    
    console.log('✅ Non-existent assets return 404');
  });

  test('non-existent files in root should serve SPA', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/nonexistent-file.txt`);
    
    // Should serve SPA (200), not 404
    expect(response.status()).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('<!doctype html>');
    
    console.log('✅ Non-existent files serve SPA for React Router');
  });

});

test.describe('Network and Performance', () => {

  test('response headers should be appropriate', async ({ request }) => {
    // Test manifest.json headers
    const manifestResponse = await request.get(`${BASE_URL}/manifest.json`);
    if (manifestResponse.status() === 200) {
      const cacheControl = manifestResponse.headers()['cache-control'];
      expect(cacheControl).toContain('max-age=0');
      console.log('✅ manifest.json has appropriate cache headers');
    }
    
    // Test assets headers (if any assets exist)
    const assetsResponse = await request.get(`${BASE_URL}/assets/`);
    if (assetsResponse.status() === 200) {
      console.log('✅ Assets directory accessible');
    }
  });

});