# Environment Configuration Guide

## 🚨 Critical Security Notice

This project previously had **EXPOSED PRODUCTION CREDENTIALS** committed to git. All sensitive credentials have been replaced with placeholders and proper `.gitignore` rules have been added.

**If you're setting up this project:**
1. ✅ Never commit real credentials
2. ✅ Use the template files (.env.example)  
3. ✅ Set up credentials locally and in production separately

## 🔧 Environment Variable Structure

### Vite vs Next.js Configuration

**IMPORTANT:** This is a **Vite** application, not Next.js. 

- ✅ Use `VITE_` prefixes for client-side variables
- ❌ Don't use `NEXT_PUBLIC_` prefixes (wrong framework)

### Variable Types

| Purpose | Prefix | Access | Example |
|---------|---------|---------|---------|
| Client-side | `VITE_` | Browser & Server | `VITE_SUPABASE_URL` |
| Server-side | None | Server only | `SUPABASE_SERVICE_ROLE_KEY` |

## 🛠️ Setup Instructions

### 1. Development Setup
```bash
# Copy the template
cp .env.example .env

# Edit with your credentials
nano .env

# Test the setup
npm run dev
```

### 2. Production Setup
```bash
# Set in Vercel dashboard or CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
# ... etc
```

## 🐛 Common Issues & Solutions

### Issue 1: "Supabase credentials not found"
**Cause:** Missing `VITE_` prefixed variables
**Solution:** Ensure client-side variables use `VITE_` prefix

```bash
# ❌ Wrong (server-side only)
SUPABASE_URL="https://..."

# ✅ Correct (client-side accessible)  
VITE_SUPABASE_URL="https://..."
```

### Issue 2: AI Chat API errors
**Cause:** Missing or incorrect API keys
**Solution:** Set both server and client keys

```bash
# For server-side API routes
OPENAI_API_KEY="sk-..."

# For client-side components (if needed)
VITE_OPENAI_API_KEY="sk-..."
```

### Issue 3: Production localhost URLs
**Cause:** Development URLs in production environment
**Solution:** Use relative/absolute URLs for production

```bash
# ❌ Wrong in production
VITE_API_BASE_URL="http://localhost:3001/api/v1"

# ✅ Correct for production
VITE_API_BASE_URL="/api/v1"
```

## 🔒 Security Best Practices

1. **Never commit credentials** - Use `.gitignore` and templates
2. **Rotate exposed keys** - If credentials were committed, rotate them immediately
3. **Use environment-specific configs** - Different values for dev/prod
4. **Limit key permissions** - Use anon keys for client-side, service keys only on server
5. **Regular audits** - Check for accidentally committed secrets

## 📋 Environment Variable Reference

### Required Client-Side Variables (VITE_ prefix)
```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
VITE_APP_ENV="development|production"
```

### Required Server-Side Variables  
```bash
OPENAI_API_KEY="sk-..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### Optional Variables
```bash
VITE_DEBUG_MODE="true|false"
VITE_MOCK_API="true|false"  
GITHUB_TOKEN="ghp_..."
```

## 🚀 Testing Configuration

```bash
# Test environment variable access
npm run dev

# Check in browser console:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

# Test API endpoints
curl http://localhost:3005/api/health-check
```

## 🔍 Troubleshooting

If environment variables aren't working:

1. **Check prefix** - Client vars need `VITE_`
2. **Restart dev server** - Changes require restart
3. **Check .env location** - Should be in project root
4. **Verify quotes** - Use quotes for values with spaces
5. **Check deployment** - Production env vars set in Vercel dashboard

## 📚 Related Documentation

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Configuration](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)