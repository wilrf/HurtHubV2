# Vercel & Supabase Configuration Troubleshooting Guide

## Common Configuration Issues & Solutions

### 1. Environment Variable Issues

#### Problem: Environment variables undefined in production
**Symptoms:**
- `process.env.NEXT_PUBLIC_SUPABASE_URL` returns `undefined`
- API calls fail with "URL not configured" errors
- Works locally but not on Vercel

**Solutions:**
```bash
# 1. Verify exact variable names (case-sensitive!)
NEXT_PUBLIC_SUPABASE_URL       # ✅ Correct
NEXT_PUBLIC_SUPABASE_URL       # ❌ Wrong (trailing space)
next_public_supabase_url       # ❌ Wrong (lowercase)

# 2. Check Vercel Dashboard
# Go to: Project → Settings → Environment Variables
# Ensure variables are set for correct environments:
# - Production ✓
# - Preview ✓
# - Development ✓

# 3. Force redeploy after adding variables
vercel --prod --force

# 4. Verify in build logs
# Look for: "Loaded env from..."
```

#### Problem: Client-side variables not accessible
**Symptoms:**
- Variables work in API routes but not in components
- `undefined` in browser console

**Solutions:**
```javascript
// ❌ WRONG - Won't be exposed to browser
SUPABASE_URL=https://xxx.supabase.co

// ✅ CORRECT - NEXT_PUBLIC_ prefix required for client
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

// In component:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL) // Works!
```

### 2. Supabase Connection Issues

#### Problem: "Invalid API key" error
**Symptoms:**
- 401 Unauthorized responses
- "JWT expired" errors

**Check these keys:**
```bash
# 1. Verify you're using the correct key type
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ... # For client (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # For server only

# 2. Check key hasn't been regenerated
# Go to: Supabase Dashboard → Settings → API → Project API keys

# 3. Decode JWT to check expiry (use jwt.io)
# Anon keys don't expire, service keys might
```

#### Problem: CORS errors
**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Requests blocked in browser

**Solutions:**
```javascript
// 1. Check URL format
// ❌ WRONG
NEXT_PUBLIC_SUPABASE_URL=xxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=http://xxx.supabase.co

// ✅ CORRECT - Must include https://
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

// 2. Add domain to Supabase allowed origins
// Supabase Dashboard → Authentication → URL Configuration
// Add: https://your-app.vercel.app
```

### 3. Database Connection Issues

#### Problem: "Connection refused" or timeout errors
**Symptoms:**
- Direct database connections fail
- Prisma/Drizzle can't connect

**Solutions:**
```bash
# 1. Use correct connection strings for Vercel (IPv4 via Supavisor)
# ❌ OLD (IPv6 - doesn't work on Vercel)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# ✅ NEW (IPv4 via Supavisor)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# 2. For Prisma, use transaction mode
POSTGRES_PRISMA_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# 3. For migrations, use session mode
POSTGRES_URL_NON_POOLING=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 4. Authentication Issues

#### Problem: Auth redirects not working
**Symptoms:**
- OAuth callbacks fail
- Magic link redirects to wrong URL
- "Redirect URL not allowed" error

**Solutions:**
```javascript
// 1. Configure redirect URLs in Supabase
// Dashboard → Authentication → URL Configuration
// Add ALL these patterns:
/*
https://your-app.vercel.app/**
https://*.your-project.vercel.app/** (for preview deployments)
http://localhost:3000/**
*/

// 2. Use dynamic redirect URLs
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set in Vercel
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000/'
  
  // Include https:// for production
  url = url.includes('http') ? url : `https://${url}`
  // Include trailing /
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

// 3. In auth calls
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${getURL()}auth/callback`
  }
})
```

#### Problem: Sessions not persisting
**Symptoms:**
- User logged out on page refresh
- Auth state lost between pages

**Solutions:**
```typescript
// 1. Ensure middleware is processing cookies
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 5. Build & Deployment Issues

#### Problem: Build fails with "Module not found"
**Solutions:**
```bash
# 1. Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Check imports are correct
# ❌ WRONG
import { createClient } from 'supabase'
import { createClient } from '@supabase/supabase'

