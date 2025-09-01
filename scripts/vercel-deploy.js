#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports, no-console */

/**
 * Vercel Deployment Helper Script
 * This script provides easy commands for Vercel deployment management
 */

const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

const runCommand = (command, silent = false) => {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
    });
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

async function deployPreview() {
  console.log("\n📦 Deploying to Preview...\n");
  runCommand("npx vercel");
}

async function deployProduction() {
  console.log("\n🚀 Deploying to Production...\n");
  runCommand("npx vercel --prod");
}

async function listDeployments() {
  console.log("\n📋 Recent Deployments:\n");
  runCommand("npx vercel list");
}

async function setEnvironmentVariable() {
  const varName = await question("\nEnvironment variable name: ");
  const value = await question("Value: ");
  const envType = await question(
    "Environment (development/preview/production): ",
  );
  runCommand(`npx vercel env add ${varName} ${value} ${envType}`);
}

async function pullEnvironmentVariables() {
  console.log("\n⬇️ Pulling environment variables...\n");
  runCommand("npx vercel env pull");
}

async function viewDeploymentLogs() {
  const deployUrl = await question("\nDeployment URL or ID: ");
  runCommand(`npx vercel logs ${deployUrl}`);
}

async function checkProjectStatus() {
  console.log("\n📊 Project Status:\n");
  runCommand("npx vercel project");
}

async function removeDeployment() {
  const removeUrl = await question("\nDeployment URL to remove: ");
  runCommand(`npx vercel remove ${removeUrl} --yes`);
}

async function openDashboard() {
  console.log("\n🌐 Opening Vercel Dashboard...\n");
  runCommand("npx vercel dashboard");
}

const main = async () => {
  console.clear();
  const choice = await question(menu);

  const actions = {
    1: deployPreview,
    2: deployProduction,
    3: listDeployments,
    4: setEnvironmentVariable,
    5: pullEnvironmentVariables,
    6: viewDeploymentLogs,
    7: checkProjectStatus,
    8: removeDeployment,
    9: openDashboard,
    0: () => {
      console.log("\nGoodbye! 👋\n");
      process.exit(0);
    },
  };

  const action = actions[choice];
  if (action) {
    await action();
  } else {
    console.log("\n❌ Invalid option\n");
  }

  await question("\nPress Enter to continue...");
  main();
};

// Start the script
console.log("🔷 Vercel Deployment Manager");
console.log("============================\n");

// Check if Vercel CLI is available
const vercelCheck = runCommand("npx vercel --version", true);
if (!vercelCheck) {
  console.error("❌ Vercel CLI not found. Installing...");
  runCommand("npm install -g vercel");
}

main().catch(console.error);
