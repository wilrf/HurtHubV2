# OpenAI API Keys & Environment Management Documentation

## Overview
OpenAI API keys are credentials used to authenticate requests to OpenAI's services. As of 2024-2025, OpenAI has transitioned to project-based API keys with significantly different characteristics than legacy keys.

## Key Formats & Evolution

### Legacy Keys (Pre-2024)
- **Format**: `sk-[48 characters]`
- **Total Length**: 51 characters
- **Example**: `sk-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIj`

### Project Keys (2024-2025)
- **Format**: `sk-proj-[156 characters]`
- **Total Length**: 164 characters
- **Example**: `sk-proj-[very long alphanumeric string with hyphens and underscores]`
- **Encryption**: ~1000 bits (significant security enhancement)

### Key Characteristics
- **Character Set**: Alphanumeric, hyphens, underscores
- **Case Sensitive**: Yes
- **Whitespace Sensitive**: Keys may contain trailing newlines that must be trimmed

## Environment Variable Configuration

### Standard Variable Name
```bash
OPENAI_API_KEY=sk-proj-[your-key-here]
```

### Best Practices

#### 1. Never Hardcode Keys
```javascript
// ❌ WRONG - Never do this
const openai = new OpenAI({
  apiKey: 'sk-proj-AbCdEf...'
});

// ✅ CORRECT - Use environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

#### 2. Always Trim Keys
```javascript
// ✅ Handle potential whitespace/newlines
const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required');
}
```

#### 3. Validate Key Format
```javascript
function validateOpenAIKey(key) {
  const trimmedKey = key.trim();
  
  // Check for new project key format
  if (trimmedKey.startsWith('sk-proj-')) {
    if (trimmedKey.length !== 164) {
      console.warn(`Unexpected project key length: ${trimmedKey.length}`);
    }
    return trimmedKey;
  }
  
  // Check for legacy key format
  if (trimmedKey.startsWith('sk-')) {
    if (trimmedKey.length !== 51) {
      console.warn(`Unexpected legacy key length: ${trimmedKey.length}`);
    }
    return trimmedKey;
  }
  
  throw new Error('Invalid OpenAI API key format');
}
```

## Vercel Deployment Guide

### Adding OpenAI Keys to Vercel

#### Via Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your full 164-character key (including `sk-proj-` prefix)
   - **Environment**: Select appropriate environments (Production, Preview, Development)
4. Click **Save**
5. **IMPORTANT**: Redeploy your application for changes to take effect

#### Via CLI
```bash
# Add OpenAI key to production
echo "sk-proj-your-full-key" | vercel env add OPENAI_API_KEY production

# Add to all environments
echo "sk-proj-your-full-key" | vercel env add OPENAI_API_KEY production preview development

# Verify it was added
vercel env ls

# Remove if needed (to re-add)
vercel env rm OPENAI_API_KEY production
```

### Common Vercel Issues & Solutions

#### Issue 1: Key Gets Doubled/Corrupted
**Symptom**: Key length shows as 165+ characters
**Cause**: Newline character appended during copy/paste
**Solution**:
```javascript
// In your API route
const cleanKey = process.env.OPENAI_API_KEY?.trim();
```

#### Issue 2: Key Not Available in API Routes
**Symptom**: `undefined` when accessing `process.env.OPENAI_API_KEY`
**Cause**: Module-level initialization before env vars are loaded
**Solution**:
```javascript
// ❌ WRONG - Module level
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default function handler(req, res) {
  // use openai
}

// ✅ CORRECT - Inside handler
export default function handler(req, res) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim()
  });
  // use openai
}
```

#### Issue 3: Key Works Locally but Not in Production
**Checklist**:
1. Verify key is added to production environment
2. Ensure deployment happened after adding key
3. Check for typos in variable name
4. Verify no spaces or special characters in variable name
5. Use `vercel env pull` to sync local with production

## Security Best Practices

### 1. Server-Side Only
```javascript
// API Route (pages/api/chat.js or app/api/chat/route.js)
export default async function handler(req, res) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Server-side only
  });
  // Process request
}
```

### 2. Never Expose to Client
```javascript
// ❌ WRONG - Don't prefix with NEXT_PUBLIC_
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-... // This exposes to browser!

