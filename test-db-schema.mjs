import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking database schema and sample data...\n');
  
  // Get a sample company to see the schema
  const { data: sample, error } = await supabase
    .from('companies')
    .select('*')
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample companies with all fields:');
    sample?.forEach(company => {
      console.log('\n' + company.name + ':');
      Object.keys(company).forEach(key => {
        const value = company[key];
        if (value !== null && value !== '') {
          console.log(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
      });
    });
  }
  
  // Search for coffee/restaurant businesses
  console.log('\n--- Searching for food/restaurant businesses ---');
  const { data: food, error: foodError } = await supabase
    .from('companies')
    .select('name, industry, description')
    .or('industry.ilike.%food%,industry.ilike.%restaurant%,industry.ilike.%accommodation%,name.ilike.%coffee%,name.ilike.%cafe%')
    .eq('status', 'active')
    .limit(10);
  
  if (!foodError && food) {
    console.log(`Found ${food?.length || 0} food-related businesses:`);
    food?.forEach(biz => {
      console.log(`- ${biz.name} (${biz.industry})`);
      if (biz.description) console.log(`  "${biz.description.substring(0, 100)}..."`);
    });
  }
}

checkSchema().catch(console.error);