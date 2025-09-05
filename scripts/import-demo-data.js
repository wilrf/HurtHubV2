#!/usr/bin/env node

/**
 * Import Demo Data Script
 * Imports the 294 businesses from improvedDemoData.json into Supabase
 *
 * Usage: node scripts/import-demo-data.js
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

// Initialize Supabase client
const supabaseUrl =
  process.env.SUPABASE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error(
    "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the demo data
const demoDataPath = path.join(
  __dirname,
  "..",
  "dist",
  "improvedDemoData.json",
);
const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));

console.log(`📊 Found ${demoData.totalBusinesses} businesses in demo data`);

// Transform business data to match companies table structure
function transformBusiness(business) {
  return {
    name: business.name,
    industry: business.industry || "Other",
    sector: business.cluster || business.businessType || "Other",
    description: `${business.businessType} business in ${business.neighborhood}, established ${business.yearEstablished}`,
    founded_year: business.yearEstablished,
    employees_count: business.employees,
    revenue: Math.round(business.revenue),
    website: business.website || null,
    headquarters: `${business.address.line1}, ${business.address.city}, ${business.address.state}`,
    logo_url: null,
    status: "active",
  };
}

async function importData() {
  try {
    console.log("🚀 Starting import...");

    // First, check how many companies already exist
    const { data: existingCompanies, error: countError } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("Error checking existing companies:", countError);
    } else {
      console.log(
        `📝 Currently ${existingCompanies?.length || 0} companies in database`,
      );
    }

    // Transform all businesses
    const companies = demoData.businesses.map(transformBusiness);

    // Insert in batches of 50 to avoid timeout
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(companies.length / batchSize);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches}...`);

      const { data, error } = await supabase
        .from("companies")
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error in batch ${batchNumber}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += data.length;
        console.log(
          `✅ Batch ${batchNumber} imported: ${data.length} companies`,
        );
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully imported: ${successCount} companies`);
    if (errorCount > 0) {
      console.log(`❌ Failed to import: ${errorCount} companies`);
    }

    // Verify final count
    const { count } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    console.log(`\n🎉 Total companies now in database: ${count}`);

    // Test that we can query the data
    const { data: sampleCompanies } = await supabase
      .from("companies")
      .select("name, industry, revenue")
      .order("revenue", { ascending: false })
      .limit(5);

    if (sampleCompanies && sampleCompanies.length > 0) {
      console.log("\n📈 Top 5 companies by revenue:");
      sampleCompanies.forEach((company, index) => {
        console.log(
          `${index + 1}. ${company.name} (${company.industry}): $${company.revenue?.toLocaleString()}`,
        );
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
    console.log("\n✨ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
