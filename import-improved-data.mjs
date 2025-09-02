import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_SUPABASE_URL;
// Use service role key for admin operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
                    process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPA')));
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using key type:', supabaseKey.includes('service_role') ? 'service_role' : 'anon_key');

const supabase = createClient(supabaseUrl, supabaseKey);

async function importImprovedData() {
  console.log('🚀 Starting import of improved business data...\n');
  
  // Read the improved data file
  const jsonData = JSON.parse(readFileSync('improvedDemoData.json', 'utf8'));
  console.log(`📊 Found ${jsonData.businesses.length} businesses to import\n`);
  
  // First, clear existing companies table
  console.log('🗑️  Clearing existing companies...');
  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible ID)
  
  if (deleteError && deleteError.code !== 'PGRST116') {
    console.error('Error clearing companies:', deleteError);
    return;
  }
  
  console.log('✅ Existing data cleared\n');
  
  // Transform the data to match the companies table structure
  console.log('🔄 Transforming data to match database schema...');
  
  const companies = jsonData.businesses.map(business => {
    // Combine address fields into single strings
    const fullAddress = [
      business.address?.line1,
      business.address?.line2
    ].filter(Boolean).join(', ');
    
    // Format hours as strings
    const formatHours = (day) => {
      if (!business.hours?.[day]) return 'Closed';
      if (business.hours[day] === 'Closed') return 'Closed';
      return `${business.hours[day].open}-${business.hours[day].close}`;
    };
    
    // Create rich description with all the extra data
    const richDescription = [
      `${business.businessType || 'Local'} business in ${business.neighborhood || 'Charlotte'}`,
      business.yearEstablished ? `established ${business.yearEstablished}` : null,
      fullAddress ? `Located at ${fullAddress}` : null,
      business.owner ? `Owned by ${business.owner}` : null,
      business.phone ? `Phone: ${business.phone}` : null,
      business.rating ? `Rating: ${business.rating}/5 (${business.reviewCount || 0} reviews)` : null,
      business.squareFeet ? `${business.squareFeet} sq ft` : null,
      business.employees ? `${business.employees} employees` : null,
      `Hours: Mon ${formatHours('monday')}, Tue ${formatHours('tuesday')}, Wed ${formatHours('wednesday')}, Thu ${formatHours('thursday')}, Fri ${formatHours('friday')}, Sat ${formatHours('saturday')}, Sun ${formatHours('sunday')}`
    ].filter(Boolean).join('. ');
    
    return {
      // Generate UUID-style ID if needed, or use the existing ID
      id: crypto.randomUUID(),
      name: business.name,
      industry: business.industry,
      sector: business.cluster || business.businessType || business.industry,
      description: richDescription,
      founded_year: business.yearEstablished || null,
      employees_count: business.employees || null,
      revenue: Math.round(business.revenue) || null,
      website: business.website || null,
      headquarters: fullAddress || `${business.address?.city || 'Charlotte'}, ${business.address?.state || 'NC'}`,
      logo_url: null,
      status: 'active'
    };
  });
  
  console.log('✅ Data transformation complete\n');
  
  // Insert in batches to avoid timeout
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`📤 Inserting ${companies.length} companies in batches of ${batchSize}...`);
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    const batchEnd = Math.min(i + batchSize, companies.length);
    
    process.stdout.write(`\r  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(companies.length/batchSize)} (${i+1}-${batchEnd}/${companies.length})...`);
    
    const { data, error } = await supabase
      .from('companies')
      .insert(batch);
    
    if (error) {
      console.error(`\n  ❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
    }
  }
  
  console.log('\n');
  
  // Final summary
  console.log('📊 Import Summary:');
  console.log(`  ✅ Successfully imported: ${successCount} companies`);
  if (errorCount > 0) {
    console.log(`  ❌ Failed to import: ${errorCount} companies`);
  }
  
  // Verify the import
  const { count } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  console.log(`\n🔍 Verification: ${count} active companies now in database`);
  
  // Show sample of imported data
  const { data: sample } = await supabase
    .from('companies')
    .select('name, industry, neighborhood, revenue, employees_count')
    .limit(5);
  
  console.log('\n📋 Sample of imported companies:');
  sample?.forEach(company => {
    console.log(`  - ${company.name} (${company.industry})`);
    console.log(`    Location: ${company.neighborhood || 'N/A'}`);
    console.log(`    Revenue: $${(company.revenue || 0).toLocaleString()}`);
    console.log(`    Employees: ${company.employees_count || 'N/A'}`);
  });
  
  console.log('\n✨ Import complete!');
}

// Run the import
importImprovedData().catch(console.error);