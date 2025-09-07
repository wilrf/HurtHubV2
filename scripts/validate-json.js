import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('improvedDemoData.json', 'utf8'));
  console.log('✅ JSON is valid');
  console.log('📊 Structure check:');
  console.log('  - Businesses array length:', data.businesses?.length || 'NOT FOUND');
  
  if (data.businesses && data.businesses.length > 0) {
    const firstBiz = data.businesses[0];
    console.log('  - First business ID:', firstBiz.id);
    console.log('  - First business name:', firstBiz.name);
    console.log('  - Has address object:', !!firstBiz.address);
    console.log('  - Has naicsLevels object:', !!firstBiz.naicsLevels);
    console.log('  - Has hours object:', !!firstBiz.hours);
    console.log('  - Has operatingCosts object:', !!firstBiz.operatingCosts);
    console.log('  - Sample keys count:', Object.keys(firstBiz).length);
  }
} catch(e) {
  console.log('❌ JSON validation failed:', e.message);
  process.exit(1);
}