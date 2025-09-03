# OpenAI + Vercel Integration Guide

## Quick Start Checklist

### ✅ Pre-Deployment Verification
```bash
# 1. Test your OpenAI key locally
node -e "console.log('Key length:', process.env.OPENAI_API_KEY?.length)"

# 2. Verify it's trimmed properly
node -e "console.log('Needs trim:', process.env.OPENAI_API_KEY !== process.env.OPENAI_API_KEY?.trim())"

# 3. Test with OpenAI SDK
npm install openai
node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{role: 'user', content: 'Say OK'}],
  max_tokens: 5
}).then(r => console.log('✅ Key works:', r.choices[0].message.content))
  .catch(e => console.error('❌ Key failed:', e.message));
"
```

## Critical Implementation Rules

### Rule 1: Initialize Inside Handlers
```javascript
// ❌ WRONG - Module-level initialization fails on Vercel
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // This will fail with "Invalid API key" on Vercel
  const response = await openai.chat.completions.create({...});
}
```

```javascript
// ✅ CORRECT - Initialize inside handler
import OpenAI from 'openai';

export default async function handler(req, res) {
  // Initialize here ensures env vars are loaded
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim()
  });
  
  const response = await openai.chat.completions.create({...});
}
```

### Rule 2: Always Trim Keys
```javascript
// OpenAI keys from Vercel may have newlines
const apiKey = process.env.OPENAI_API_KEY?.trim();

// Validate before use
if (!apiKey || !apiKey.startsWith('sk-')) {
  throw new Error('Invalid OpenAI API key configuration');
}
```

### Rule 3: Handle All Error Cases
```javascript
export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      console.error('OpenAI API key not found in environment');
      return res.status(500).json({ 
        error: 'Service configuration error',
        details: 'API key not configured'
      });
    }
    
    const openai = new OpenAI({ apiKey });
    
    // Your OpenAI logic here
    
  } catch (error) {
    if (error.status === 401) {
      console.error('OpenAI authentication failed');
      return res.status(500).json({ 
        error: 'Service authentication error',
        details: 'Invalid API credentials'
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Too many requests, please try again later'
      });
    }
    
    console.error('OpenAI API error:', error);
    return res.status(500).json({ 
      error: 'Service error',
      details: error.message
    });
  }
}
```

## Vercel-Specific Configuration

### Environment Variable Setup

#### Step 1: Add via Vercel Dashboard
1. Go to your project → Settings → Environment Variables
2. Add `OPENAI_API_KEY` with your 164-character key
3. Select all environments initially for testing
4. Save and note the "Added X minutes ago" timestamp

#### Step 2: Force Redeploy
```bash
# Force a new deployment to load new env vars
vercel --prod --force

# Or trigger via dashboard
# Project → Deployments → Three dots → Redeploy
```

#### Step 3: Verify Deployment
```bash
# Check that the env var is available
curl https://your-app.vercel.app/api/test-env

# Should return something like:
# {"hasOpenAI": true, "keyLength": 164, ...}
```

### Singleton Pattern for Efficiency
```javascript
// lib/openai-client.js
import OpenAI from 'openai';

let client = null;

export function getOpenAIClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Validate key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error(`Invalid OpenAI key format: ${apiKey.substring(0, 10)}...`);
    }
    
    // Log key info (not the key itself)
    console.log('Initializing OpenAI client:', {
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 12),
      isProjectKey: apiKey.startsWith('sk-proj-')
    });
    
    client = new OpenAI({ 
      apiKey,
      maxRetries: 3,
      timeout: 30000 // 30 second timeout
    });
  }
  
  return client;
}

// Reset client (useful for testing)
export function resetOpenAIClient() {
  client = null;
}
```

### Usage in API Routes
```javascript
// pages/api/chat.js or app/api/chat/route.js
import { getOpenAIClient } from '@/lib/openai-client';

export default async function handler(req, res) {
  try {
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: req.body.messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return res.status(200).json(completion);
    
  } catch (error) {
    // Client initialization errors
    if (error.message.includes('not configured')) {
      return res.status(500).json({ 
        error: 'Service not configured',
        message: 'OpenAI integration is not properly configured'
      });
    }
    
    // API errors
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'OpenAI API Error',
        message: error.response.data.error.message
      });
    }
    
    // Network errors
    return res.status(500).json({
      error: 'Network Error',
      message: 'Failed to connect to OpenAI services'
    });
  }
}
```

## Debugging Toolkit

### 1. Environment Variable Checker
```javascript
// api/check-env.js
export default function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  
  // Never log the actual key, just metadata
  const diagnostics = {
    // Environment
    nodeVersion: process.version,
    vercelEnv: process.env.VERCEL_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    
    // OpenAI Key
    hasKey: !!key,
    keyLength: key?.length || 0,
    trimmedLength: key?.trim().length || 0,
    needsTrim: key !== key?.trim(),
    startsWithSk: key?.startsWith('sk-') || false,
    isProjectKey: key?.startsWith('sk-proj-') || false,
    
    // Other services (for comparison)
    hasSupabase: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  
  return res.status(200).json(diagnostics);
}
```

