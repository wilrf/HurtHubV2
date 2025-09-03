import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', name: 'Home' },
  { path: '/directory', name: 'Directory' },
  { path: '/companies', name: 'Companies' },
  { path: '/networking', name: 'Networking' },
  { path: '/business-intelligence', name: 'Business Intelligence' },
  { path: '/events', name: 'Events' },
  { path: '/resources', name: 'Resources' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
];

test.describe('Page Rendering Investigation', () => {
  for (const route of routes) {
    test(`${route.name} page should render without errors`, async ({ page }) => {
      // Listen for console errors
      const consoleErrors: string[] = [];
      const networkErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(`${msg.location().url}:${msg.location().lineNumber} - ${msg.text()}`);
        }
      });

      page.on('response', response => {
        if (!response.ok() && response.status() >= 400) {
          networkErrors.push(`${response.status()} - ${response.url()}`);
        }
      });

      // Navigate to the page
      console.log(`Testing route: ${route.path}`);
      
      try {
        await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for page to load
        await page.waitForLoadState('domcontentloaded');
        
        // Check if page title is set (not just default)
        const title = await page.title();
        console.log(`Page title: ${title}`);
        
        // Check for basic page structure
        const bodyText = await page.textContent('body');
        const hasContent = bodyText && bodyText.trim().length > 0;
        
        // Take screenshot for visual inspection
        await page.screenshot({ 
          path: `tests/screenshots/${route.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        // Log findings
        console.log(`Route: ${route.path}`);
        console.log(`Has content: ${hasContent}`);
        console.log(`Console errors: ${consoleErrors.length}`);
        console.log(`Network errors: ${networkErrors.length}`);
        
        if (consoleErrors.length > 0) {
          console.log('Console Errors:', consoleErrors);
        }
        
        if (networkErrors.length > 0) {
          console.log('Network Errors:', networkErrors);
        }
        
        // Basic assertions
        expect(hasContent).toBe(true);
        
        // If this is not the business intelligence page, check if it's rendering properly
        if (route.path !== '/business-intelligence') {
          // Look for common error indicators
          const errorText = await page.textContent('body');
          expect(errorText).not.toContain('404');
          expect(errorText).not.toContain('Page not found');
          expect(errorText).not.toContain('Error');
        }
        
      } catch (error) {
        console.error(`Failed to load ${route.path}:`, error);
        
        // Try to get current page content for debugging
        try {
          const content = await page.content();
          console.log(`Page content length: ${content.length}`);
          
          // Take screenshot even on error
          await page.screenshot({ 
            path: `tests/screenshots/error-${route.name.toLowerCase().replace(/\s+/g, '-')}.png`,
            fullPage: true 
          });
        } catch (screenshotError) {
          console.log('Could not take screenshot:', screenshotError);
        }
        
        throw error;
      }
    });
  }
});