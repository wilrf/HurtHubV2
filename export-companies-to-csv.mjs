import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportToCSV() {
  console.log('Fetching all companies from database...\n');
  
  // Get all companies
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }
  
  console.log(`Found ${companies?.length || 0} companies`);
  
  if (!companies || companies.length === 0) {
    console.log('No companies to export');
    return;
  }
  
  // Get all column names from first company
  const columns = Object.keys(companies[0]);
  
  // Create CSV header
  let csv = columns.join(',') + '\n';
  
  // Add data rows
  companies.forEach(company => {
    const row = columns.map(col => {
      const value = company[col];
      // Handle null values
      if (value === null || value === undefined) return '';
      // Escape quotes and wrap in quotes if contains comma or newline
      const str = String(value);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csv += row.join(',') + '\n';
  });
  
  // Save to file
  const filename = `charlotte-companies-export-${new Date().toISOString().split('T')[0]}.csv`;
  writeFileSync(filename, csv);
  console.log(`\n✅ Exported to ${filename}`);
  
  // Show summary statistics
  console.log('\n--- Summary ---');
  console.log(`Total companies: ${companies.length}`);
  
  // Count by industry
  const industries = {};
  companies.forEach(c => {
    const ind = c.industry || 'Unknown';
    industries[ind] = (industries[ind] || 0) + 1;
  });
  
  console.log('\nCompanies by industry:');
  Object.entries(industries)
    .sort(([,a], [,b]) => b - a)
    .forEach(([industry, count]) => {
      console.log(`  ${industry}: ${count}`);
    });
  
  // Show sample data
  console.log('\nFirst 3 companies:');
  companies.slice(0, 3).forEach(c => {
    console.log(`  - ${c.name} (${c.industry || 'N/A'})`);
  });
}

exportToCSV().catch(console.error);