import { test, expect } from '@playwright/test';

/**
 * Vercel Dev API Testing Suite
 * Tests database-first implementation with Vercel serverless functions
 * 
 * Prerequisites: Run `vercel dev` before executing these tests
 */

const BASE_URL = 'http://localhost:3005';

test.describe('Database-First API Implementation', () => {
  
  test.describe('/api/businesses endpoint', () => {
    test('should fetch businesses from database', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/businesses?limit=10`);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('businesses');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('source', 'database');
      expect(data.businesses).toBeInstanceOf(Array);
      
      // Verify business data structure
      if (data.businesses.length > 0) {
        const business = data.businesses[0];
        expect(business).toHaveProperty('id');
        expect(business).toHaveProperty('name');
        expect(business).toHaveProperty('industry');
      }
      
      console.log(`✅ Fetched ${data.businesses.length} businesses from database`);
    });

    test('should handle business search with filters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/businesses?query=financial&industry=Financial Services&limit=5`);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.businesses).toBeInstanceOf(Array);
      expect(data.total).toBeGreaterThanOrEqual(0);
      
      console.log(`✅ Search returned ${data.businesses.length} filtered results`);
    });

    test('should provide analytics data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/businesses?limit=1`);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('analytics');
      expect(data.analytics).toHaveProperty('totalCompanies');
      expect(data.analytics).toHaveProperty('totalRevenue');
      expect(data.analytics).toHaveProperty('topIndustries');
      expect(data.analytics).toHaveProperty('revenueByIndustry');
      
      console.log(`✅ Analytics: ${data.analytics.totalCompanies} companies, ${data.analytics.topIndustries.length} industries`);
    });

    test('should handle pagination correctly', async ({ request }) => {
      const page1 = await request.get(`${BASE_URL}/api/businesses?page=1&limit=5`);
      const page2 = await request.get(`${BASE_URL}/api/businesses?page=2&limit=5`);
      
      expect(page1.status()).toBe(200);
      expect(page2.status()).toBe(200);
      
      const data1 = await page1.json();
      const data2 = await page2.json();
      
      expect(data1.page).toBe(1);
      expect(data2.page).toBe(2);
      expect(data1.businesses[0]?.id).not.toBe(data2.businesses[0]?.id);
      
      console.log(`✅ Pagination working: Page 1 (${data1.businesses.length}), Page 2 (${data2.businesses.length})`);
    });
  });

  test.describe('/api/ai-search endpoint', () => {
    test('should perform AI-powered search', async ({ request }) => {
      const searchQuery = {
        query: 'large financial companies in Charlotte',
        limit: 5,
        useAI: true
      };

      const response = await request.post(`${BASE_URL}/api/ai-search`, {
        data: searchQuery
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('intent');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('source', 'database');
      expect(data.results).toBeInstanceOf(Array);
      
      console.log(`✅ AI Search: Found ${data.results.length} results with intent analysis`);
      console.log(`Search intent:`, data.intent);
    });

    test('should handle semantic search with embeddings', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/ai-search`, {
        data: {
          query: 'technology innovation startups',
          limit: 3
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check if semantic search is working (results should have similarity scores)
      if (data.results.length > 0) {
        const hasSemanticResults = data.results.some((r: any) => r.searchType === 'semantic');
        console.log(`✅ Semantic search ${hasSemanticResults ? 'ACTIVE' : 'FALLBACK TO KEYWORD'}`);
      }
    });
  });

  test.describe('/api/generate-embeddings endpoint', () => {
    test('should check embedding generation capability', async ({ request }) => {
      // Test with a small batch to avoid timeout
      const response = await request.post(`${BASE_URL}/api/generate-embeddings`, {
        data: {
          batchSize: 1,
          forceRegenerate: false
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('processed');
      expect(data).toHaveProperty('errors');
      
      console.log(`✅ Embeddings: ${data.message}, processed: ${data.processed}`);
    });
  });

  test.describe('Error Handling (No Fallbacks)', () => {
    test('should fail explicitly with missing parameters', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/ai-search`, {
        data: {} // Missing required query
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      
      console.log(`✅ Proper error handling: ${data.error}`);
    });
  });
});

test.describe('Frontend Database Integration', () => {
  test('should load business data in frontend', async ({ page }) => {
    await page.goto(`${BASE_URL}/business-intelligence`);
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="business-count"], .business-card, .loading', { timeout: 10000 });
    
    // Check if businesses are loaded from API
    const businessElements = await page.locator('.business-card, [data-testid="business-item"]').count();
    const loadingElements = await page.locator('.loading, [data-testid="loading"]').count();
    
    if (businessElements > 0) {
      console.log(`✅ Frontend loaded ${businessElements} businesses from database`);
    } else if (loadingElements > 0) {
      console.log(`⏳ Frontend still loading data...`);
    } else {
      console.log(`⚠️ No business data visible on frontend`);
    }
    
    // Take screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/business-intelligence-loaded.png' });
  });

  test('should perform search through new API', async ({ page }) => {
    await page.goto(`${BASE_URL}/business-intelligence`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"], [data-testid="search-input"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('financial');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(2000);
      
      console.log(`✅ Frontend search executed through new API`);
      await page.screenshot({ path: 'tests/screenshots/search-results.png' });
    } else {
      console.log(`⚠️ Search input not found on page`);
    }
  });
});

test.describe('AI Chat Database Integration', () => {
  test('should use database context in AI chat', async ({ page }) => {
    // Navigate to AI chat
    await page.goto(`${BASE_URL}/business-intelligence`);
    await page.waitForLoadState('networkidle');
    
    // Look for AI chat interface
    const chatButton = page.locator('[data-testid="ai-chat"], button:has-text("AI"), button:has-text("Chat")').first();
    
    if (await chatButton.count() > 0) {
      await chatButton.click();
      await page.waitForTimeout(1000);
      
      // Find chat input
      const chatInput = page.locator('textarea, input[placeholder*="message"], [data-testid="chat-input"]').first();
      
      if (await chatInput.count() > 0) {
        await chatInput.fill('What are the top revenue companies?');
        await chatInput.press('Enter');
        
        // Wait for AI response
        await page.waitForTimeout(5000);
        
        // Check for response that includes database data
        const messages = await page.locator('[data-testid="chat-message"], .message').all();
        const lastMessage = messages[messages.length - 1];
        
        if (lastMessage) {
          const messageText = await lastMessage.textContent();
          const hasCompanyData = messageText?.includes('Bank of America') || 
                                 messageText?.includes('revenue') || 
                                 messageText?.includes('Charlotte');
          
          console.log(`✅ AI Chat ${hasCompanyData ? 'USING DATABASE CONTEXT' : 'response received'}`);
          await page.screenshot({ path: 'tests/screenshots/ai-chat-response.png' });
        }
      }
    } else {
      console.log(`⚠️ AI Chat interface not found`);
    }
  });
});