// ✅ CORRECT - No prefix for server-only
OPENAI_API_KEY=sk-proj-... // Server-side only
```

### 3. Rate Limiting & Error Handling
```javascript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export default async function handler(req, res) {
  // Rate limiting
  const identifier = req.headers['x-forwarded-for'] || 'anonymous';
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY?.trim()
    });
    // Process request
  } catch (error) {
    // Never expose the actual API key in errors
    console.error('OpenAI API error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message.replace(process.env.OPENAI_API_KEY, '[REDACTED]')
    });
  }
}
```

## Local Development

### Using .env Files
```bash
# .env.local (for local development)
OPENAI_API_KEY=sk-proj-your-full-164-character-key-here

# Add to .gitignore
.env*
!.env.example
```

### .env.example Template
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-[your-key-here]
OPENAI_ORG_ID=org-[optional-org-id]
OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-3.5-turbo
```

### Testing Configuration
```javascript
// test-openai-config.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  console.log('API Key Details:');
  console.log('- Starts with:', apiKey?.substring(0, 12) + '...');
  console.log('- Length:', apiKey?.length);
  console.log('- Has newline:', apiKey !== apiKey?.trim());
  
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    });
    
    console.log('✅ API Key is valid!');
    console.log('Response:', completion.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ API Key validation failed:', error.message);
  }
}

testOpenAIConfig();
```

## Common Integration Patterns

### 1. Initialization Pattern
```javascript
// utils/openai.js
import OpenAI from 'openai';

let openaiClient = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    openaiClient = new OpenAI({
      apiKey,
      maxRetries: 3,
      timeout: 30000, // 30 seconds
    });
  }
  
  return openaiClient;
}
```

### 2. Error Recovery Pattern
```javascript
async function callOpenAIWithRetry(messages, maxRetries = 3) {
  const openai = getOpenAIClient();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      });
      return response;
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Invalid API key - check OPENAI_API_KEY configuration');
      }
      if (error.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### 3. Streaming Response Pattern
```javascript
// app/api/chat/route.js (Next.js App Router)
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export async function POST(req) {
  const { messages } = await req.json();
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim(),
  });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages,
  });
  
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

## Troubleshooting Guide

### Diagnostic Checklist
1. **Key Length**: Verify your key is exactly 164 characters (project keys)
2. **Whitespace**: Check for and trim any trailing newlines or spaces
3. **Environment**: Confirm key is set in the correct environment
4. **Deployment**: Ensure you've redeployed after adding/changing keys
5. **Variable Name**: Verify exact spelling `OPENAI_API_KEY` (case-sensitive)
6. **Initialization Timing**: Ensure key is accessed after environment is loaded

### Debug Helper
```javascript
// api/debug-openai.js (remove in production)
export default function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  
  return res.json({
    hasKey: !!key,
    keyLength: key?.length,
    keyStart: key?.substring(0, 12) + '...',
    hasNewline: key !== key?.trim(),
    trimmedLength: key?.trim().length,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid API key` | Key is malformed or has whitespace | Trim the key: `apiKey.trim()` |
| `API key not found` | Environment variable not set | Add to Vercel and redeploy |
| `Incorrect API key provided` | Wrong key or wrong project | Verify key in OpenAI dashboard |
| `Rate limit exceeded` | Too many requests | Implement rate limiting |
| `Model not found` | Using wrong model name | Use `gpt-4o-mini`, `gpt-4`, etc. |

## Migration Guide (Legacy to Project Keys)

### Step 1: Generate New Project Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new project or select existing
3. Generate new project API key (will be 164 chars)

### Step 2: Update Environment Variables
```bash
# Remove old key
vercel env rm OPENAI_API_KEY production

# Add new project key
echo "sk-proj-your-new-164-char-key" | vercel env add OPENAI_API_KEY production
```

### Step 3: Update Code
```javascript
// Ensure trimming for longer keys
const apiKey = process.env.OPENAI_API_KEY?.trim();

// Optionally add validation
if (!apiKey?.startsWith('sk-')) {
  throw new Error('Invalid OpenAI API key format');
}
```

### Step 4: Test & Deploy
```bash
# Test locally first
npm run dev

# Deploy to production
vercel --prod
```

## Best Practices Summary

1. **Always trim API keys** to handle whitespace
2. **Initialize OpenAI client inside request handlers** for Vercel
3. **Never expose keys to client-side code**
4. **Implement rate limiting** to prevent abuse
5. **Use error boundaries** to catch and handle API failures gracefully
6. **Monitor usage** through OpenAI dashboard
7. **Rotate keys regularly** for security
8. **Use different keys** for development and production

## References
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI API Keys Help](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [OpenAI Node.js Library](https://github.com/openai/openai-node)