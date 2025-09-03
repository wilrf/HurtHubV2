#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Ensures all environment variables and configurations are correct before deploying
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validation results
const results = {
  errors: [],
  warnings: [],
  successes: [],
};

// Check OpenAI configuration
function validateOpenAI() {
  logSection('OpenAI Configuration');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    logError('OPENAI_API_KEY not found in environment');
    results.errors.push('Missing OPENAI_API_KEY');
    return false;
  }
  
  const trimmedKey = apiKey.trim();
  const hasWhitespace = apiKey !== trimmedKey;
  
  if (hasWhitespace) {
    logWarning(`API key has whitespace (length: ${apiKey.length} → ${trimmedKey.length} after trim)`);
    results.warnings.push('OpenAI key has whitespace');
  }
  
  if (!trimmedKey.startsWith('sk-')) {
    logError(`Invalid key format: should start with 'sk-' but starts with '${trimmedKey.substring(0, 3)}'`);
    results.errors.push('Invalid OpenAI key format');
    return false;
  }
  
  const isProjectKey = trimmedKey.startsWith('sk-proj-');
  const expectedLength = isProjectKey ? 164 : 51;
  
  logInfo(`Key type: ${isProjectKey ? 'Project Key' : 'Legacy Key'}`);
  logInfo(`Key length: ${trimmedKey.length} (expected: ${expectedLength})`);
  logInfo(`Key prefix: ${trimmedKey.substring(0, 12)}...`);
  
  if (trimmedKey.length !== expectedLength) {
    logWarning(`Key length (${trimmedKey.length}) differs from expected (${expectedLength})`);
    results.warnings.push(`OpenAI key length mismatch: ${trimmedKey.length} vs ${expectedLength}`);
  }
  
  logSuccess('OpenAI API key validated');
  results.successes.push('OpenAI configuration valid');
  return true;
}

// Check Supabase configuration
function validateSupabase() {
  logSection('Supabase Configuration');
  
  const urlKeys = [
    'SUPABASE_URL',
    'SUPABASE_SUPABASE_URL'
  ];
  
  const anonKeys = [
    'SUPABASE_ANON_KEY',
    'SUPABASE_SUPABASE_ANON_KEY'
  ];
  
  const serviceKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  // Check for URL
  let supabaseUrl = null;
  for (const key of urlKeys) {
    if (process.env[key]) {
      supabaseUrl = process.env[key];
      logInfo(`Found Supabase URL in ${key}`);
      break;
    }
  }
  
  if (!supabaseUrl) {
    logError('No Supabase URL found in any expected environment variable');
    results.errors.push('Missing Supabase URL');
    return false;
  }
  
  // Validate URL format
  if (!supabaseUrl.includes('supabase.co')) {
    logWarning('Supabase URL does not contain "supabase.co"');
    results.warnings.push('Unusual Supabase URL format');
  }
  
  // Check for anon key
  let anonKey = null;
  for (const key of anonKeys) {
    if (process.env[key]) {
      anonKey = process.env[key];
      logInfo(`Found anon key in ${key}`);
      break;
    }
  }
  
  if (!anonKey) {
    logWarning('No Supabase anon key found (needed for client-side)');
    results.warnings.push('Missing Supabase anon key');
  }
  
  // Check for service role key
  let serviceKey = null;
  for (const key of serviceKeys) {
    if (process.env[key]) {
      serviceKey = process.env[key];
      logInfo(`Found service role key in ${key}`);
      break;
    }
  }
  
  if (!serviceKey) {
    logError('No Supabase service role key found (required for API routes)');
    results.errors.push('Missing Supabase service role key');
    return false;
  }
  
  // Check for whitespace
  if (supabaseUrl.trim() !== supabaseUrl) {
    logWarning('Supabase URL has whitespace');
    results.warnings.push('Supabase URL has whitespace');
  }
  
  if (serviceKey.trim() !== serviceKey) {
    logWarning('Supabase service key has whitespace');
    results.warnings.push('Supabase service key has whitespace');
  }
  
  logSuccess('Supabase configuration validated');
  results.successes.push('Supabase configuration valid');
  return true;
}

