# Deployment Setup Guide

## Prerequisites

- GitHub repository
- Vercel account
- Node.js 18+

## Setup Steps

### 1. Vercel Configuration

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Link your project to Vercel:

```bash
vercel link
```

3. Get your Vercel credentials:

```bash
# Get your token
vercel tokens create github-actions

# Get your org ID and project ID
vercel project ls
```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 3. Vercel Environment Variables

**IMPORTANT**: This project uses Vercel-only deployment. No local development is supported.

### 4. Configure Environment Variables

Set environment variables in Vercel dashboard (recommended) or via CLI:

#### Required Variables (Client-side - need VITE_ prefix):
```bash
VITE_SUPABASE_URL           # Supabase project URL
VITE_SUPABASE_ANON_KEY      # Supabase anonymous key
```

#### Required Variables (Server-side - no prefix):
```bash
SUPABASE_URL                # Same as VITE_SUPABASE_URL value
SUPABASE_SERVICE_ROLE_KEY   # Supabase service role key (secret)
OPENAI_API_KEY              # OpenAI API key for AI features
```

#### Set via CLI:
```bash
# Add for both production and preview
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
```

## Deployment Workflows

### Automatic Deployments

1. **Production**: Pushes to `main` branch trigger production deployments
2. **Preview**: Pull requests trigger preview deployments with unique URLs

### Manual Deployments

Deploy directly via Vercel CLI:

```bash
# Preview deployment (for any branch)
vercel

# Production deployment (from main branch)
vercel --prod
```

## Monitoring

### Check deployment status:

```bash
vercel list
```

### View logs:

```bash
vercel logs [deployment-url]
```

### GitHub Actions:

- Check the Actions tab in your GitHub repository
- Monitor workflow runs and deployment status

## Troubleshooting

### Common Issues:

1. **Environment variable errors**: Ensure both VITE_ prefixed (client) and non-prefixed (server) variables are set
2. **Type errors**: Run `npm run type-check`
3. **Lint errors**: Run `npm run lint:fix`
4. **SUPABASE_SERVICE_ROLE_KEY missing**: Make sure it's set for both Preview and Production environments

### Debug Commands:

```bash
# Check all quality checks (lint, type-check, format)
npm run quality

# Fix linting and formatting issues
npm run quality:fix

# Note: Local dev is disabled. Use Vercel preview deployments for testing.
```

## Security Notes

- Never commit `.env` files to version control
- Rotate tokens regularly
- Use different environment variables for production/staging
- Enable 2FA on GitHub and Vercel accounts
