#!/usr/bin/env node

/**
 * Generate version information for the build
 * Creates environment variables with git hash and build time
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Get git information
  const gitHash = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  const shortHash = gitHash.slice(0, 7);
  const buildTime = new Date().toISOString();

  // Get git branch
  let gitBranch;
  try {
    gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
  } catch {
    gitBranch = "unknown";
  }

  // Get commit message
  let commitMessage;
  try {
    commitMessage = execSync("git log -1 --pretty=%s", {
      encoding: "utf8",
    }).trim();
  } catch {
    commitMessage = "No commit message";
  }

  // Create version info
  const versionInfo = {
    gitHash,
    shortHash,
    gitBranch,
    commitMessage,
    buildTime,
    buildTimestamp: Date.now(),
  };

  // Write to environment file that Vite can read
  const envContent = `# Auto-generated version information
VITE_GIT_HASH=${gitHash}
VITE_GIT_HASH_SHORT=${shortHash}  
VITE_GIT_BRANCH=${gitBranch}
VITE_BUILD_TIME=${buildTime}
VITE_BUILD_TIMESTAMP=${Date.now()}
`;

  // Write to .env.version file
  const versionFilePath = join(__dirname, "../.env.version");
  writeFileSync(versionFilePath, envContent);

  // Also write JSON version for scripts
  const jsonPath = join(__dirname, "../version.json");
  writeFileSync(jsonPath, JSON.stringify(versionInfo, null, 2));

  console.log("✅ Version information generated:");
  console.log(`   Hash: ${shortHash} (${gitBranch})`);
  console.log(`   Time: ${buildTime}`);
  console.log(`   Commit: ${commitMessage.slice(0, 60)}...`);
} catch (error) {
  console.error("❌ Failed to generate version info:", error.message);

  // Fallback version info
  const fallbackContent = `# Fallback version information
VITE_GIT_HASH=dev-build
VITE_GIT_HASH_SHORT=dev
VITE_GIT_BRANCH=unknown
VITE_BUILD_TIME=${new Date().toISOString()}
VITE_BUILD_TIMESTAMP=${Date.now()}
`;

  const versionFilePath = join(__dirname, "../.env.version");
  writeFileSync(versionFilePath, fallbackContent);

  console.log("⚠️  Generated fallback version info");
}
