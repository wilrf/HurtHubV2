#!/usr/bin/env node

/**
 * Test script for database-first AI with natural attribution
 * 
 * This tests that:
 * 1. Database companies are clearly marked
 * 2. External companies can be discussed with attribution
 * 3. User-mentioned businesses are acknowledged appropriately
 * 4. No hallucinations of random companies
 */

const API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'https://hurt-hub-v2.vercel.app';

console.log(`🧪 Testing AI Chat at: ${API_URL}`);
console.log('='.repeat(60));

const testCases = [
  {
    name: "Database-only query",
    query: "Show me the top 3 restaurants in Charlotte by revenue",
    expectations: {
      shouldContain: ["from our database", "in our database"],
      shouldNotContain: ["McDonald's", "Subway", "Burger King"],
      description: "Should only return database companies with clear attribution"
    }
  },
  {
    name: "User mentions external company",
    query: "How does Starbucks compare to local coffee shops in Charlotte?",
    expectations: {
      shouldContain: ["not in our database", "general knowledge", "from our database"],
      shouldNotContain: ["I cannot", "I don't have information", "unable to discuss"],
      description: "Should discuss Starbucks with attribution AND show local coffee shops"
    }
  },
  {
    name: "User mentions non-existent business",
    query: "Tell me about Bob's Seafood Restaurant and how it compares to other seafood places",
    expectations: {
      shouldContain: ["Bob's Seafood", "not in our database", "per your mention"],
      shouldNotContain: ["I cannot help", "I'm unable"],
      description: "Should acknowledge Bob's Seafood and provide database comparisons"
    }
  },
  {
    name: "Mixed query with analysis",
    query: "I'm thinking of opening a bakery. How many bakeries are there locally compared to chains like Panera?",
    expectations: {
      shouldContain: ["from our database", "general knowledge", "Panera"],
      shouldNotContain: ["cannot discuss", "only database"],
      description: "Should provide local data AND discuss chains with clear attribution"
    }
  },
  {
    name: "No hallucination test",
    query: "List technology companies in Charlotte",
    expectations: {
      shouldNotContain: ["Microsoft", "Google", "Apple", "Amazon", "Facebook"],
      shouldContain: ["from our database", "in our database"],
      description: "Should NOT hallucinate big tech companies unless in database"
    }
  }
];

async function runTest(testCase) {
  console.log(`\n📝 Test: ${testCase.name}`);
  console.log(`   Query: "${testCase.query}"`);
  console.log(`   Expected: ${testCase.expectations.description}`);
  
  try {
    const response = await fetch(`${API_URL}/api/ai-chat-simple`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: testCase.query }
        ],
        module: 'business-intelligence',
        sessionId: `test-${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content || '';
    const contentLower = content.toLowerCase();
    
    // Check expectations
    let passed = true;
    const results = [];
    
    // Check for required content
    if (testCase.expectations.shouldContain) {
      for (const term of testCase.expectations.shouldContain) {
        const found = contentLower.includes(term.toLowerCase());
        if (!found) {
          passed = false;
          results.push(`   ❌ Missing expected: "${term}"`);
        } else {
          results.push(`   ✅ Found: "${term}"`);
        }
      }
    }
    
    // Check for forbidden content
    if (testCase.expectations.shouldNotContain) {
      for (const term of testCase.expectations.shouldNotContain) {
        const found = contentLower.includes(term.toLowerCase());
        if (found) {
          passed = false;
          results.push(`   ❌ Contains forbidden: "${term}"`);
        } else {
          results.push(`   ✅ Correctly omitted: "${term}"`);
        }
      }
    }
    
    // Print results
    console.log(results.join('\n'));
    
    // Print snippet of response for context
    console.log(`\n   Response snippet: "${content.substring(0, 200)}..."`);
    
    // Overall result
    if (passed) {
      console.log(`   🎉 TEST PASSED`);
    } else {
      console.log(`   ⚠️ TEST FAILED - See issues above`);
    }
    
    // Check metadata
    if (data.metadata) {
      console.log(`   📊 Metadata: ${data.metadata.companiesProvided} companies provided`);
    }
    
    return passed;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Database-First AI Attribution Tests\n');
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testCase of testCases) {
    const passed = await runTest(testCase);
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Test Summary:');
  console.log(`   ✅ Passed: ${passedCount}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failedCount}/${testCases.length}`);
  
  if (failedCount === 0) {
    console.log('\n🎉 All tests passed! The AI properly attributes data sources.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the attribution logic.');
  }
}

// Run the tests
runAllTests().catch(console.error);