import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupTable(tableName) {
  console.log(`Backing up ${tableName} table...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${tableName}_${timestamp}.json`;
  const filepath = path.join(__dirname, '..', 'backups', filename);
  
  // Create backups directory if it doesn't exist
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  // Write backup file
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  
  console.log(`✓ Backed up ${data?.length || 0} rows from ${tableName} to ${filename}`);
  return { table: tableName, rows: data?.length || 0, file: filename };
}

async function main() {
  console.log('Starting database backup...');
  console.log('=====================================');
  
  try {
    const results = [];
    
    // Backup companies table
    results.push(await backupTable('companies'));
    
    // Backup businesses table
    results.push(await backupTable('businesses'));
    
    console.log('\n=====================================');
    console.log('Backup Summary:');
    results.forEach(r => {
      console.log(`- ${r.table}: ${r.rows} rows → ${r.file}`);
    });
    console.log('=====================================');
    console.log('✓ Backup completed successfully');
    
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

main();