### 2. OpenAI Connection Tester
```javascript
// api/test-openai.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  const steps = [];
  
  try {
    // Step 1: Check environment variable
    steps.push({ step: 'env_check', success: !!process.env.OPENAI_API_KEY });
    
    // Step 2: Trim and validate
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    steps.push({ 
      step: 'key_validation', 
      success: !!apiKey && apiKey.startsWith('sk-'),
      keyLength: apiKey?.length 
    });
    
    // Step 3: Initialize client
    const openai = new OpenAI({ apiKey });
    steps.push({ step: 'client_init', success: true });
    
    // Step 4: Make API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with OK' }],
      max_tokens: 5
    });
    
    steps.push({ 
      step: 'api_call', 
      success: true,
      response: completion.choices[0]?.message?.content 
    });
    
    return res.status(200).json({ 
      success: true, 
      steps,
      message: 'OpenAI integration working correctly'
    });
    
  } catch (error) {
    steps.push({ 
      step: 'error', 
      success: false, 
      error: error.message,
      status: error.status 
    });
    
    return res.status(500).json({ 
      success: false, 
      steps,
      error: error.message 
    });
  }
}
```

### 3. Comprehensive Diagnostic Endpoint
```javascript
// api/diagnose.js
export default async function handler(req, res) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: 'Vercel',
      region: process.env.VERCEL_REGION,
      env: process.env.VERCEL_ENV,
      url: process.env.VERCEL_URL,
    },
    checks: {}
  };
  
  // Check 1: OpenAI Key
  const openaiKey = process.env.OPENAI_API_KEY;
  report.checks.openai = {
    hasKey: !!openaiKey,
    keyLength: openaiKey?.length,
    expectedLength: 164,
    lengthValid: openaiKey?.trim().length === 164,
    format: openaiKey?.substring(0, 12) + '...',
    isProjectKey: openaiKey?.startsWith('sk-proj-'),
  };
  
  // Check 2: Supabase Config
  report.checks.supabase = {
    hasUrl: !!process.env.SUPABASE_URL || !!process.env.SUPABASE_SUPABASE_URL,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  
  // Check 3: Test OpenAI Connection
  if (openaiKey) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: openaiKey.trim() });
      
      const test = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Reply OK' }],
        max_tokens: 5
      });
      
      report.checks.openaiConnection = {
        success: true,
        response: test.choices[0]?.message?.content,
        model: test.model,
        usage: test.usage
      };
    } catch (error) {
      report.checks.openaiConnection = {
        success: false,
        error: error.message,
        status: error.status,
        type: error.type
      };
    }
  }
  
  // Generate recommendations
  report.recommendations = [];
  
  if (!report.checks.openai.hasKey) {
    report.recommendations.push('Add OPENAI_API_KEY to Vercel environment variables');
  }
  
  if (report.checks.openai.hasKey && !report.checks.openai.lengthValid) {
    report.recommendations.push('OpenAI key length is incorrect - regenerate key or check for extra characters');
  }
  
  if (report.checks.openaiConnection?.status === 401) {
    report.recommendations.push('OpenAI key is invalid - verify key in OpenAI dashboard');
  }
  
  return res.status(200).json(report);
}
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] Test OpenAI key locally
- [ ] Verify key is 164 characters (project keys)
- [ ] Ensure key is trimmed in code
- [ ] Test all API endpoints locally
- [ ] Check error handling

### Deployment
- [ ] Add OPENAI_API_KEY to Vercel (no VITE_ prefix)
- [ ] Deploy application
- [ ] Wait for deployment to complete

### Post-Deployment
- [ ] Test `/api/diagnose` endpoint
- [ ] Verify OpenAI calls work
- [ ] Check error logs in Vercel dashboard
- [ ] Monitor usage in OpenAI dashboard

### If Issues Occur
1. Check `/api/diagnose` output
2. Verify environment variables in Vercel dashboard
3. Redeploy with `vercel --prod --force`
4. Check Vercel function logs for errors
5. Test with simplified endpoint first

## Common Patterns & Solutions

### Pattern 1: Lazy Initialization
```javascript
let openaiInstance = null;

function getOpenAI() {
  if (!openaiInstance) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new Error('OpenAI not configured');
    openaiInstance = new OpenAI({ apiKey: key });
  }
  return openaiInstance;
}
```

### Pattern 2: Configuration Validation
```javascript
export function validateConfig() {
  const errors = [];
  
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is missing');
  } else if (process.env.OPENAI_API_KEY.trim().length !== 164) {
    errors.push(`OPENAI_API_KEY has wrong length: ${process.env.OPENAI_API_KEY.length}`);
  }
  
  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_SUPABASE_URL) {
    errors.push('Supabase URL is missing');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
```

### Pattern 3: Graceful Degradation
```javascript
export default async function handler(req, res) {
  try {
    const openai = getOpenAIClient();
    // Primary OpenAI logic
  } catch (error) {
    if (error.message.includes('not configured')) {
      // Fallback to basic functionality
      return res.status(200).json({
        message: 'AI features temporarily unavailable',
        fallback: true
      });
    }
    throw error;
  }
}
```

## Key Takeaways

1. **Project keys are 164 characters** - Much longer than legacy keys
2. **Always trim environment variables** - Newlines are common
3. **Initialize inside handlers** - Not at module level for Vercel
4. **Redeploy after env changes** - Changes don't auto-propagate
5. **Use diagnostic endpoints** - Essential for debugging production issues
6. **Handle all error cases** - 401, 429, network errors, etc.
7. **Never expose keys client-side** - No VITE_ prefix
8. **Monitor usage** - Check OpenAI dashboard regularly

## Support Resources

- [Vercel Support](https://vercel.com/support)
- [OpenAI Support](https://help.openai.com/)
- [Status Pages](https://status.openai.com/)
- [Community Forums](https://community.openai.com/)