# Environment Variables Guide

## 🎯 Quick Reference

We now have **ONLY 3 environment files** (down from 9!):

| File | Purpose | Committed to Git? | Used Where |
|------|---------|------------------|------------|
| `.env` | Local development | ❌ NO | Your machine |
| `.env.production` | Production values | ❌ NO | Vercel deployment |
| `.env.example` | Template/Documentation | ✅ YES | Reference for developers |

## 📁 File Structure

```
hurt-hub-v2/
├── .env                  # Your local dev environment (ignored by git)
├── .env.production       # Production values (ignored by git)
├── .env.example          # Template with documentation (in git)
├── .env-backup/          # Archived old env files (can be deleted)
│   ├── .env.local
│   ├── .env.gpt5.example
│   ├── .env.vercel
│   ├── .env.vercel.production
│   ├── .env.production.example
│   └── .env.version
└── .gitignore           # Ensures .env files aren't committed
```

## 🚀 How to Use

### Local Development

1. Copy `.env.example` to `.env`
2. Fill in your actual values
3. Start dev server: `npm run dev`

```bash
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Production (Vercel)

**Option 1: Vercel Dashboard (Recommended)**
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable from `.env.production`
4. Deploy

**Option 2: Using .env.production file**
1. Copy `.env.example` to `.env.production`
2. Fill in production values
3. Deploy: `vercel --prod`

## ⚠️ Critical Rules

### 1. NO NEWLINES IN VALUES
```bash
# ❌ WRONG - Has newline
VITE_APP_NAME="My App\n"

# ✅ CORRECT - No newline
VITE_APP_NAME="My App"
```

### 2. Use Correct Supabase Project
- **Correct**: `osnbklmavnsxpgktdeun` (299 companies)
- **Wrong**: `vueccqtftltszqropcyk` (old/empty)

### 3. Variable Prefixes
- `VITE_*` → Available in browser (public)
- No prefix → Server-side only (secret)
- `NEXT_PUBLIC_*` → Don't use (we're Vite, not Next.js)

## 🔑 Required Variables

### Minimum for Development
```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
VITE_SUPABASE_URL=https://osnbklmavnsxpgktdeun.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Additional for Production
- All the above PLUS
- Vercel auto-adds: `SUPABASE_SUPABASE_*` variables
- App config: `VITE_APP_ENV=production`

## 🐛 Troubleshooting

### "Environment variable not found"
1. Check spelling (case-sensitive!)
2. Restart dev server after changes
3. Verify no newlines in values

### "Invalid API key"
1. Check for whitespace/newlines
2. Verify key format (sk-proj-... for OpenAI)
3. Ensure using correct Supabase project

### API routes failing on Vercel
1. Check Vercel dashboard for env vars
2. Redeploy after adding variables
3. Test with `/api/diagnose` endpoint

## 🗑️ Cleanup Notes

The following files were archived to `.env-backup/` and can be deleted:
- `.env.local` - Redundant with `.env`
- `.env.gpt5.example` - Outdated
- `.env.vercel` - Had placeholders
- `.env.vercel.production` - Had newlines and wrong URLs
- `.env.production.example` - Redundant
- `.env.version` - Not an env file

## 📝 Maintenance

1. Keep `.env.example` updated with new variables
2. Never commit real keys to git
3. Rotate API keys regularly
4. Use Vercel dashboard for production secrets