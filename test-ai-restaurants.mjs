import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRestaurants() {
  console.log('🔍 Checking if AI response came from database...\n');
  
  // List of restaurants from AI response
  const aiMentioned = [
    'The Capital Grille',
    'Fahrenheit',
    'Mamma Ricotta\'s',
    'Good Food on Montford',
    'Rí Rá Irish Pub',
    'Haberdish',
    'Sushi Guru'
  ];
  
  console.log('Restaurants mentioned by AI:');
  for (const name of aiMentioned) {
    const { data, error } = await supabase
      .from('companies')
      .select('name, industry, description')
      .ilike('name', `%${name}%`)
      .single();
    
    if (data) {
      console.log(`✅ "${name}" - FOUND in database`);
    } else {
      console.log(`❌ "${name}" - NOT in database`);
    }
  }
  
  console.log('\n--- Actual Uptown restaurants in database ---');
  const { data: uptownRestaurants } = await supabase
    .from('companies')
    .select('name, industry, description, headquarters')
    .or('description.ilike.%uptown%,headquarters.ilike.%uptown%')
    .eq('industry', 'Accommodation and Food Services')
    .limit(10);
  
  if (uptownRestaurants && uptownRestaurants.length > 0) {
    console.log(`Found ${uptownRestaurants.length} Uptown restaurants in database:\n`);
    uptownRestaurants.forEach(r => {
      console.log(`- ${r.name}`);
      const location = r.description?.match(/Located at ([^.]+)/)?.[1] || 'Address not found';
      console.log(`  Location: ${location}`);
    });
  } else {
    console.log('No Uptown restaurants found in database');
  }
  
  // Check what the AI system prompt would see
  console.log('\n--- What AI receives when asked about Uptown restaurants ---');
  const { data: companiesForAI } = await supabase
    .from('companies')
    .select('name, industry, revenue, employees_count')
    .eq('status', 'active')
    .or('name.ilike.%restaurant%,industry.eq.Accommodation and Food Services')
    .order('revenue', { ascending: false })
    .limit(50);
  
  const uptownCount = companiesForAI?.filter(c => 
    c.name.toLowerCase().includes('uptown') || 
    c.name.includes('525 S. TRYON') // Uptown address
  ).length || 0;
  
  console.log(`AI would receive ${companiesForAI?.length || 0} restaurant/food businesses`);
  console.log(`Of which ${uptownCount} explicitly mention Uptown`);
}

checkRestaurants().catch(console.error);