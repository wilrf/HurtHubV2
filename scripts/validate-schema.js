import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the improved demo data
const dataPath = path.join(__dirname, '..', 'improvedDemoData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Schema Validation Report');
console.log('=======================');
console.log(`Source: improvedDemoData.json`);
console.log(`Businesses in file: ${data.businesses?.length || 0}`);
console.log(`File claims: ${data.totalBusinesses || 'unknown'} businesses`);

if (!data.businesses || data.businesses.length === 0) {
  console.error('❌ No businesses found in improvedDemoData.json');
  process.exit(1);
}

// Analyze the first business to understand structure
const firstBusiness = data.businesses[0];
console.log('\n📋 First Business Structure:');
console.log('Keys found:', Object.keys(firstBusiness).sort());

// Expected businesses table columns (from MCP output)
const businessesTableColumns = [
  'id', 'name', 'naics', 'industry', 'employee_size_category',
  'address_line1', 'address_line2', 'city', 'state',
  'naics2', 'naics3', 'naics4', 'business_type', 'cluster',
  'year_established', 'owner', 'phone', 'employees', 'revenue',
  'revenue_per_employee', 'neighborhood', 'square_footage',
  'rent_per_month', 'utilities_per_month', 'payroll_per_month',
  'operating_margin', 'hours_monday', 'hours_tuesday', 'hours_wednesday',
  'hours_thursday', 'hours_friday', 'hours_saturday', 'hours_sunday',
  'avg_customer_spend', 'monthly_customers', 'customer_rating',
  'review_count', 'peak_season', 'q1_revenue_pct', 'q2_revenue_pct',
  'q3_revenue_pct', 'q4_revenue_pct'
];

console.log('\n🔍 Field Mapping Analysis:');

// Check each expected column
const jsonKeys = Object.keys(firstBusiness);
const mappingResults = [];

businessesTableColumns.forEach(col => {
  // Try to find direct match or close match
  let match = null;
  let matchType = 'missing';
  
  if (jsonKeys.includes(col)) {
    match = col;
    matchType = 'direct';
  } else {
    // Look for similar keys
    const similar = jsonKeys.find(key => {
      const keyLower = key.toLowerCase();
      const colLower = col.toLowerCase();
      
      // Handle common variations
      if (colLower === 'address_line1' && keyLower.includes('address')) return true;
      if (colLower === 'employees' && keyLower === 'employeecount') return true;
      if (colLower === 'year_established' && keyLower === 'yearfounded') return true;
      if (colLower.includes('hours_') && key === 'hours') return true;
      
      return keyLower.includes(colLower) || colLower.includes(keyLower);
    });
    
    if (similar) {
      match = similar;
      matchType = 'similar';
    }
  }
  
  mappingResults.push({ col, match, matchType });
});

// Display results
mappingResults.forEach(result => {
  const icon = result.matchType === 'direct' ? '✅' : 
                result.matchType === 'similar' ? '⚠️' : '❌';
  const msg = result.match ? `→ ${result.match}` : '(not found)';
  console.log(`${icon} ${result.col} ${msg}`);
});

// Check for JSON keys that don't map to table columns
console.log('\n🔍 JSON Keys Not Mapped to Table:');
const unmappedKeys = jsonKeys.filter(key => {
  return !businessesTableColumns.some(col => 
    col.toLowerCase() === key.toLowerCase() || 
    key.toLowerCase().includes(col.toLowerCase()) ||
    col.toLowerCase().includes(key.toLowerCase())
  );
});

unmappedKeys.forEach(key => {
  const sampleValue = firstBusiness[key];
  const valuePreview = typeof sampleValue === 'object' ? 
    `{${Object.keys(sampleValue).slice(0, 3).join(', ')}}` : 
    String(sampleValue).substring(0, 50);
  console.log(`📦 ${key}: ${valuePreview}`);
});

// Summary
const directMatches = mappingResults.filter(r => r.matchType === 'direct').length;
const similarMatches = mappingResults.filter(r => r.matchType === 'similar').length;
const missingFields = mappingResults.filter(r => r.matchType === 'missing').length;

console.log('\n📊 Summary:');
console.log(`✅ Direct matches: ${directMatches}/${businessesTableColumns.length}`);
console.log(`⚠️ Similar matches: ${similarMatches}/${businessesTableColumns.length}`);
console.log(`❌ Missing fields: ${missingFields}/${businessesTableColumns.length}`);
console.log(`📦 Unmapped JSON keys: ${unmappedKeys.length}`);

const compatibilityScore = ((directMatches + similarMatches) / businessesTableColumns.length) * 100;
console.log(`\n🎯 Compatibility Score: ${compatibilityScore.toFixed(1)}%`);

if (compatibilityScore > 70) {
  console.log('✅ Schema is compatible enough for import');
} else {
  console.log('❌ Schema compatibility issues detected');
}