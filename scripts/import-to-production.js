#!/usr/bin/env node

/**
 * Import Demo Data to Production Supabase
 * Imports the 294 businesses from improvedDemoData.json into production Supabase
 * 
 * Usage: node scripts/import-to-production.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PRODUCTION Supabase credentials - using the exact Vercel env var names
const supabaseUrl = 'https://osnbklmavnsxpgktdeun.supabase.co';
const supabaseKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// First, let's check if we can get the key from Vercel
console.log('🔍 Checking for Supabase service role key...');

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📝 To get your service role key:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Settings > API');
  console.error('4. Copy the "service_role" key (starts with eyJ...)');
  console.error('5. Run this command with the key:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY="your-key-here" node scripts/import-to-production.js');
  process.exit(1);
}

console.log('✅ Found service role key');
console.log(`🔌 Connecting to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the demo data
const demoDataPath = path.join(__dirname, '..', 'dist', 'improvedDemoData.json');
const demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));

console.log(`📊 Found ${demoData.totalBusinesses} businesses in demo data`);

// Transform business data to match companies table structure
function transformBusiness(business) {
  return {
    name: business.name,
    industry: business.industry || 'Other',
    sector: business.cluster || business.businessType || 'Other',
    description: `${business.businessType} business in ${business.neighborhood}, established ${business.yearEstablished}`,
    founded_year: business.yearEstablished,
    employees_count: business.employees,
    revenue: Math.round(business.revenue),
    website: business.website || null,
    headquarters: `${business.address.line1}, ${business.address.city}, ${business.address.state}`,
    logo_url: null,
    status: 'active'
  };
}

async function clearExistingData() {
  console.log('🗑️  Clearing existing test data (keeping only top 5 companies)...');
  
  // Get the top 5 companies by revenue
  const { data: topCompanies } = await supabase
    .from('companies')
    .select('id')
    .order('revenue', { ascending: false })
    .limit(5);
  
  if (topCompanies && topCompanies.length > 0) {
    const topCompanyIds = topCompanies.map(c => c.id);
    
    // Delete all companies except the top 5
    const { error } = await supabase
      .from('companies')
      .delete()
      .not('id', 'in', `(${topCompanyIds.join(',')})`);
    
    if (error) {
      console.error('Error clearing data:', error);
    } else {
      console.log('✅ Cleared old test data, kept top 5 companies');
    }
  }
}

async function importData() {
  try {
    console.log('🚀 Starting production import...');
    
    // First, check current state
    const { count: initialCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📝 Currently ${initialCount || 0} companies in production database`);
    
    // Optional: Clear existing test data (comment out if you want to keep existing)
    // await clearExistingData();
    
    // Transform all businesses
    const companies = demoData.businesses.map(transformBusiness);
    
    // Insert in batches of 50 to avoid timeout
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(companies.length / batchSize);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches}...`);
      
      // Check if companies already exist by name
      const companyNames = batch.map(c => c.name);
      const { data: existing } = await supabase
        .from('companies')
        .select('name')
        .in('name', companyNames);
      
      const existingNames = new Set(existing?.map(e => e.name) || []);
      const newCompanies = batch.filter(c => !existingNames.has(c.name));
      
      if (newCompanies.length === 0) {
        console.log(`⏭️  Batch ${batchNumber} skipped: all companies already exist`);
        skippedCount += batch.length;
        continue;
      }
      
      const { data, error } = await supabase
        .from('companies')
        .insert(newCompanies)
        .select();
      
      if (error) {
        console.error(`❌ Error in batch ${batchNumber}:`, error.message);
        errorCount += newCompanies.length;
      } else {
        successCount += data.length;
        skippedCount += batch.length - newCompanies.length;
        console.log(`✅ Batch ${batchNumber}: imported ${data.length}, skipped ${batch.length - newCompanies.length}`);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} companies`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} companies`);
    if (errorCount > 0) {
      console.log(`❌ Failed to import: ${errorCount} companies`);
    }
    
    // Verify final count
    const { count } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n🎉 Total companies now in production database: ${count}`);
    
    // Test that we can query the data
    const { data: sampleCompanies } = await supabase
      .from('companies')
      .select('name, industry, revenue')
      .order('revenue', { ascending: false })
      .limit(10);
    
    if (sampleCompanies && sampleCompanies.length > 0) {
      console.log('\n📈 Top 10 companies by revenue:');
      sampleCompanies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (${company.industry}): $${company.revenue?.toLocaleString()}`);
      });
    }
    
    // Test a specific query
    const { data: restaurants } = await supabase
      .from('companies')
      .select('name, industry')
      .ilike('industry', '%food%')
      .limit(5);
    
    if (restaurants && restaurants.length > 0) {
      console.log('\n🍔 Sample food service businesses:');
      restaurants.forEach(r => console.log(`- ${r.name} (${r.industry})`));
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importData()
  .then(() => {
    console.log('\n✨ Production import complete!');
    console.log('🎯 Your AI assistant now has access to all 299 companies in production!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });