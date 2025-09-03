# Supabase Configuration Documentation for Vite + React & Vercel

## Overview
Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, real-time subscriptions, and storage. This guide covers configuration for Vite + React applications deployed on Vercel.

## Environment Variables

### Required Environment Variables
For Vite + React projects, you need these environment variables:

```bash
# Public variables (safe to expose to browser)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-only variables (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:[port]/postgres
```

### Environment Variable Types

#### 1. Public Variables (Browser-Safe)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Anonymous key (safe with Row Level Security)

#### 2. Secret Variables (Server-Only)
- `SUPABASE_SERVICE_ROLE_KEY`: Bypasses Row Level Security - NEVER expose to client
- `SUPABASE_DB_URL`: Direct database connection string

### Default Supabase Edge Function Variables
When using Edge Functions, these are automatically available:
- `SUPABASE_URL`: API gateway for the project
- `SUPABASE_ANON_KEY`: Safe to use in browser with RLS
- `SUPABASE_SERVICE_ROLE_KEY`: Bypasses RLS (server-only)
- `SUPABASE_DB_URL`: Direct Postgres connection URL

## Setting Up Supabase with Vite + React

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Create Environment File
Create `.env` in your project root:
```bash
# Client-side (browser accessible)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (for API routes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Supabase Client

#### Client-Side (React Components)
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

// Client-side configuration - accessible in browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
```

#### Server-Side (API Routes)
Create server client in `api/` functions:
```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side configuration - NOT accessible in browser
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing server Supabase environment variables')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### 4. Using the Clients

#### In React Components
```typescript
import { supabase } from '@/lib/supabase'

function MyComponent() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    // Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
    supabase.from('companies').select('*').then(({ data }) => {
      setData(data || [])
    })
  }, [])
}
```

#### In API Routes
```typescript
// api/companies.ts
import { supabaseAdmin } from './supabase-admin'

export default async function handler(req, res) {
  // Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  const { data } = await supabaseAdmin.from('companies').select('*')
  res.json(data)
}
```

## Vercel Deployment Configuration

### Method 1: Manual Setup
1. Go to Vercel Dashboard → Your Project → Settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
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
vercel env add VITE_SUPABASE_URL

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

### Client-Side Authentication (Vite + React)
Vite + React uses localStorage for session persistence by default:

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, loading }
}
```

### Authentication URLs
Configure in Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://your-domain.vercel.app
Redirect URLs:
- https://your-domain.vercel.app/auth/callback
- https://*.your-project.vercel.app/auth/callback  (for preview deployments)
- http://localhost:3000/auth/callback  (for development)
```

## Local Development

### Setup Local Environment
1. Create `.env` file (not `.env.local` - Vite uses `.env`):
```bash
# Client-side variables
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side variables (for API routes)
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Run development server:
```bash
npm run dev  # Vite automatically loads .env
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
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
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
3. Check correct prefix (`VITE_` for client-side)
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
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=test-anon-key
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
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/installing)
- [Vercel Integration](https://supabase.com/partners/integrations/vercel)
- [Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode.html)
- [TypeScript Support](https://supabase.com/docs/reference/typescript-support)