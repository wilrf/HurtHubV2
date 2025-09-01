#!/usr/bin/env node

/**
 * GitHub Actions Pipeline Monitor
 * Fetches and displays the latest workflow run status and logs
 */

import https from 'https';
import { execSync } from 'child_process';

const REPO_OWNER = 'wilrf';
const REPO_NAME = 'HurtHubV2';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// Get GitHub token from git config or environment
function getGitHubToken() {
  try {
    // Try to get from git config
    const token = execSync('git config --global github.token', { encoding: 'utf8' }).trim();
    if (token) return token;
  } catch {}
  
  // Check environment variable
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  
  console.log(`${colors.yellow}ℹ No GitHub token found. Some features may be limited.${colors.reset}`);
  console.log('To set a token, run: git config --global github.token YOUR_TOKEN');
  return null;
}

// Make API request to GitHub
function githubRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Pipeline-Monitor',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// Format duration
function formatDuration(start, end) {
  if (!start || !end) return '';
  const duration = new Date(end) - new Date(start);
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Get status emoji and color
function getStatusDisplay(status, conclusion) {
  if (status === 'in_progress') {
    return { emoji: '🔄', color: colors.yellow, text: 'Running' };
  }
  if (status === 'queued') {
    return { emoji: '⏳', color: colors.gray, text: 'Queued' };
  }
  
  switch (conclusion) {
    case 'success':
      return { emoji: '✅', color: colors.green, text: 'Success' };
    case 'failure':
      return { emoji: '❌', color: colors.red, text: 'Failed' };
    case 'cancelled':
      return { emoji: '⛔', color: colors.gray, text: 'Cancelled' };
    case 'skipped':
      return { emoji: '⏭️', color: colors.gray, text: 'Skipped' };
    default:
      return { emoji: '❓', color: colors.gray, text: conclusion || status };
  }
}

// Main function
async function checkPipeline() {
  const token = getGitHubToken();
  
  console.log(`\n${colors.bold}🔍 GitHub Actions Pipeline Status${colors.reset}`);
  console.log(`${colors.gray}Repository: ${REPO_OWNER}/${REPO_NAME}${colors.reset}\n`);
  
  try {
    // Get latest workflow runs
    const runs = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5`,
      token
    );
    
    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      console.log('No workflow runs found.');
      return;
    }
    
    // Display each run
    for (const run of runs.workflow_runs) {
      const status = getStatusDisplay(run.status, run.conclusion);
      
      console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${status.emoji} ${status.color}${status.text}${colors.reset} - ${colors.bold}${run.name}${colors.reset}`);
      console.log(`   Branch: ${colors.blue}${run.head_branch}${colors.reset}`);
      console.log(`   Commit: ${colors.gray}${run.head_sha.substring(0, 7)}${colors.reset} - ${run.head_commit?.message?.split('\n')[0] || 'No message'}`);
      console.log(`   Started: ${formatTime(run.created_at)} | Duration: ${formatDuration(run.created_at, run.updated_at)}`);
      console.log(`   URL: ${colors.blue}${run.html_url}${colors.reset}`);
      
      // Get jobs for failed runs
      if (run.conclusion === 'failure' && token) {
        const jobs = await githubRequest(
          `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${run.id}/jobs`,
          token
        );
        
        const failedJobs = jobs.jobs?.filter(job => job.conclusion === 'failure') || [];
        if (failedJobs.length > 0) {
          console.log(`\n   ${colors.red}Failed Jobs:${colors.reset}`);
          for (const job of failedJobs) {
            console.log(`   ${colors.red}  ❌ ${job.name}${colors.reset}`);
            
            // Show failed steps
            const failedSteps = job.steps?.filter(step => step.conclusion === 'failure') || [];
            for (const step of failedSteps) {
              console.log(`      ${colors.gray}└─ ${step.name}${colors.reset}`);
            }
          }
        }
      }
    }
    
    console.log(`\n${colors.gray}Tip: For detailed logs, click on the URL above${colors.reset}`);
    console.log(`${colors.gray}Or run: npx playwright install && npm run test:e2e:ui${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}Error fetching pipeline status:${colors.reset}`, error.message);
    console.log('\nTry setting a GitHub token for better access:');
    console.log('1. Create a token at: https://github.com/settings/tokens');
    console.log('2. Run: git config --global github.token YOUR_TOKEN');
  }
}

// Run the check
checkPipeline().catch(console.error);