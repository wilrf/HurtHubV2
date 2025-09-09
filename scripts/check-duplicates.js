import fs from 'fs';

const data = JSON.parse(fs.readFileSync('improvedDemoData.json', 'utf8'));
const ids = data.businesses.map(b => b.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

console.log('Total businesses:', ids.length);
console.log('Unique IDs:', new Set(ids).size);
console.log('Duplicate IDs:', duplicates);

if (duplicates.length > 0) {
  console.log('\nDuplicate details:');
  duplicates.forEach(id => {
    const businesses = data.businesses.filter(b => b.id === id);
    console.log(`ID ${id} appears ${businesses.length} times:`);
    businesses.forEach(b => console.log(`  - ${b.name}`));
  });
}