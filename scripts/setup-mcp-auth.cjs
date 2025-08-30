#!/usr/bin/env node

/**
 * Setup MCP Authentication for Vercel
 * This script helps configure authentication for Claude MCP servers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

async function main() {
  console.log(`\n${colors.bright}🔐 Vercel MCP Authentication Setup${colors.reset}\n`);
  
  // Check if already authenticated with Vercel CLI
  try {
    const user = execSync('npx vercel whoami', { encoding: 'utf8' }).trim();
    log.success(`Vercel CLI authenticated as: ${colors.bright}${user}${colors.reset}`);
  } catch (error) {
    log.error('Not authenticated with Vercel CLI');
    console.log('\nPlease run: npx vercel login\n');
    process.exit(1);
  }

  // Instructions for getting a token
  console.log('\n' + colors.bright + 'To authenticate MCP servers, you need a Vercel token:' + colors.reset);
  console.log('\n1. Open your browser and go to:');
  console.log(`   ${colors.blue}https://vercel.com/account/tokens${colors.reset}`);
  console.log('\n2. Click "Create Token"');
  console.log('3. Name it: "Claude MCP Access"');
  console.log('4. Set expiration: 1 year (recommended)');
  console.log('5. Set scope: Full Account');
  console.log('6. Copy the token\n');

  const hasToken = await question('Do you have your Vercel token? (y/n): ');
  
  if (hasToken.toLowerCase() !== 'y') {
    console.log('\nOpening Vercel tokens page...');
    const opener = process.platform === 'win32' ? 'start' : 
                   process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${opener} https://vercel.com/account/tokens`);
    console.log('\nPlease create a token and run this script again.\n');
    rl.close();
    return;
  }

  const token = await question('\nPaste your Vercel token here: ');
  
  if (!token || token.length < 20) {
    log.error('Invalid token');
    rl.close();
    return;
  }

  // Save token to environment file
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('VERCEL_TOKEN')) {
      envContent += `\n\n# Vercel MCP Authentication\nVERCEL_TOKEN=${token}\n`;
    } else {
      envContent = envContent.replace(/VERCEL_TOKEN=.*/, `VERCEL_TOKEN=${token}`);
    }
  } else {
    envContent = `# Vercel MCP Authentication\nVERCEL_TOKEN=${token}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  log.success('Token saved to .env.local');

  // Set environment variable for current session
  process.env.VERCEL_TOKEN = token;
  
  // Update Claude MCP configuration
  console.log('\nUpdating Claude MCP configuration...');
  
  const claudeConfigPath = path.join(require('os').homedir(), '.claude.json');
  
  if (fs.existsSync(claudeConfigPath)) {
    const config = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    
    // Update MCP servers with authentication
    if (config.mcpServers) {
      Object.keys(config.mcpServers).forEach(server => {
        if (server.includes('vercel')) {
          config.mcpServers[server].env = {
            ...config.mcpServers[server].env,
            VERCEL_TOKEN: token
          };
        }
      });
      
      fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
      log.success('Claude configuration updated');
    }
  }

  // Test the authentication
  console.log('\n' + colors.bright + 'Testing MCP authentication...' + colors.reset);
  
  try {
    const result = execSync('claude mcp list', { encoding: 'utf8' });
    console.log(result);
    
    if (result.includes('✓')) {
      log.success('MCP authentication successful!');
    } else {
      log.warning('MCP servers configured but may need additional setup');
    }
  } catch (error) {
    log.error('Could not verify MCP status');
  }

  console.log('\n' + colors.green + colors.bright + '✨ Setup complete!' + colors.reset);
  console.log('\nYou can now use Vercel MCP commands in Claude Code.\n');
  
  rl.close();
}

main().catch(console.error);