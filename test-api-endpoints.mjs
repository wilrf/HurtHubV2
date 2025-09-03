#!/usr/bin/env node
/**
 * API Endpoint Testing Script
 * Tests the database-first implementation with Vercel dev
 */

const BASE_URL = 'http://localhost:3005';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const status = response.status;
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: Status ${status}`);
      console.log(`   Data preview:`, JSON.stringify(data).substring(0, 200) + '...');
      return { success: true, data, status };
    } else {
      console.log(`❌ ${name}: Status ${status}`);
      console.log(`   Error:`, data.error || data.message || 'Unknown error');
      return { success: false, data, status };
    }
    
  } catch (error) {
    console.log(`💥 ${name}: Network Error`);
    console.log(`   Details:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Database-First API Testing Suite');
  console.log(`📡 Testing against: ${BASE_URL}`);
  
  const results = {};

  // Test 1: Basic businesses endpoint
  results.businesses = await testEndpoint(
    'GET /api/businesses',
    `${BASE_URL}/api/businesses?limit=3`
  );

  // Test 2: Business search with filters
  results.businessSearch = await testEndpoint(
    'GET /api/businesses with search',
    `${BASE_URL}/api/businesses?query=financial&limit=2`
  );

  // Test 3: AI Search endpoint
  results.aiSearch = await testEndpoint(
    'POST /api/ai-search',
    `${BASE_URL}/api/ai-search`,
    {
      method: 'POST',
      body: {
        query: 'technology companies in Charlotte',
        limit: 2,
        useAI: true
      }
    }
  );

  // Test 4: Generate embeddings (small batch)
  results.embeddings = await testEndpoint(
    'POST /api/generate-embeddings',
    `${BASE_URL}/api/generate-embeddings`,
    {
      method: 'POST',
      body: {
        batchSize: 1,
        forceRegenerate: false
      }
    }
  );

  // Test 5: AI Chat endpoint
  results.aiChat = await testEndpoint(
    'POST /api/ai-chat-simple',
    `${BASE_URL}/api/ai-chat-simple`,
    {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'What are the top companies by revenue?' }],
        module: 'business-intelligence',
        model: 'gpt-4o-mini'
      }
    }
  );

  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  let passed = 0;
  let total = 0;

  Object.entries(results).forEach(([test, result]) => {
    total++;
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const info = result.status ? `(${result.status})` : result.error ? '(Network Error)' : '';
    console.log(`${status} ${test.padEnd(20)} ${info}`);
    if (result.success) passed++;
  });

  console.log('='.repeat(60));
  console.log(`📈 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - Database-first implementation is working!');
  } else {
    console.log(`⚠️  ${total - passed} tests failed - Check Vercel dev server and environment`);
  }

  // Additional Analysis
  console.log('\n🔍 ANALYSIS:');
  
  if (results.businesses?.success) {
    const bizData = results.businesses.data;
    console.log(`✅ Database Connection: ${bizData.businesses?.length || 0} businesses loaded`);
    console.log(`✅ Source: ${bizData.source} (should be 'database')`);
    console.log(`✅ Analytics: ${bizData.analytics ? 'Present' : 'Missing'}`);
  }

  if (results.aiSearch?.success) {
    const aiData = results.aiSearch.data;
    console.log(`✅ AI Search: ${aiData.results?.length || 0} results with intent analysis`);
    console.log(`✅ Semantic: ${aiData.results?.some(r => r.searchType === 'semantic') ? 'Active' : 'Keyword only'}`);
  }

  if (results.embeddings?.success) {
    const embData = results.embeddings.data;
    console.log(`✅ Embeddings: ${embData.message || 'Service ready'}`);
  }

  if (results.aiChat?.success) {
    const chatData = results.aiChat.data;
    console.log(`✅ AI Chat: Response length ${chatData.content?.length || 0} characters`);
  }

  return results;
}

// Run tests
runTests().catch(console.error);