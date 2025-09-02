import fetch from 'node-fetch';

const testQueries = [
  "restaurants near uptown",
  "coffee shops in huntersville",
  "tech companies with more than 20 employees",
  "businesses in Myers Park",
  "show me accommodation and food services"
];

async function testLocalSearch() {
  console.log('🧪 Testing LOCAL AI Search (http://localhost:5173)\n');
  console.log('========================================\n');
  
  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch('http://localhost:5173/api/ai-search', {
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
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n');
  }
}

console.log('Make sure your local dev server is running:');
console.log('npm run dev\n');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to start...\n');

setTimeout(() => {
  testLocalSearch().catch(console.error);
}, 3000);