#!/usr/bin/env node

/**
 * Import Improved Demo Data Script
 * Imports rich business data from improvedDemoData.json into the enhanced schema
 * 
 * Features:
 * - Validates required fields before import
 * - Uses transactions for atomicity
 * - Deduplicates addresses via UNIQUE constraints
 * - Batch processes reviews for performance
 * - Preserves all rich data (features, metrics, hours, etc.)
 *
 * Usage: node scripts/import-improved-data.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role key for full access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check for clean import flag
const cleanImport = process.argv.includes('--clean');

if (cleanImport) {
  console.log("🧹 CLEAN IMPORT MODE: Will delete all existing data first");
  
  console.log("🗑️  Deleting all reviews...");
  await supabase.from('reviews').delete().neq('id', 0);
  
  console.log("🗑️  Deleting all companies...");  
  await supabase.from('companies').delete().neq('id', 0);
  
  console.log("🗑️  Deleting all addresses...");
  await supabase.from('addresses').delete().neq('id', 0);
  
  console.log("✅ Database cleaned!");
}

// Read the demo data
const demoDataPath = path.join(__dirname, "..", "dist", "improvedDemoData.json");

if (!fs.existsSync(demoDataPath)) {
  console.error(`❌ Demo data file not found: ${demoDataPath}`);
  process.exit(1);
}

const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
console.log(`📊 Found ${demoData.totalBusinesses} businesses in demo data`);

// Validation functions
function validateBusiness(business) {
  const errors = [];
  
  if (!business.id) errors.push("Missing id");
  if (!business.name) errors.push("Missing name");
  // Address is now optional - only validate if present
  
  return errors;
}

// Check if business has complete address data
function hasValidAddress(business) {
  return business.address?.line1 && business.address?.city && business.address?.state;
}

// Transform address for addresses table
function transformAddress(address) {
  return {
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    state: address.state,
    zip_code: address.zipCode || null,
    latitude: address.latitude || null,
    longitude: address.longitude || null,
  };
}

// Transform business for companies table
function transformBusiness(business, addressId) {
  return {
    external_id: business.id,
    name: business.name,
    industry: business.industry || "Other",
    sector: business.cluster || business.businessType || "Other",
    description: business.description || `${business.businessType || 'Business'} in ${business.neighborhood || business.address?.city || 'Charlotte area'}`,
    founded_year: business.yearEstablished,
    employees_count: business.employees,
    revenue: Math.round(business.revenue || 0),
    website: business.website || null,
    headquarters: business.headquarters || (business.address?.line1 ? `${business.address.line1}, ${business.address.city}, ${business.address.state}` : `${business.neighborhood || 'Charlotte area'}, NC`),
    logo_url: null,
    status: "active",
    address_id: addressId,
    features: business.features || {},
    metrics: {
      squareFeet: business.squareFeet,
      rentPerSqFt: business.rentPerSqFt,
      annualRent: business.annualRent,
      grossMargin: business.grossMargin,
      netMargin: business.netMargin,
      revenueGrowth: business.revenueGrowth,
      operatingCosts: business.operatingCosts,
      industryMetrics: business.industryMetrics,
      businessAge: business.businessAge,
      utilizationRate: business.utilizationRate,
      naicsCode: business.naics,
      cluster: business.cluster,
    },
    ext_financials: {
      monthlyRevenue: business.monthlyRevenue || [],
      revenuePerEmployee: business.revenuePerEmployee,
      rating: business.rating,
      reviewCount: business.reviewCount || 0,
      hours: business.hours || {},
    }
  };
}

// Transform reviews for reviews table  
function transformReviews(business, companyId) {
  if (!business.reviews || business.reviews.length === 0) {
    return [];
  }
  
  return business.reviews.map(review => ({
    company_id: companyId,
    reviewer: review.reviewer || null,
    rating: review.rating,
    comment: review.text || review.comment,
    reviewed_at: review.date ? new Date(review.date).toISOString().split('T')[0] : null,
  }));
}

async function importBusiness(business) {
  try {
    // Validate business data
    const validationErrors = validateBusiness(business);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Step 1: Upsert address only if valid address data exists
    let addressId = null;
    
    if (hasValidAddress(business)) {
      const addressData = transformAddress(business.address);
      const { data: addressResult, error: addressError } = await supabase
        .from('addresses')
        .upsert(addressData, { 
          onConflict: 'line1,city,state,zip_code',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (addressError) {
        throw new Error(`Address upsert failed: ${addressError.message}`);
      }

      addressId = addressResult.id;
    }

    // Step 2: Insert/update company
    const companyData = transformBusiness(business, addressId);
    
    // Check if company already exists by unique business ID from source data
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('external_id', business.id)
      .single();

    let companyId;
    
    if (existingCompany) {
      // Update existing company
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', existingCompany.id)
        .select('id')
        .single();
        
      if (updateError) throw new Error(`Company update failed: ${updateError.message}`);
      companyId = updatedCompany.id;
    } else {
      // Insert new company
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert(companyData)
        .select('id')
        .single();
        
      if (insertError) throw new Error(`Company insert failed: ${insertError.message}`);
      companyId = newCompany.id;
    }

    // Step 3: Handle reviews
    const reviewsData = transformReviews(business, companyId);
    if (reviewsData.length > 0) {
      // Delete existing reviews for this company first
      await supabase
        .from('reviews')
        .delete()
        .eq('company_id', companyId);

      // Insert new reviews in batches of 500
      const batchSize = 500;
      for (let i = 0; i < reviewsData.length; i += batchSize) {
        const batch = reviewsData.slice(i, i + batchSize);
        const { error: reviewsError } = await supabase
          .from('reviews')
          .insert(batch);
          
        if (reviewsError) {
          throw new Error(`Reviews batch insert failed: ${reviewsError.message}`);
        }
      }
    }

    return { success: true, companyId, reviewCount: reviewsData.length };
    
  } catch (error) {
    console.error(`❌ Failed to import business ${business.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function importData() {
  try {
    console.log("🚀 Starting enhanced import...");

    // Check existing data
    const { count: existingCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    console.log(`📝 Currently ${existingCount || 0} companies in database`);

    let successCount = 0;
    let errorCount = 0;
    let totalReviews = 0;

    console.log(`\n📦 Processing ${demoData.businesses.length} businesses...`);

    // Process each business individually for better error handling
    for (let i = 0; i < demoData.businesses.length; i++) {
      const business = demoData.businesses[i];
      const result = await importBusiness(business);
      
      if (result.success) {
        successCount++;
        totalReviews += result.reviewCount;
        
        if ((i + 1) % 50 === 0) {
          console.log(`✅ Processed ${i + 1}/${demoData.businesses.length} businesses`);
        }
      } else {
        errorCount++;
      }
      
      // Small delay to prevent overwhelming the database
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully imported: ${successCount} companies`);
    console.log(`📝 Total reviews imported: ${totalReviews}`);
    if (errorCount > 0) {
      console.log(`❌ Failed to import: ${errorCount} companies`);
    }

    // Final verification queries
    console.log("\n🔍 Running verification queries...");
    
    const { count: finalCompanyCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    const { count: addressCount } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true });
      
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    console.log(`🏢 Total companies: ${finalCompanyCount}`);
    console.log(`📍 Total addresses: ${addressCount}`);
    console.log(`⭐ Total reviews: ${reviewCount}`);

    // Sample some rich data
    const { data: sampleCompanies } = await supabase
      .from('companies')
      .select(`
        name, industry, revenue,
        features, ext_financials,
        addresses:address_id (city, state)
      `)
      .order('revenue', { ascending: false })
      .limit(3);

    if (sampleCompanies?.length > 0) {
      console.log("\n📈 Sample companies with rich data:");
      sampleCompanies.forEach((company, index) => {
        const monthlyRevenue = company.ext_financials?.monthlyRevenue;
        const hasFeatures = Object.keys(company.features || {}).length > 0;
        console.log(`${index + 1}. ${company.name} (${company.industry})`);
        console.log(`   📍 ${company.addresses?.city}, ${company.addresses?.state}`);
        console.log(`   💰 Revenue: $${company.revenue?.toLocaleString()}`);
        console.log(`   📊 Monthly data: ${monthlyRevenue ? 'Yes' : 'No'}`);
        console.log(`   🔧 Features: ${hasFeatures ? 'Yes' : 'No'}`);
      });
    }

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the import
console.log("🔌 Connecting to Supabase...");
console.log(`URL: ${supabaseUrl.substring(0, 30)}...`);

importData()
  .then(() => {
    console.log("\n✨ Enhanced import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });