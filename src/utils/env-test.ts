// Environment Variables Test Utility
// This tests client-side environment variable access in Vite

export const testEnvironmentVariables = () => {
  console.log("🧪 Client-side Environment Variables Test\n");

  // Test required VITE_ prefixed variables
  const envTests = [
    { name: "VITE_SUPABASE_URL", value: import.meta.env.VITE_SUPABASE_URL },
    {
      name: "VITE_SUPABASE_ANON_KEY",
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    { name: "VITE_APP_ENV", value: import.meta.env.VITE_APP_ENV },
    { name: "VITE_APP_NAME", value: import.meta.env.VITE_APP_NAME },
    { name: "VITE_API_BASE_URL", value: import.meta.env.VITE_API_BASE_URL },
    { name: "VITE_DEBUG_MODE", value: import.meta.env.VITE_DEBUG_MODE },
    { name: "VITE_MOCK_API", value: import.meta.env.VITE_MOCK_API },
  ];

  console.log("📋 Environment Variable Status:");
  let hasErrors = false;

  envTests.forEach(({ name, value }) => {
    const status = value ? "✅" : "❌";
    const displayValue = value || "Missing";
    console.log(`${status} ${name}: ${displayValue}`);

    if (!value) {
      hasErrors = true;
    }
  });

  // Configuration validation
  console.log("\n🔍 Configuration Validation:");

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const appEnv = import.meta.env.VITE_APP_ENV;
  const mockApi = import.meta.env.VITE_MOCK_API;
  const debugMode = import.meta.env.VITE_DEBUG_MODE;

  if (apiUrl?.includes("localhost") && appEnv === "production") {
    console.log("⚠️  WARNING: Production using localhost API");
    hasErrors = true;
  }

  if (mockApi === "true" && appEnv === "production") {
    console.log("⚠️  WARNING: Production has mock API enabled");
    hasErrors = true;
  }

  if (debugMode === "true" && appEnv === "production") {
    console.log("⚠️  WARNING: Production has debug mode enabled");
    hasErrors = true;
  }

  // Test Supabase configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    if (supabaseUrl.includes("your-project-ref")) {
      console.log("📝 Supabase URL is placeholder - needs real credentials");
    } else if (supabaseUrl.includes(".supabase.co")) {
      console.log("✅ Supabase URL format looks correct");
    } else {
      console.log("❌ Supabase URL format invalid");
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log("\n❌ Environment configuration has issues!");
    console.log("👉 Check your .env file and restart the dev server");
  } else {
    console.log("\n✅ Environment configuration looks good!");
  }

  return !hasErrors;
};

// Auto-run test in development
if (import.meta.env.DEV) {
  testEnvironmentVariables();
}