// Check file structure
function validateFileStructure() {
  logSection('File Structure');
  
  const requiredFiles = [
    'lib/openai-singleton.ts',
    'api/diagnose.ts',
    'api/ai-search.ts',
    'api/ai-chat-simple.ts',
    '.env.example',
    'package.json',
    'tsconfig.json'
  ];
  
  const requiredDirs = [
    'api',
    'lib',
    'src',
    'public',
    'api-docs',
    'api-docs/openai'
  ];
  
  let allFilesExist = true;
  
  // Check directories
  for (const dir of requiredDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      logSuccess(`Directory exists: ${dir}`);
    } else {
      logError(`Missing directory: ${dir}`);
      results.errors.push(`Missing directory: ${dir}`);
      allFilesExist = false;
    }
  }
  
  // Check files
  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      logSuccess(`File exists: ${file}`);
    } else {
      logError(`Missing file: ${file}`);
      results.errors.push(`Missing file: ${file}`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    results.successes.push('All required files present');
  }
  
  return allFilesExist;
}

// Check TypeScript compilation
async function validateTypeScript() {
  logSection('TypeScript Validation');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    logInfo('Running TypeScript compiler check...');
    const { stdout, stderr } = await execPromise('npx tsc --noEmit');
    
    if (stderr) {
      logWarning('TypeScript warnings:');
      console.log(stderr);
      results.warnings.push('TypeScript has warnings');
    } else {
      logSuccess('TypeScript compilation successful');
      results.successes.push('TypeScript valid');
    }
    return true;
  } catch (error) {
    logError('TypeScript compilation failed:');
    console.log(error.stdout || error.message);
    results.errors.push('TypeScript compilation failed');
    return false;
  }
}

// Test OpenAI connection
async function testOpenAIConnection() {
  logSection('OpenAI Connection Test');
  
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  if (!apiKey) {
    logError('Cannot test connection - no API key');
    return false;
  }
  
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    
    logInfo('Testing OpenAI API connection...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with OK' }],
      max_tokens: 5,
    });
    
    const response = completion.choices[0]?.message?.content;
    logSuccess(`OpenAI API responded: "${response}"`);
    logInfo(`Model used: ${completion.model}`);
    results.successes.push('OpenAI connection successful');
    return true;
  } catch (error) {
    logError(`OpenAI connection failed: ${error.message}`);
    
    if (error.status === 401) {
      results.errors.push('OpenAI API key is invalid');
    } else {
      results.errors.push(`OpenAI connection error: ${error.message}`);
    }
    return false;
  }
}

// Main validation function
async function runValidation() {
  console.log('\n' + '🚀 PRE-DEPLOYMENT VALIDATION SCRIPT'.padEnd(60, ' '));
  console.log('='.repeat(60));
  
  // Run all validations
  const openaiValid = validateOpenAI();
  const supabaseValid = validateSupabase();
  const filesValid = validateFileStructure();
  
  // TypeScript check (optional, can be slow)
  let tsValid = true;
  if (process.argv.includes('--typescript')) {
    tsValid = await validateTypeScript();
  } else {
    logInfo('\nSkipping TypeScript check (use --typescript to enable)');
  }
  
  // Connection test (optional, requires API call)
  if (process.argv.includes('--test-connection') && openaiValid) {
    await testOpenAIConnection();
  } else if (!process.argv.includes('--test-connection')) {
    logInfo('\nSkipping connection test (use --test-connection to enable)');
  }
  
  // Summary
  logSection('VALIDATION SUMMARY');
  
  if (results.successes.length > 0) {
    log('\nSuccesses:', 'green');
    results.successes.forEach(s => logSuccess(s));
  }
  
  if (results.warnings.length > 0) {
    log('\nWarnings:', 'yellow');
    results.warnings.forEach(w => logWarning(w));
  }
  
  if (results.errors.length > 0) {
    log('\nErrors:', 'red');
    results.errors.forEach(e => logError(e));
  }
  
  // Final verdict
  console.log('\n' + '='.repeat(60));
  
  if (results.errors.length === 0) {
    log('✅ VALIDATION PASSED - Ready for deployment!', 'green');
    
    if (results.warnings.length > 0) {
      log(`   (with ${results.warnings.length} warning${results.warnings.length > 1 ? 's' : ''})`, 'yellow');
    }
    
    console.log('\nNext steps:');
    console.log('1. Run: vercel --prod');
    console.log('2. Test: curl https://your-app.vercel.app/api/diagnose');
    
    process.exit(0);
  } else {
    log(`❌ VALIDATION FAILED - ${results.errors.length} error${results.errors.length > 1 ? 's' : ''} found`, 'red');
    console.log('\nPlease fix the errors above before deploying.');
    process.exit(1);
  }
}

// Run the validation
runValidation().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});