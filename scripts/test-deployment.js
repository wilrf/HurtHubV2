#!/usr/bin/env node

/**
 * Test Deployment Configuration
 * Checks if all necessary configurations are in place for deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

console.log('\n🔍 Checking Deployment Configuration\n');
console.log('=====================================\n');

let allChecksPassed = true;

// Check Node version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    log.success(`Node.js version: ${nodeVersion}`);
  } else {
    log.error(`Node.js version ${nodeVersion} is below required v18`);
    allChecksPassed = false;
  }
} catch (e) {
  log.error('Could not determine Node.js version');
  allChecksPassed = false;
}

// Check package.json
try {
  const packageJsonPath = path.join(dirname(__dirname), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  log.success('package.json found');
  
  // Check for required scripts
  const requiredScripts = ['build', 'dev', 'lint', 'type-check'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      log.success(`Script '${script}' found`);
    } else {
      log.warning(`Script '${script}' not found`);
    }
  });
} catch (e) {
  log.error('package.json not found or invalid');
  allChecksPassed = false;
}

// Check Vercel CLI
try {
  const vercelVersion = execSync('npx vercel --version', { encoding: 'utf8' }).trim();
  log.success(`Vercel CLI installed: ${vercelVersion}`);
} catch (e) {
  log.error('Vercel CLI not installed');
  log.info('Install with: npm install -g vercel');
  allChecksPassed = false;
}

// Check Vercel configuration
if (fs.existsSync(path.join(process.cwd(), 'vercel.json'))) {
  log.success('vercel.json configuration found');
} else {
  log.warning('vercel.json not found (will use default settings)');
}

// Check GitHub Actions workflows
const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
if (fs.existsSync(workflowsDir)) {
  const workflows = fs.readdirSync(workflowsDir);
  if (workflows.length > 0) {
    log.success(`GitHub Actions workflows found: ${workflows.join(', ')}`);
  } else {
    log.warning('No GitHub Actions workflows found');
  }
} else {
  log.error('.github/workflows directory not found');
  allChecksPassed = false;
}

// Check environment files
const envFiles = ['.env.example'];
envFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    log.success(`${file} found`);
  } else {
    log.warning(`${file} not found`);
  }
});

// Check if .env.local exists (but don't read it)
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  log.success('.env.local exists (content not displayed for security)');
} else {
  log.warning('.env.local not found - create one for local development');
}

// Check .gitignore
if (fs.existsSync(path.join(process.cwd(), '.gitignore'))) {
  const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
  if (gitignore.includes('.env') && gitignore.includes('.vercel')) {
    log.success('.gitignore properly configured');
  } else {
    log.warning('.gitignore may need updates for environment files');
  }
} else {
  log.error('.gitignore not found');
  allChecksPassed = false;
}

// Check if linked to Vercel
try {
  if (fs.existsSync(path.join(process.cwd(), '.vercel', 'project.json'))) {
    log.success('Project linked to Vercel');
    log.info('Run "vercel" to deploy preview');
    log.info('Run "vercel --prod" to deploy to production');
  } else {
    log.warning('Project not linked to Vercel');
    log.info('Run "vercel link" to connect your project');
  }
} catch (e) {
  log.warning('Could not check Vercel link status');
}

// Summary
console.log('\n=====================================\n');
if (allChecksPassed) {
  console.log(`${colors.green}✅ All critical checks passed!${colors.reset}\n`);
  console.log('Next steps:');
  console.log('1. Run "vercel link" if not already linked');
  console.log('2. Add GitHub secrets (see .github/SETUP_SECRETS.md)');
  console.log('3. Push to main branch to trigger deployment');
} else {
  console.log(`${colors.red}❌ Some checks failed. Please fix the issues above.${colors.reset}\n`);
}

console.log('\nFor detailed setup instructions, see:');
console.log('- DEPLOYMENT_SETUP.md');
console.log('- .github/SETUP_SECRETS.md\n');