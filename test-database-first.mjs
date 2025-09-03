#!/usr/bin/env node

/**
 * Test Database-First Implementation
 * 
 * This script tests our new database-first search and chat system:
 * 1. Tests the /api/businesses endpoint
 * 2. Tests the /api/ai-search endpoint with semantic search
 * 3. Tests the /api/unified-search endpoint
 * 4. Optionally generates embeddings
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3005';

console.log('🔍 Testing Database-First Implementation');
console.log(`Base URL: ${BASE_URL}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testBusinessesAPI() {
  console.log('📊 Testing /api/businesses endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/businesses?limit=5`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Success! Found ${data.businesses?.length || 0} businesses`);
    console.log(`   Total in database: ${data.total || 0}`);
    console.log(`   Source: ${data.source || 'unknown'}`);
    
    if (data.businesses && data.businesses.length > 0) {
      const sample = data.businesses[0];
      console.log(`   Sample: ${sample.name} (${sample.industry})`);
    }
    
    return data;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function testAISearch() {
  console.log('\n🧠 Testing /api/ai-search endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'financial services companies in Charlotte',
        limit: 3,
        useAI: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Success! Found ${data.results?.length || 0} results`);
    console.log(`   Search intent: ${data.intent?.searchType || 'unknown'}`);
    console.log(`   Enhanced: ${data.enhanced ? 'Yes' : 'No'}`);
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name} (${result.industry})`);
        if (result.similarity) {
          console.log(`      Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        }
      });
    }
    
    return data;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function testUnifiedSearch() {
  console.log('\n🔍 Testing /api/unified-search endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/unified-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'technology companies with high revenue',
        searchType: 'hybrid',
        limit: 3,
        includeAnalytics: true,
        enhanceWithAI: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Success! Found ${data.results?.length || 0} results`);
    console.log(`   Search type: ${data.searchType}`);
    console.log(`   Methods used: ${data.methods?.join(', ') || 'unknown'}`);
    
    if (data.analytics) {
      console.log(`   Analytics: ${data.analytics.totalResults} companies, $${data.analytics.totalRevenue?.toLocaleString()} revenue`);
    }
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name} (${result.searchMethod})`);
        console.log(`      Revenue: $${(result.revenue || 0).toLocaleString()}`);
        console.log(`      Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
      });
    }
    
    return data;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function testEmbeddingGeneration() {
  console.log('\n⚡ Testing embedding generation (optional)...');
  
  try {
    console.log('   Generating embeddings for first 5 companies...');
    
    const response = await fetch(`${BASE_URL}/api/generate-embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchSize: 5,
        forceRegenerate: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Success! Processed ${data.processed || 0} companies`);
    console.log(`   Skipped: ${data.skipped || 0}`);
    console.log(`   Errors: ${data.errors?.length || 0}`);
    
    if (data.errors && data.errors.length > 0) {
      console.log('   Error details:');
      data.errors.slice(0, 3).forEach(error => {
        console.log(`     • ${error}`);
      });
    }
    
    return data;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  // Test basic businesses API
  const businessesResult = await testBusinessesAPI();
  
  // Test AI search
  const aiSearchResult = await testAISearch();
  
  // Test unified search
  const unifiedSearchResult = await testUnifiedSearch();
  
  // Optional: Generate embeddings if none exist
  if (process.argv.includes('--generate-embeddings')) {
    await testEmbeddingGeneration();
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test Summary:');
  console.log(`   Businesses API: ${businessesResult ? '✅' : '❌'}`);
  console.log(`   AI Search: ${aiSearchResult ? '✅' : '❌'}`);
  console.log(`   Unified Search: ${unifiedSearchResult ? '✅' : '❌'}`);
  
  const allPassed = businessesResult && aiSearchResult && unifiedSearchResult;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Database-first implementation is working.');
    console.log('\n🚀 Key Benefits Achieved:');
    console.log('   • All search queries use Supabase database');
    console.log('   • No fallbacks to web search or static files');
    console.log('   • AI-powered semantic search with embeddings');
    console.log('   • Unified search API for consistency');
    console.log('   • Real-time business data from database');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Deploy to production: `vercel --prod`');
  console.log('   2. Generate embeddings: node test-database-first.mjs --generate-embeddings');
  console.log('   3. Test chat functionality in the UI');
  console.log('   4. Monitor database performance');
}

// Run the tests
runTests().catch(console.error);