# Environment Variables Guide

## 🎯 Quick Reference

This project uses **Vercel-only deployment** with environment variables managed in Vercel Dashboard.

| File              | Purpose                | Committed to Git? | Notes                    |
| ----------------- | ---------------------- | ----------------- | ------------------------ |
| `.env`            | Not used               | N/A               | Vercel handles all vars  |
| `.env.example`    | Template/Documentation | ✅ YES            | Reference only           |

## 🚀 How to Configure

### Vercel Dashboard (Recommended)

1. Go to your project in [Vercel Dashboard](https://vercel.com)
2. Navigate to Settings → Environment Variables
3. Add each variable from the list below
4. Select environments: Production ✅ and Preview ✅
5. Save and redeploy

### Via CLI

```bash
# Login to Vercel
vercel login

# Add variables interactively
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
```

## ⚠️ Critical Rules

### 1. Variable Prefixes

- `VITE_*` → Available in browser (public)
- No prefix → Server-side only (secret)
- ❌ `NEXT_PUBLIC_*` → Don't use (we're Vite, not Next.js)

### 2. Use Correct Supabase Project

Ensure you're using the correct Supabase project URL and keys from your Supabase Dashboard.

### 3. Environment Scope

Set variables for both:
- Production ✅
- Preview ✅
- Development ❌ (not needed - we don't use local dev)

## 🔑 Required Variables

### Client-Side (Browser Accessible)

```env
# These MUST have VITE_ prefix
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Anonymous key (safe to expose)
```

### Server-Side (API Functions Only)

```env
# These must NOT have VITE_ prefix
SUPABASE_URL=https://[your-project].supabase.co  # Same as VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role key (SECRET!)
OPENAI_API_KEY=sk-proj-...  # OpenAI API key
```

## 🐛 Common Issues

### "SUPABASE_SERVICE_ROLE_KEY not found"

- **Cause**: Variable not set for Preview environment
- **Fix**: Edit variable in Vercel, add Preview environment

### "undefined" in browser console

- **Cause**: Missing `VITE_` prefix for client variables
- **Fix**: Ensure client variables start with `VITE_`

### API functions failing

- **Cause**: Server variables have wrong prefix
- **Fix**: Remove `VITE_` prefix from server-only variables

## 🔍 Debugging

### Check Variable Configuration

```bash
# List all environment variables
vercel env ls

# Pull variables to see what's configured
vercel env pull .env.check
cat .env.check  # Review then delete this file
rm .env.check
```

### Test Deployment

```bash
# Deploy preview to test
vercel

# Deploy to production
vercel --prod
```

## 📝 Important Notes

1. **No local .env files needed** - Everything is in Vercel
2. **No npm run dev** - Use Vercel preview deployments
3. **Changes require redeployment** - Variables don't update live
4. **Vite + React** - This is NOT a Next.js project

## 🔐 Security

- `VITE_*` variables are visible in browser - only use for public data
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Rotate keys regularly in both Supabase and Vercel
- Use Vercel's "Sensitive" flag for secret values

## 📚 Quick Setup for New Developer

1. Clone the repository
2. Install dependencies: `npm install`
3. Get added to Vercel project by admin
4. Create feature branch: `git checkout -b feature/new-feature`
5. Make changes and push
6. Vercel creates preview URL automatically
7. Test on preview URL (no local setup needed!)

## 🚫 What NOT to Do

- ❌ Don't create local .env files
- ❌ Don't run `npm run dev` (it's disabled)
- ❌ Don't commit any secrets
- ❌ Don't use NEXT_PUBLIC_ prefix (wrong framework)
- ❌ Don't test locally - use Vercel previews