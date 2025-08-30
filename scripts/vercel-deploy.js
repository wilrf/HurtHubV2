#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * This script provides easy commands for Vercel deployment management
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const runCommand = (command, silent = false) => {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
};

const menu = `
╔══════════════════════════════════════╗
║     Vercel Deployment Manager        ║
╚══════════════════════════════════════╝

1. Deploy to Preview
2. Deploy to Production
3. List Recent Deployments
4. Set Environment Variables
5. Pull Environment Variables
6. View Deployment Logs
7. Check Project Status
8. Remove a Deployment
9. Open Dashboard
0. Exit

Select an option: `;

const main = async () => {
  console.clear();
  const choice = await question(menu);

  switch(choice) {
    case '1':
      console.log('\n📦 Deploying to Preview...\n');
      runCommand('npx vercel');
      break;

    case '2':
      console.log('\n🚀 Deploying to Production...\n');
      runCommand('npx vercel --prod');
      break;

    case '3':
      console.log('\n📋 Recent Deployments:\n');
      runCommand('npx vercel list');
      break;

    case '4':
      const varName = await question('\nEnvironment variable name: ');
      const varValue = await question('Value: ');
      const envType = await question('Environment (development/preview/production): ');
      runCommand(`npx vercel env add ${varName} ${envType}`);
      break;

    case '5':
      console.log('\n⬇️ Pulling environment variables...\n');
      runCommand('npx vercel env pull');
      break;

    case '6':
      const deployUrl = await question('\nDeployment URL or ID: ');
      runCommand(`npx vercel logs ${deployUrl}`);
      break;

    case '7':
      console.log('\n📊 Project Status:\n');
      runCommand('npx vercel project');
      break;

    case '8':
      const removeUrl = await question('\nDeployment URL to remove: ');
      runCommand(`npx vercel remove ${removeUrl} --yes`);
      break;

    case '9':
      console.log('\n🌐 Opening Vercel Dashboard...\n');
      runCommand('npx vercel dashboard');
      break;

    case '0':
      console.log('\nGoodbye! 👋\n');
      process.exit(0);
      break;

    default:
      console.log('\n❌ Invalid option\n');
  }

  const again = await question('\nPress Enter to continue...');
  main();
};

// Start the script
console.log('🔷 Vercel Deployment Manager');
console.log('============================\n');

// Check if Vercel CLI is available
const vercelCheck = runCommand('npx vercel --version', true);
if (!vercelCheck) {
  console.error('❌ Vercel CLI not found. Installing...');
  runCommand('npm install -g vercel');
}

main().catch(console.error);