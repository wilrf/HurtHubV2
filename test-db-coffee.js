const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Use the correct Supabase project
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCoffeeShops() {
  console.log("Testing Supabase database for coffee shops...\n");
  console.log("Project URL:", supabaseUrl);

  // Search for coffee-related businesses
  const { data: coffeeShops, error: coffeeError } = await supabase
    .from("companies")
    .select("name, industry, description, address, city")
    .or(
      "name.ilike.%coffee%,name.ilike.%dunkin%,name.ilike.%starbucks%,description.ilike.%coffee%",
    )
    .eq("status", "active")
    .limit(10);

  if (coffeeError) {
    console.error("Error fetching coffee shops:", coffeeError);
  } else {
    console.log(
      `Found ${coffeeShops?.length || 0} coffee-related businesses:\n`,
    );
    coffeeShops?.forEach((shop) => {
      console.log(`- ${shop.name}`);
      console.log(`  Industry: ${shop.industry || "N/A"}`);
      console.log(`  Address: ${shop.address || "N/A"}, ${shop.city || "N/A"}`);
      console.log(`  Description: ${shop.description || "N/A"}`);
      console.log("");
    });
  }

  // Get total company count
  const { count, error: countError } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  console.log(`\nTotal active companies in database: ${count || "Unknown"}`);

  // Get sample of industries
  const { data: industries, error: indError } = await supabase
    .from("companies")
    .select("industry")
    .eq("status", "active")
    .limit(50);

  if (!indError && industries) {
    const uniqueIndustries = [
      ...new Set(industries.map((i) => i.industry).filter(Boolean)),
    ];
    console.log(
      `\nSample industries (${uniqueIndustries.length} unique):`,
      uniqueIndustries.slice(0, 10).join(", "),
    );
  }
}

testCoffeeShops().catch(console.error);
