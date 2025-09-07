import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importBusinesses() {
  console.log('🚀 Starting business import...');

  // Load and parse JSON (works from any directory)
  const jsonPath = path.join(__dirname, '..', 'improvedDemoData_idsCorrected.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const businesses = data.businesses;

  console.log(`📊 Found ${businesses.length} businesses to import`);

  // Verify table is empty before import
  const { count: initialCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true });
  
  if (initialCount > 0) {
    console.error(`❌ Table not empty! Found ${initialCount} existing rows.`);
    console.error('Please clear the table before importing.');
    return;
  }

  console.log('✅ Table is empty, proceeding with import...');

  // Map all businesses (all 294 are unique LOCATIONS)
  const allBusinesses = businesses.map((biz, index) => ({
    id: (index + 1).toString(),  // Unique location ID: "1", "2", "3"..."294"
    parent_company_id: biz.parent_company_id || biz.id?.toString() || null,  // Use corrected parent ID if available
    source_id: biz.id?.toString() || null,  // Keep for backwards compatibility
    name: biz.name,
    naics: biz.naics,
    industry: biz.industry,
    employee_size_category: biz.employeeSizeCategory || null,
    
    // Address fields
    address_line1: biz.address?.line1 || null,
    address_line2: biz.address?.line2 || null,
    city: biz.address?.city || 'CHARLOTTE',
    state: biz.address?.state || 'NC',
    
    // NAICS hierarchy
    naics2: biz.naicsLevels?.naics2 || null,
    naics3: biz.naicsLevels?.naics3 || null,
    naics4: biz.naicsLevels?.naics4 || null,
    
    // Business details
    business_type: biz.businessType || null,
    cluster: biz.cluster || null,
    year_established: biz.yearEstablished || null,
    owner: biz.owner || null,
    phone: biz.phone || null,
    employees: biz.employees || null,
    revenue: biz.revenue || null,
    revenue_per_employee: biz.revenuePerEmployee || null,
    neighborhood: biz.neighborhood || null,
    
    // Operating details
    square_footage: biz.squareFeet || null,
    rent_per_month: biz.annualRent ? biz.annualRent / 12 : null,
    
    // Hours (flatten to individual columns)
    hours_monday: typeof biz.hours?.monday === 'string' ? biz.hours.monday : 
                  (biz.hours?.monday ? `${biz.hours.monday.open}-${biz.hours.monday.close}` : null),
    hours_tuesday: typeof biz.hours?.tuesday === 'string' ? biz.hours.tuesday : 
                   (biz.hours?.tuesday ? `${biz.hours.tuesday.open}-${biz.hours.tuesday.close}` : null),
    hours_wednesday: typeof biz.hours?.wednesday === 'string' ? biz.hours.wednesday : 
                     (biz.hours?.wednesday ? `${biz.hours.wednesday.open}-${biz.hours.wednesday.close}` : null),
    hours_thursday: typeof biz.hours?.thursday === 'string' ? biz.hours.thursday : 
                    (biz.hours?.thursday ? `${biz.hours.thursday.open}-${biz.hours.thursday.close}` : null),
    hours_friday: typeof biz.hours?.friday === 'string' ? biz.hours.friday : 
                  (biz.hours?.friday ? `${biz.hours.friday.open}-${biz.hours.friday.close}` : null),
    hours_saturday: typeof biz.hours?.saturday === 'string' ? biz.hours.saturday : 
                    (biz.hours?.saturday ? `${biz.hours.saturday.open}-${biz.hours.saturday.close}` : null),
    hours_sunday: typeof biz.hours?.sunday === 'string' ? biz.hours.sunday : 
                  (biz.hours?.sunday ? `${biz.hours.sunday.open}-${biz.hours.sunday.close}` : null),
    
    // Customer metrics
    customer_rating: biz.rating || null,
    review_count: biz.reviewCount || 0
  }));

  // Bulk import all businesses using UPSERT for safety
  const { data: result, error } = await supabase
    .from('businesses')
    .upsert(allBusinesses, { onConflict: 'id' });

  if (error) {
    console.error('❌ Full import failed:', error);
    return;
  }

  console.log('✅ Successfully imported all businesses!');
  
  // Verify count
  const { count: finalCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Final count: ${finalCount} business locations in database`);
  
  if (finalCount !== businesses.length) {
    console.warn(`⚠️ Warning: Expected ${businesses.length} locations but found ${finalCount}`);
  }
  
  // Check unique parent companies
  const { data: parentCompanies } = await supabase
    .from('businesses')
    .select('parent_company_id')
    .not('parent_company_id', 'is', null);
  
  const uniqueParents = new Set(parentCompanies?.map(p => p.parent_company_id) || []);
  console.log(`🏢 Unique parent companies/brands: ${uniqueParents.size}`)
  
  // Spot check 5 random businesses
  const { data: sampleData } = await supabase
    .from('businesses')
    .select('id, name, industry, naics, neighborhood')
    .limit(5);

  console.log('🔍 Sample imported businesses:');
  sampleData?.forEach(biz => {
    console.log(`  - ${biz.name} (${biz.industry}, ${biz.neighborhood})`);
  });

  console.log('🎉 Import completed successfully!');
}

importBusinesses().catch(console.error);