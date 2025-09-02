// Environment Variables Test Script
// Run with: node test-env-vars.js

console.log('🧪 Environment Variables Test\n');

// Test server-side environment access (Node.js)
console.log('📋 Server-side Environment Variables:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('VERCEL_TOKEN:', process.env.VERCEL_TOKEN ? '✅ Set' : '❌ Missing');

// Test VITE_ prefixed variables (these should be available to both client and server)
console.log('\n🌐 Client-side Environment Variables (VITE_ prefixed):');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_APP_ENV:', process.env.VITE_APP_ENV ? '✅ Set' : '❌ Missing');
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL ? '✅ Set' : '❌ Missing');

// Check for problematic configurations
console.log('\n🔍 Configuration Validation:');
if (process.env.VITE_API_BASE_URL?.includes('localhost') && process.env.VITE_APP_ENV === 'production') {
  console.log('⚠️  WARNING: Production environment using localhost API URL');
}

if (process.env.VITE_MOCK_API === 'true' && process.env.VITE_APP_ENV === 'production') {
  console.log('⚠️  WARNING: Production environment has mock API enabled');
}

if (process.env.VITE_DEBUG_MODE === 'true' && process.env.VITE_APP_ENV === 'production') {
  console.log('⚠️  WARNING: Production environment has debug mode enabled');
}

// Test Supabase URL format
if (process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('your-project-ref')) {
  console.log('✅ Supabase URL format looks correct');
} else if (process.env.VITE_SUPABASE_URL) {
  console.log('📝 Supabase URL is placeholder - needs real project URL');
}

console.log('\n✅ Environment test complete!');
console.log('👉 Next step: Replace placeholder values with real credentials');