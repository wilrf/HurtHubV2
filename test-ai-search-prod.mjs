import fetch from 'node-fetch';

const PROD_URL = 'https://hurt-hub-v2.vercel.app';

const testQueries = [
  "restaurants near uptown",
  "coffee shops in huntersville", 
  "tech companies with more than 20 employees",
  "businesses in Myers Park",
  "show me accommodation and food services"
];

async function testProductionSearch() {
  console.log(`🚀 Testing PRODUCTION AI Search (${PROD_URL})\n`);
  console.log('========================================\n');
  
  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${PROD_URL}/api/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          limit: 5,
          useAI: true
        })
      });
      
      if (!response.ok) {
        console.log(`❌ Failed with status: ${response.status}`);
        const error = await response.text();
        console.log(`   Error: ${error}\n`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`✅ Success! Found ${data.count} results`);
      
      if (data.intent) {
        console.log(`\n🤖 AI Intent Analysis:`);
        console.log(`   Industries: ${data.intent.industries?.join(', ') || 'none'}`);
        console.log(`   Locations: ${data.intent.locations?.join(', ') || 'none'}`);
        console.log(`   Keywords: ${data.intent.keywords?.join(', ') || 'none'}`);
        console.log(`   Search Type: ${data.intent.searchType}`);
      }
      
      console.log(`\n📊 Results from database:`);
      data.results?.slice(0, 3).forEach((company, i) => {
        console.log(`   ${i + 1}. ${company.name} (${company.industry || 'N/A'})`);
        console.log(`      Revenue: $${(company.revenue || 0).toLocaleString()}`);
        console.log(`      Location: ${company.headquarters || 'N/A'}`);
        if (company.description) {
          const preview = company.description.substring(0, 80);
          console.log(`      Description: "${preview}..."`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n');
  }
  
  // Test the main chat endpoint too
  console.log('🤖 Testing main AI chat with search integration...\n');
  console.log('========================================\n');
  
  try {
    const chatResponse = await fetch(`${PROD_URL}/api/ai-chat-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What restaurants are in Uptown Charlotte?' }
        ],
        module: 'business-intelligence'
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat API working!');
      console.log('Response preview:', chatData.content.substring(0, 200) + '...\n');
    } else {
      console.log(`❌ Chat API failed: ${chatResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Chat API error: ${error.message}`);
  }
}

testProductionSearch().catch(console.error);