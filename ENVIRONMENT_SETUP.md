# Environment Configuration Guide

## 🚨 Vercel-Only Deployment

**IMPORTANT:** This project uses **Vercel-only deployment**. Local development is intentionally disabled.

- ✅ All development happens via Vercel preview deployments
- ✅ Push to branch → Get preview URL → Test changes
- ❌ No `npm run dev` or local environment setup needed

## 🔧 Technology Stack

This is a **Vite + React** application deployed on Vercel:

- ✅ **Vite** for build tooling (not Next.js)
- ✅ **React** with TypeScript
- ✅ **Vercel** for hosting and serverless functions
- ✅ **Supabase** for database and auth

## 📋 Environment Variable Structure

### Variable Prefixes

| Purpose     | Prefix  | Access           | Example                     |
| ----------- | ------- | ---------------- | --------------------------- |
| Client-side | `VITE_` | Browser & Server | `VITE_SUPABASE_URL`         |
| Server-side | None    | Server only      | `SUPABASE_SERVICE_ROLE_KEY` |

### Required Variables

#### Client-Side (VITE_ prefix required)
```bash
VITE_SUPABASE_URL           # Supabase project URL
VITE_SUPABASE_ANON_KEY      # Public anonymous key (safe for browser)
```

#### Server-Side (No prefix)
```bash
SUPABASE_URL                # Same value as VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY   # Service role key (secret, bypasses RLS)
OPENAI_API_KEY              # OpenAI API key for AI features
```

## 🛠️ Setup Instructions

### 1. Configure Vercel Environment Variables

#### Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each variable with appropriate environment scope:
   - Production ✅
   - Preview ✅
   - Development ❌ (not needed)

#### Via CLI

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# Add variables (will prompt for values and environments)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
```

### 2. Deploy and Test

```bash
# Create a new branch for your changes
git checkout -b feature/my-feature

# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# Vercel automatically creates a preview deployment
# Check PR comments for the preview URL
```

## 🐛 Common Issues & Solutions

### Issue: "SUPABASE_SERVICE_ROLE_KEY not found"

**Cause:** Variable not set for the correct environment
**Solution:** Ensure the variable is set for both Preview and Production in Vercel

### Issue: "undefined" environment variables in browser

**Cause:** Missing `VITE_` prefix for client-side variables
**Solution:** Client-side variables must use `VITE_` prefix

### Issue: API functions failing

**Cause:** Server-side variables using wrong prefix
**Solution:** Server-side variables should NOT have `VITE_` prefix

## 🔒 Security Best Practices

1. **Never commit credentials** - All secrets stay in Vercel
2. **Use correct prefixes** - `VITE_` only for public values
3. **Service keys are secret** - Never expose `SUPABASE_SERVICE_ROLE_KEY`
4. **Rotate keys regularly** - Update in Vercel dashboard when rotating

## 📚 Variable Reference

### Supabase Configuration

```bash
# Get these from Supabase Dashboard → Settings → API
VITE_SUPABASE_URL="https://[project-id].supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."  # This is safe to expose (has RLS)
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # Keep this secret!
```

### OpenAI Configuration

```bash
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-..."
```

## 🚀 Deployment Workflow

1. **Development**: Push to any branch → Vercel creates preview
2. **Testing**: Use preview URL to test changes
3. **Production**: Merge to main → Automatic production deployment

## 🔍 Troubleshooting

### Check Current Configuration

```bash
# View all Vercel environment variables
vercel env ls

# Check deployment logs
vercel logs [deployment-url]
```

### Quality Checks (Run Locally)

```bash
# These work without environment variables
npm run lint        # Check code style
npm run type-check  # Check TypeScript types
npm run quality     # Run all checks
```

## 📝 Notes

- **No .env files needed** - Everything is in Vercel
- **No localhost testing** - Use preview deployments
- **Automatic HTTPS** - All deployments are secure
- **Environment parity** - Preview matches production configuration