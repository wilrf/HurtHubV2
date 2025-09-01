# Supabase Configuration Documentation for Next.js & Vercel

## Overview
Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, real-time subscriptions, and storage. This guide covers configuration for Next.js applications deployed on Vercel.

## Environment Variables

### Required Environment Variables
For Next.js projects, you need these environment variables:

```bash
# Public variables (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Server-only variables (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:[port]/postgres
```

### Environment Variable Types

#### 1. Public Variables (Browser-Safe)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Anonymous key (safe with Row Level Security)

#### 2. Secret Variables (Server-Only)
- `SUPABASE_SERVICE_ROLE_KEY`: Bypasses Row Level Security - NEVER expose to client
- `SUPABASE_DB_URL`: Direct database connection string

### Default Supabase Edge Function Variables
When using Edge Functions, these are automatically available:
- `SUPABASE_URL`: API gateway for the project
- `SUPABASE_PUBLISHABLE_KEY`: Safe to use in browser with RLS
- `SUPABASE_SERVICE_ROLE_KEY`: Bypasses RLS (server-only)
- `SUPABASE_DB_URL`: Direct Postgres connection URL

## Setting Up Supabase with Next.js

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Create Environment File
Create `.env.local` in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Supabase Client

#### Server Client (App Router)
Create `utils/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting in Server Components
          }
        },
      },
    }
  )
}
```

#### Client Component
Create `utils/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

## Vercel Deployment Configuration

### Method 1: Manual Setup
1. Go to Vercel Dashboard → Your Project → Settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
4. Select environments (Production, Preview, Development)
5. Save and redeploy

### Method 2: Vercel Integration (Recommended)
1. Go to Vercel Dashboard → Settings → Integrations
2. Click "Browse Marketplace"
3. Search for "Supabase" and click the integration
4. Click "Add Integration"
5. Follow the connection flow

Benefits of Integration:
- Automatic environment variable sync
- Updates Auth Redirect URIs automatically
- Manages secrets securely
- Syncs with preview deployments

### Method 3: Using Vercel CLI
```bash
# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Add new environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL

# List environment variables
vercel env ls
```

## Database Connection Configuration

### Important: IPv4 vs IPv6
Vercel does not support IPv6. Supabase has updated to use Supavisor for IPv4 support:

```bash
# Updated environment variables for Vercel
POSTGRES_URL=postgresql://[user]:[password]@[supavisor-host]:6543/postgres
POSTGRES_PRISMA_URL=postgresql://[user]:[password]@[supavisor-host]:6543/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://[user]:[password]@[supavisor-host]:5432/postgres
```

### Connection Pooling
- **Transaction mode**: Default for most use cases
- **Session mode**: For migrations and prepared statements
- **Direct connection**: For administrative tasks

## Authentication Setup

### Cookie-Based Auth (App Router)
The Next.js App Router requires cookie-based authentication:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}
```

### Redirect URLs
Configure in Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://your-domain.vercel.app
Redirect URLs:
- https://your-domain.vercel.app/**
- https://*.your-project.vercel.app/**  (for preview deployments)
```

## Local Development

### Setup Local Environment
1. Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Use Vercel CLI to sync:
```bash
vercel env pull .env.local
```

3. Run development server:
```bash
npm run dev
# or
vercel dev  # Automatically loads environment variables
```

### Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Start local development
supabase start

# Local environment variables
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-anon-key
```

## Security Best Practices

### 1. Never Expose Service Role Key
```javascript
// ❌ WRONG - Never do this in client code
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ CORRECT - Use anon key for client
const supabase = createClient(url, PUBLISHABLE_KEY)
```

### 2. Use Row Level Security (RLS)
Always enable RLS on your tables:
```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON your_table
  FOR SELECT USING (auth.uid() = user_id);
```

### 3. Environment Variable Security
- Add `.env*` to `.gitignore`
- Never commit `.env` files
- Use different keys for different environments
- Rotate keys regularly

### 4. Validate on Server
Always validate sensitive operations server-side:
```typescript
// app/api/protected/route.ts
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Perform protected operation
}
```

## Common Issues & Solutions

### Issue: Environment Variables Undefined
**Solution:**
1. Verify variable names match exactly (case-sensitive)
2. Redeploy after adding/changing variables
3. Check correct prefix (`NEXT_PUBLIC_` for client-side)
4. Ensure `.env.local` is in project root

### Issue: Authentication Not Working in Production
**Solution:**
1. Check redirect URLs in Supabase Dashboard
2. Verify site URL is set correctly
3. Ensure cookies are properly configured
4. Check middleware is processing auth cookies

### Issue: Database Connection Errors
**Solution:**
1. Use Supavisor URLs for Vercel (IPv4)
2. Check connection pooling mode
3. Verify database password is correct
4. Ensure SSL mode is enabled

### Issue: CORS Errors
**Solution:**
1. Add your domain to allowed origins in Supabase
2. Check API URL is correct
3. Ensure using correct keys

## TypeScript Configuration

### Generate Types
```bash
# Generate TypeScript types from your database
npx supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

### Use Types in Client
```typescript
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/supabase'

export async function createTypedClient() {
  return createClient<Database>()
}
```

## Testing

### Environment Setup for Tests
Create `.env.test`:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

### Mock Supabase Client
```typescript
// __mocks__/supabase.ts
export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  },
}))
```

## Monitoring & Debugging

### Enable Debug Mode
```typescript
const supabase = createClient(url, key, {
  auth: {
    debug: process.env.NODE_ENV === 'development',
  },
})
```

### Check Connection Status
```typescript
const { data, error } = await supabase.auth.getSession()
if (error) console.error('Auth error:', error)
```

### View Logs
- Supabase Dashboard → Logs
- Check Function logs
- Monitor Database logs
- Review Auth logs

## References
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel Integration](https://supabase.com/partners/integrations/vercel)
- [Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [TypeScript Support](https://supabase.com/docs/reference/typescript-support)