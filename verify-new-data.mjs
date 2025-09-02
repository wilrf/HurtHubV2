import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('🔍 Verifying imported data...\n');
  
  // Get total count
  const { count } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total companies: ${count}\n`);
  
  // Search for coffee/cafe businesses
  const { data: coffee, error: coffeeError } = await supabase
    .from('companies')
    .select('name, industry, description, headquarters')
    .or('name.ilike.%coffee%,name.ilike.%cafe%,description.ilike.%coffee%')
    .limit(10);
  
  console.log('Coffee/Cafe businesses:');
  if (coffee && coffee.length > 0) {
    coffee.forEach(c => {
      console.log(`- ${c.name} (${c.industry})`);
      console.log(`  ${c.headquarters}`);
      if (c.description) {
        console.log(`  "${c.description.substring(0, 150)}..."`);
      }
      console.log('');
    });
  } else {
    console.log('No coffee shops found\n');
  }
  
  // Search for Huntersville businesses
  const { data: huntersville } = await supabase
    .from('companies')
    .select('name, description, headquarters')
    .or('description.ilike.%huntersville%,headquarters.ilike.%huntersville%')
    .limit(5);
  
  console.log('Huntersville businesses:');
  if (huntersville && huntersville.length > 0) {
    huntersville.forEach(b => {
      console.log(`- ${b.name}: ${b.headquarters}`);
    });
  } else {
    console.log('No Huntersville businesses found\n');
  }
  
  // Check data richness - sample a business
  const { data: sample } = await supabase
    .from('companies')
    .select('*')
    .eq('name', 'Higher Grounds by Manolo\'s')
    .single();
  
  if (sample) {
    console.log('\nSample business detail (Higher Grounds by Manolo\'s):');
    console.log('- Industry:', sample.industry);
    console.log('- Founded:', sample.founded_year);
    console.log('- Employees:', sample.employees_count);
    console.log('- Revenue:', sample.revenue ? `$${sample.revenue.toLocaleString()}` : 'N/A');
    console.log('- Description preview:', sample.description?.substring(0, 200) + '...');
  }
  
  // Industry breakdown
  const { data: industries } = await supabase
    .from('companies')
    .select('industry');
  
  const industryCount = {};
  industries?.forEach(i => {
    industryCount[i.industry] = (industryCount[i.industry] || 0) + 1;
  });
  
  console.log('\nTop industries:');
  Object.entries(industryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([ind, count]) => {
      console.log(`- ${ind}: ${count} companies`);
    });
}

verifyData().catch(console.error);