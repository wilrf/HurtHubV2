# Diagnostic API Endpoints

## Overview

These endpoints are for internal diagnostics and debugging. They should NOT be exposed in user-facing UI.

## Endpoints

### 1. `/api/diagnose` - Comprehensive System Diagnostics

Full health check for OpenAI and Supabase configurations.

**Request:**

```bash
curl -s https://hurt-hub-v2.vercel.app/api/diagnose | python -m json.tool
```

**Response includes:**

- OpenAI API key validation (length, format, type)
- OpenAI connection test (actual API call)
- Supabase configuration check
- Database connection test
- Company count from database
- Recommendations for any issues found

**Example response:**

```json
{
  "timestamp": "2025-09-02T...",
  "environment": {
    "platform": "Vercel",
    "nodeVersion": "v20.x"
  },
  "checks": {
    "openai": {
      "hasKey": true,
      "keyLength": 164,
      "expectedLength": 164,
      "lengthValid": true,
      "format": "sk-proj-...",
      "isProjectKey": true
    },
    "openaiConnection": {
      "success": true,
      "response": "OK",
      "model": "gpt-4o-mini"
    },
    "supabase": {
      "hasUrl": true,
      "hasAnonKey": true,
      "hasServiceKey": true,
      "connection": {
        "success": true,
        "companyCount": 299
      }
    }
  },
  "recommendations": [
    "✅ OpenAI API connection successful",
    "✅ Supabase connected (299 companies)"
  ],
  "status": "healthy"
}
```

### 2. `/api/test-openai` - OpenAI Connection Test

Quick test specifically for OpenAI API connectivity.

**Request:**

```bash
curl -s https://hurt-hub-v2.vercel.app/api/test-openai
```

**Response:**

```json
{
  "success": true,
  "response": "OK",
  "keyInfo": {
    "originalLength": 164,
    "trimmedLength": 164,
    "hasNewline": false,
    "startsCorrectly": true
  }
}
```

### 3. `/api/test-env` - Environment Variables Check

Lists which environment variables are present (not their values).

**Request:**

```bash
curl -s https://hurt-hub-v2.vercel.app/api/test-env
```

## Local Testing Script

Save this as `test-diagnostics.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URL (change for production)
BASE_URL="${1:-http://localhost:3000}"

echo "Testing diagnostics at: $BASE_URL"
echo "================================"

# Test comprehensive diagnostics
echo -e "\n${YELLOW}Testing /api/diagnose:${NC}"
response=$(curl -s "$BASE_URL/api/diagnose")
status=$(echo "$response" | python -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null)

if [ "$status" = "healthy" ]; then
    echo -e "${GREEN}✓ System healthy${NC}"
else
    echo -e "${RED}✗ System status: $status${NC}"
fi

# Show recommendations
echo "$response" | python -c "
import sys, json
data = json.load(sys.stdin)
for rec in data.get('recommendations', []):
    print(f'  {rec}')
" 2>/dev/null

# Test OpenAI specifically
echo -e "\n${YELLOW}Testing /api/test-openai:${NC}"
response=$(curl -s "$BASE_URL/api/test-openai")
success=$(echo "$response" | python -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$success" = "True" ]; then
    echo -e "${GREEN}✓ OpenAI API working${NC}"
else
    echo -e "${RED}✗ OpenAI API failed${NC}"
    echo "$response" | python -m json.tool | head -20
fi

# Test environment variables
echo -e "\n${YELLOW}Testing /api/test-env:${NC}"
response=$(curl -s "$BASE_URL/api/test-env")
echo "$response" | python -c "
import sys, json
data = json.load(sys.stdin)
env = data.get('environment', {})
print(f\"  Deployment: {env.get('VERCEL_ENV', 'local')}\")
print(f\"  Has OpenAI: {env.get('hasOpenAI', False)}\")
print(f\"  Has Supabase: {env.get('hasSupabase', False)}\")
" 2>/dev/null
```

## Usage

### Local Development

```bash
# Test all diagnostics locally
curl http://localhost:3000/api/diagnose | jq .

# Quick OpenAI test
curl http://localhost:3000/api/test-openai
```

### Production

```bash
# Test production deployment
curl https://hurt-hub-v2.vercel.app/api/diagnose | jq .

# Use the test script
chmod +x test-diagnostics.sh
./test-diagnostics.sh https://hurt-hub-v2.vercel.app
```

### In Code (Pre-deployment validation)

```javascript
// scripts/validate-deployment.cjs
async function testEndpoints() {
  const baseUrl = process.env.VERCEL_URL || "http://localhost:3000";

  // Test diagnostics
  const diagResponse = await fetch(`${baseUrl}/api/diagnose`);
  const diag = await diagResponse.json();

  if (diag.status !== "healthy") {
    console.error("System unhealthy:", diag.recommendations);
    process.exit(1);
  }

  console.log("✓ All systems operational");
}
```

## Security Notes

⚠️ **NEVER expose these endpoints in user-facing UI**

- They reveal configuration details
- They show system internals
- They're meant for admin/developer use only

✅ **Safe usage:**

- Terminal/CLI testing
- CI/CD pipelines
- Admin dashboards (with auth)
- Development debugging

❌ **Unsafe usage:**

- Public web pages
- Client-side JavaScript calls
- Unauthenticated access in production
