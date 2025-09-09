#!/usr/bin/env node
/**
 * Startup Diagnostics Script
 * Runs health checks on API endpoints during development/deployment
 */

import chalk from "chalk";
import fetch from "node-fetch";

// Vercel-only: Environment variables are auto-injected by Vercel
// No local .env files needed or supported

const COLORS = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.gray,
};

// Determine base URL - Vercel-only, no localhost fallback
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Production URL for manual checks
  if (process.env.NODE_ENV === "production") {
    return "https://hurt-hub-v2.vercel.app";
  }

  // During build time, VERCEL_URL might not be available yet
  // Return null to indicate build-time context
  return null;
};

// Wait for server to be ready
const waitForServer = async (url, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        timeout: 2000,
      });
      if (response.ok || response.status === 404) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
};

// Run diagnostic checks
const runDiagnostics = async () => {
  const baseUrl = getBaseUrl();

  // Handle build-time context when VERCEL_URL is not available
  if (baseUrl === null) {
    console.log("\n" + COLORS.info("━".repeat(50)));
    console.log(COLORS.info("🔍 BUILD-TIME DIAGNOSTICS"));
    console.log(COLORS.info("━".repeat(50)));
    console.log(COLORS.dim("Context: Build time (VERCEL_URL not available)"));
    console.log(COLORS.dim("API checks will be performed after deployment"));
    console.log(COLORS.info("━".repeat(50)) + "\n");

    // Only check environment variables during build
    console.log(COLORS.info("📋 Environment Variables (Build Time):"));
    const envChecks = {
      "OpenAI API Key": !!process.env.OPENAI_API_KEY,
      "Supabase URL": !!(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
      ),
      "Supabase Anon Key": !!(
        process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
      ),
      "Supabase Service Key": !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    let hasAllEnvVars = true;
    for (const [name, exists] of Object.entries(envChecks)) {
      const icon = exists ? COLORS.success("✓") : COLORS.error("✗");
      const status = exists
        ? COLORS.success("Present")
        : COLORS.error("Missing");
      console.log(`  ${icon} ${name}: ${status}`);
      if (!exists) hasAllEnvVars = false;
    }

    console.log(
      "\n" + COLORS.info("📡 API health checks skipped (build time)"),
    );
    console.log(COLORS.dim("   API diagnostics will run after deployment"));

    console.log("\n" + COLORS.info("━".repeat(50)));
    console.log(COLORS.success("✨ Build-time diagnostics complete"));
    console.log(COLORS.info("━".repeat(50)) + "\n");
    return;
  }

  const isLocal = baseUrl.includes("localhost");

  console.log("\n" + COLORS.info("━".repeat(50)));
  console.log(COLORS.info("🔍 STARTUP DIAGNOSTICS"));
  console.log(COLORS.info("━".repeat(50)));
  console.log(
    COLORS.dim(`Environment: ${process.env.NODE_ENV || "development"}`),
  );
  console.log(COLORS.dim(`Base URL: ${baseUrl}`));
  console.log(COLORS.info("━".repeat(50)) + "\n");

  // Check environment variables first
  console.log(COLORS.info("📋 Environment Variables:"));
  const envChecks = {
    "OpenAI API Key": !!process.env.OPENAI_API_KEY,
    "Supabase URL": !!(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    ),
    "Supabase Anon Key": !!(
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    ),
    "Supabase Service Key": !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  let hasAllEnvVars = true;
  for (const [name, exists] of Object.entries(envChecks)) {
    const icon = exists ? COLORS.success("✓") : COLORS.error("✗");
    const status = exists ? COLORS.success("Present") : COLORS.error("Missing");
    console.log(`  ${icon} ${name}: ${status}`);
    if (!exists) hasAllEnvVars = false;
  }

  if (!hasAllEnvVars) {
    console.log(
      "\n" +
        COLORS.warning(
          "⚠️  Missing environment variables. Some features may not work.",
        ),
    );
  }

  // Test API endpoints (skip for local dev since Vercel functions don't run locally)
  if (isLocal) {
    console.log(
      "\n" +
        COLORS.dim(
          "📡 API health checks skipped (Vercel functions not available locally)",
        ),
    );
    console.log(
      COLORS.dim("   Run `vercel dev` to test API endpoints locally"),
    );
  } else {
    console.log("\n" + COLORS.info("🌐 API Health Checks:"));

    try {
      // Test comprehensive diagnostics
      const diagResponse = await fetch(`${baseUrl}/api/diagnose`, {
        timeout: 10000,
      });
      const diagData = await diagResponse.json();

      // OpenAI Status
      const openAIStatus = diagData.checks?.openaiConnection?.success;
      const openAIIcon = openAIStatus ? COLORS.success("✓") : COLORS.error("✗");
      const openAIMsg = openAIStatus
        ? COLORS.success("Connected")
        : COLORS.error(diagData.checks?.openaiConnection?.error || "Failed");
      console.log(`  ${openAIIcon} OpenAI API: ${openAIMsg}`);

      if (
        diagData.checks?.openai?.hasKey &&
        !diagData.checks?.openai?.lengthValid
      ) {
        console.log(
          COLORS.warning(
            `    ⚠️  Key length: ${diagData.checks.openai.keyLength} (expected: ${diagData.checks.openai.expectedLength})`,
          ),
        );
      }

      // Supabase Status
      const supabaseStatus = diagData.checks?.supabase?.connection?.success;
      const supabaseIcon = supabaseStatus
        ? COLORS.success("✓")
        : COLORS.error("✗");
      const supabaseMsg = supabaseStatus
        ? COLORS.success(
            `Connected (${diagData.checks.supabase.connection.companyCount} companies)`,
          )
        : COLORS.error(
            diagData.checks?.supabase?.connection?.error || "Failed",
          );
      console.log(`  ${supabaseIcon} Supabase: ${supabaseMsg}`);

      // Overall Status
      console.log("\n" + COLORS.info("📊 Overall Status:"));
      const statusColor =
        diagData.status === "healthy"
          ? COLORS.success
          : diagData.status === "degraded"
            ? COLORS.warning
            : COLORS.error;
      console.log(
        `  System Health: ${statusColor(diagData.status.toUpperCase())}`,
      );

      // Show recommendations if any
      if (diagData.recommendations && diagData.recommendations.length > 0) {
        console.log("\n" + COLORS.info("💡 Recommendations:"));
        diagData.recommendations.forEach((rec) => {
          if (rec.includes("✅")) {
            console.log("  " + COLORS.success(rec));
          } else if (rec.includes("⚠️")) {
            console.log("  " + COLORS.warning(rec));
          } else if (rec.includes("❌")) {
            console.log("  " + COLORS.error(rec));
          } else {
            console.log("  " + rec);
          }
        });
      }
    } catch (error) {
      console.log(COLORS.error("  ✗ API diagnostics failed:"), error.message);
      console.log(COLORS.dim("    (This is normal during build process)"));
    }
  }

  console.log("\n" + COLORS.info("━".repeat(50)));
  console.log(COLORS.success("✨ Startup diagnostics complete"));
  console.log(COLORS.info("━".repeat(50)) + "\n");
};

// Handle different execution modes
const mode = process.argv[2] || "check";

if (mode === "wait") {
  // For dev mode: run in background after delay
  setTimeout(() => {
    runDiagnostics().catch(console.error);
  }, 3000);
} else {
  // For build/deploy: run immediately and exit
  runDiagnostics()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(COLORS.error("Diagnostics failed:"), error);
      process.exit(1);
    });
}
