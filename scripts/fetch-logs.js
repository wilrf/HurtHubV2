#!/usr/bin/env node

/**
 * Fetch detailed GitHub Actions logs
 */

import https from "https";
import { execSync } from "child_process";

const REPO_OWNER = "wilrf";
const REPO_NAME = "HurtHubV2";

// Get GitHub token
function getGitHubToken() {
  try {
    return execSync("git config --global github.token", {
      encoding: "utf8",
    }).trim();
  } catch {
    console.error(
      "No GitHub token found. Run: git config --global github.token YOUR_TOKEN",
    );
    process.exit(1);
  }
}

// Make authenticated API request
function githubRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: path,
      method: "GET",
      headers: {
        "User-Agent": "Pipeline-Monitor",
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token}`,
      },
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            // If not JSON, return raw data
            resolve(data);
          }
        });
      })
      .on("error", reject);
  });
}

// Download logs
function downloadLogs(url, token) {
  return new Promise((resolve, reject) => {
    const urlParts = new URL(url);
    const options = {
      hostname: urlParts.hostname,
      path: urlParts.pathname + urlParts.search,
      method: "GET",
      headers: {
        "User-Agent": "Pipeline-Monitor",
        Authorization: `token ${token}`,
      },
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function fetchLogs() {
  const token = getGitHubToken();

  console.log("🔍 Fetching latest failed workflow...\n");

  try {
    // Get latest workflow runs
    const runs = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?status=failure&per_page=1`,
      token,
    );

    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      console.log("No failed workflow runs found.");
      return;
    }

    const run = runs.workflow_runs[0];
    console.log(`📋 Workflow: ${run.name}`);
    console.log(`🔗 URL: ${run.html_url}`);
    console.log(`📝 Commit: ${run.head_commit?.message?.split("\n")[0]}\n`);

    // Get jobs
    const jobs = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${run.id}/jobs`,
      token,
    );

    // Find failed jobs
    const failedJobs =
      jobs.jobs?.filter((job) => job.conclusion === "failure") || [];

    for (const job of failedJobs) {
      console.log(`\n❌ Failed Job: ${job.name}`);
      console.log("─".repeat(50));

      // Get logs for this job
      try {
        const logsUrl = await githubRequest(
          `/repos/${REPO_OWNER}/${REPO_NAME}/actions/jobs/${job.id}/logs`,
          token,
        );

        // GitHub returns a redirect URL for logs
        if (typeof logsUrl === "string" && logsUrl.includes("http")) {
          const logs = await downloadLogs(logsUrl, token);

          // Find error lines
          const lines = logs.split("\n");
          const errorLines = [];
          let captureContext = false;
          let contextLines = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Look for error indicators
            if (line.match(/error|failed|failure|exit code [1-9]|❌|✗/i)) {
              // Add previous context lines
              if (i > 0 && !captureContext) {
                for (let j = Math.max(0, i - 2); j < i; j++) {
                  contextLines.push(lines[j]);
                }
              }
              errorLines.push(line);
              captureContext = true;
            } else if (captureContext && contextLines.length < 5) {
              // Add following context lines
              contextLines.push(line);
            } else if (captureContext) {
              captureContext = false;
              contextLines = [];
            }
          }

          // Display relevant error lines
          if (errorLines.length > 0) {
            console.log("\n📝 Error Details:");
            errorLines.slice(0, 20).forEach((line) => {
              // Clean up GitHub Actions timestamps and formatting
              const cleanLine = line
                .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, "")
                .replace(/##\[error\]/g, "❌ ERROR:")
                .replace(/##\[warning\]/g, "⚠️ WARNING:");

              if (cleanLine.trim()) {
                console.log(cleanLine);
              }
            });
          }
        }
      } catch (logError) {
        console.log("Could not fetch detailed logs:", logError.message);
      }

      // Show failed steps
      const failedSteps =
        job.steps?.filter((step) => step.conclusion === "failure") || [];
      if (failedSteps.length > 0) {
        console.log("\n🔴 Failed Steps:");
        for (const step of failedSteps) {
          console.log(`   └─ ${step.name}`);
        }
      }
    }

    console.log("\n" + "═".repeat(50));
    console.log("💡 To see full logs, visit:");
    console.log(`   ${run.html_url}`);
  } catch (error) {
    console.error("Error fetching logs:", error.message);
    if (error.message.includes("401")) {
      console.log("\n❌ Authentication failed. Your token may have expired.");
      console.log(
        "Please create a new token at: https://github.com/settings/tokens",
      );
    }
  }
}

fetchLogs().catch(console.error);
