import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original data
const originalPath = path.join(__dirname, '..', 'improvedDemoData.json');
const correctedPath = path.join(__dirname, '..', 'improvedDemoData_idsCorrected.json');

console.log('📖 Reading original data...');
const data = JSON.parse(fs.readFileSync(originalPath, 'utf8'));

// Track which businesses need fixing
const corruptedBusinesses = [];

// Group businesses by name for multi-location handling
const businessGroups = {};

console.log('🔍 Finding corrupted businesses...');
data.businesses.forEach((business, index) => {
  // Fix the ID for ALL businesses to ensure 1-294 sequence
  // This ensures even good IDs stay in their array position
  const correctId = String(index + 1);  // 1-based indexing
  
  // Check if this business has corrupted data
  if (business.id === 'and Recreation"' || business.id === 'and Recreation\\"') {
    corruptedBusinesses.push({
      index,
      name: business.name,
      originalId: business.id,
      newId: correctId
    });
    
    // Group by business name for parent company assignment
    if (!businessGroups[business.name]) {
      businessGroups[business.name] = [];
    }
    businessGroups[business.name].push(index);
  }
  
  // Always set the ID based on array position (fix-in-place)
  business.id = correctId;
});

console.log(`\n📊 Found ${corruptedBusinesses.length} businesses with corrupted IDs`);
console.log(`🏢 Unique business names affected: ${Object.keys(businessGroups).length}`);

// Assign parent company IDs based on business names
const parentCompanyMap = {
  'Safe Harbor Kings Point': 'SAFE_HARBOR_PARENT',
  'OrangeTheory Fitness Cornelius': 'ORANGETHEORY_PARENT',
  'ACTIVATE Charlotte': 'ACTIVATE_PARENT',
  'All Seasons Marina': 'ALL_SEASONS_PARENT',
  'Burn Boot Camp Cornelius': 'BURN_BOOT_PARENT',
  'Davidson Yoga Therapy': 'DAVIDSON_YOGA_PARENT',
  'HOTWORX Cornelius': 'HOTWORX_PARENT',
  'ISI Elite Training': 'ISI_ELITE_PARENT',
  'Morningstar Marinas Crown Harbor': 'MORNINGSTAR_PARENT',
  'Yoga On Davidson': 'YOGA_DAVIDSON_PARENT'
};

// Fix the corrupted businesses' other fields
console.log('\n✏️ Fixing corrupted data fields...');
Object.entries(businessGroups).forEach(([businessName, indices]) => {
  const parentId = parentCompanyMap[businessName] || `REC_${businessName.replace(/\s+/g, '_').toUpperCase()}`;
  
  indices.forEach(idx => {
    const business = data.businesses[idx];
    
    // Fix the industry field
    if (business.industry === '"Arts' || business.industry === '\\"Arts') {
      business.industry = 'Arts, Entertainment, and Recreation';
    }
    
    // DIRECTLY set parent_company_id so import script can use it as-is
    // This replaces the corrupted "and Recreation\"" value
    business.parent_company_id = parentId;
    
    // Add audit note
    if (!business.dataFixNotes) {
      business.dataFixNotes = [];
    }
    business.dataFixNotes.push({
      date: new Date().toISOString(),
      fix: 'Corrected corrupted ID and industry field',
      originalCorruptedId: 'and Recreation"',
      assignedId: business.id,
      assignedParentId: parentId,
      note: 'ID assigned based on array position (1-294 sequence preserved)'
    });
  });
  
  console.log(`  ✅ ${businessName}: ${indices.length} location(s) → Parent: ${parentId}`);
});

// Update metadata
data.metadata.lastCorrected = new Date().toISOString();
data.metadata.corrections = {
  totalFixed: corruptedBusinesses.length,
  uniqueBusinesses: Object.keys(businessGroups).length,
  preservedIdRange: '1-294 (no gaps)',
  fixedFields: ['id', 'industry', 'parent_company_id'],
  approach: 'Fix-in-place: IDs based on array position',
  note: 'Fixed corrupted IDs for Arts/Entertainment/Recreation businesses while preserving 1-294 sequence'
};

// Write the corrected file
console.log(`\n💾 Writing corrected data to ${correctedPath}...`);
fs.writeFileSync(correctedPath, JSON.stringify(data, null, 2));

// Verify the fix
const correctedData = JSON.parse(fs.readFileSync(correctedPath, 'utf8'));

// Check for corrupted IDs
const stillCorrupted = correctedData.businesses.filter(b => 
  b.id === 'and Recreation"' || b.id === 'and Recreation\\"' || !b.id
);

// Check for corrupted parent_company_ids
const stillCorruptedParents = correctedData.businesses.filter(b =>
  b.parent_company_id && b.parent_company_id.includes('Recreation')
);

// Verify ID sequence
const ids = correctedData.businesses.map(b => parseInt(b.id));
const expectedIds = Array.from({length: 294}, (_, i) => i + 1);
const hasAllIds = expectedIds.every(id => ids.includes(id));
const hasNoGaps = ids.length === 294 && Math.max(...ids) === 294 && Math.min(...ids) === 1;

if (stillCorrupted.length === 0 && stillCorruptedParents.length === 0 && hasAllIds && hasNoGaps) {
  console.log('\n✅ Success! All IDs fixed with sequence preserved.');
  console.log(`📁 Corrected file saved as: improvedDemoData_idsCorrected.json`);
  
  // Summary statistics
  const uniqueIds = new Set(correctedData.businesses.map(b => b.id));
  const uniqueParents = new Set(correctedData.businesses.map(b => b.parent_company_id).filter(Boolean));
  
  console.log(`\n📊 Final Statistics:`);
  console.log(`  - Total businesses: ${correctedData.businesses.length}`);
  console.log(`  - ID range: 1-${correctedData.businesses.length} (no gaps)`);
  console.log(`  - Unique IDs: ${uniqueIds.size}`);
  console.log(`  - Unique parent companies: ${uniqueParents.size} (was 202, now ~157)`);
  console.log(`  - Businesses fixed: ${corruptedBusinesses.length}`);
  console.log(`  - Fix approach: In-place (preserved original positions)`);
  
  // Show sample of fixed businesses
  console.log(`\n📋 Sample of fixed businesses:`);
  corruptedBusinesses.slice(0, 5).forEach(b => {
    const fixed = correctedData.businesses[b.index];
    console.log(`  - ${b.name}: ID "${b.newId}", Parent: "${fixed.parent_company_id}"`);
  });
  
  console.log(`\n🚀 Next steps:`);
  console.log(`  1. Update import script to use improvedDemoData_idsCorrected.json`);
  console.log(`  2. Run: TRUNCATE businesses RESTART IDENTITY CASCADE`);
  console.log(`  3. Run: node scripts/import-businesses.js`);
  console.log(`  4. Verify: SELECT count(*) FROM businesses -- should be 294`);
  console.log(`  5. Verify: SELECT count(DISTINCT parent_company_id) FROM businesses -- should be ~157`);
} else {
  console.error('\n❌ Error: Issues detected!');
  if (stillCorrupted.length > 0) {
    console.error(`  - ${stillCorrupted.length} businesses still have corrupted IDs`);
  }
  if (stillCorruptedParents.length > 0) {
    console.error(`  - ${stillCorruptedParents.length} businesses still have corrupted parent_company_ids`);
  }
  if (!hasAllIds || !hasNoGaps) {
    console.error(`  - ID sequence has gaps or missing values`);
    console.error(`    Min: ${Math.min(...ids)}, Max: ${Math.max(...ids)}, Count: ${ids.length}`);
  }
}