# ✅ CORRECT
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

# 3. Ensure packages are in dependencies, not devDependencies
npm install --save @supabase/supabase-js @supabase/ssr
```

#### Problem: "Environment variable not found" during build
**Solutions:**
```javascript
// 1. For build-time variables, use fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Better:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

// 2. Check build command includes env loading
// package.json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "next build" // Vercel uses this
  }
}
```

### 6. Local Development Issues

#### Problem: Environment variables not loading locally
**Solutions:**
```bash
# 1. File naming matters!
.env              # ❌ Loaded by Vercel CLI but not Next.js
.env.local        # ✅ Loaded by Next.js (git ignored by default)
.env.development  # ✅ Loaded in dev mode

# 2. Load order (last wins):
# .env
# .env.local
# .env.development
# .env.development.local

# 3. Sync from Vercel
vercel env pull .env.local

# 4. Debug loading
console.log('ENV:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
})
```

### 7. Type Safety Issues

#### Problem: TypeScript errors with Supabase types
**Solutions:**
```bash
# 1. Generate fresh types
npx supabase gen types typescript --project-id [ref] > types/database.ts

# 2. Use types correctly
import { Database } from '@/types/database'

const supabase = createClient<Database>(url, key)

# 3. Handle nullable fields
type User = Database['public']['Tables']['users']['Row']
// Check nullable fields in your schema
```

## Quick Debugging Checklist

### 1. Verify Environment Variables
```javascript
// Add to app/api/debug/route.ts (REMOVE IN PRODUCTION!)
export async function GET() {
  return Response.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    urlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  })
}
```

### 2. Test Supabase Connection
```javascript
// app/api/test-supabase/route.ts
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('_test_').select().limit(1)
    
    return Response.json({
      connected: !error || error.code === '42P01', // Table doesn't exist is OK
      error: error?.message,
    })
  } catch (e) {
    return Response.json({ connected: false, error: String(e) })
  }
}
```

### 3. Check Auth State
```javascript
// app/api/auth-check/route.ts
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return Response.json({
    authenticated: !!user,
    userId: user?.id,
    error: error?.message,
  })
}
```

## Vercel-Specific Settings

### Required Vercel Environment Variables
```bash
# Automatically set by Vercel
VERCEL_URL                    # Your deployment URL
VERCEL_ENV                    # "production", "preview", or "development"

# You must set these
NEXT_PUBLIC_SUPABASE_URL      # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # Anon/public key
SUPABASE_SERVICE_ROLE_KEY     # Service role key (server-only)

# Optional but recommended
NEXT_PUBLIC_SITE_URL          # Your production domain
```

### Vercel Project Settings
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"], // Match your Supabase region if possible
  "functions": {
    "app/api/*": {
      "maxDuration": 10
    }
  }
}
```

## Emergency Fixes

### Force Clear Vercel Cache
```bash
# Method 1: CLI
vercel --prod --force

# Method 2: Dashboard
# Settings → Data Cache → Purge Everything

# Method 3: Change build command temporarily
# "build": "node -v && next build"
# Then change back
```

### Reset All Environment Variables
```bash
# 1. Export current vars
vercel env pull .env.backup

# 2. Remove all in dashboard
# Settings → Environment Variables → Remove all

# 3. Re-add from backup
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... repeat for each

# 4. Force redeploy
vercel --prod --force
```

### Switch to Direct API Calls (Emergency)
```javascript
// If client won't work, use fetch directly
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users`,
  {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
  }
)
const data = await response.json()
```

## Getting Help

### Information to Provide
When asking for help, include:
1. Environment variable names (not values!)
2. Error messages (full stack trace)
3. Network tab screenshots
4. Build logs from Vercel
5. Package versions:
```bash
npm list @supabase/supabase-js @supabase/ssr next react
```

### Useful Commands
```bash
# Check Vercel deployment
vercel inspect [deployment-url]

# Check environment variables (without values)
vercel env ls

# Test locally with Vercel environment
vercel dev

# Check Supabase service health
curl https://[project-ref].supabase.co/rest/v1/
```