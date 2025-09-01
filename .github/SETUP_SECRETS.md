# GitHub Actions Secrets Setup

## Required Secrets for Deployment

Add these secrets to your repository:
**Settings → Secrets and variables → Actions → New repository secret**

### 1. Vercel Secrets

#### VERCEL_TOKEN

```
How to get:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token value
```

#### VERCEL_ORG_ID

```
How to get:
1. Run: vercel whoami
2. Or find in: https://vercel.com/account
3. Look for "Team ID" or "Personal Account ID"
```

#### VERCEL_PROJECT_ID

```
How to get:
1. Run: vercel link (in project directory)
2. Or go to: https://vercel.com/[your-username]/[project-name]/settings
3. Find "Project ID" in settings
```

### 2. Optional Secrets (if using additional services)

#### SUPABASE_SERVICE_KEY

```
For server-side operations:
1. Go to your Supabase project
2. Settings → API
3. Copy "service_role" key (keep this secret!)
```

#### SENTRY_AUTH_TOKEN

```
For error tracking:
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Create new token with project:write scope
```

## Quick Setup Script

Run this in your project directory:

```bash
# Link to Vercel
vercel link

# Get your org and project IDs
vercel project ls

# Create a token at https://vercel.com/account/tokens
# Then add to GitHub secrets
```

## Verify Setup

After adding secrets, trigger a deployment:

1. Push to main branch for production deployment
2. Create a PR for preview deployment

Check Actions tab in GitHub to monitor deployment status.
