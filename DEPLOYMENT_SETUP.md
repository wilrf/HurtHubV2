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

### 3. Environment Variables

Create the following environment files locally:

#### `.env.local` (for local development)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

#### `.env.production` (for production)
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_API_URL=https://api.charlotte-econdev.com
```

### 4. Vercel Environment Variables

Set environment variables in Vercel dashboard or via CLI:

```bash
# Set production variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_API_URL production

# Set preview variables
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_ANON_KEY preview
vercel env add VITE_API_URL preview
```

## Deployment Workflows

### Automatic Deployments

1. **Production**: Pushes to `main` branch trigger production deployments
2. **Preview**: Pull requests trigger preview deployments with unique URLs

### Manual Deployments

Use the deployment script:
```bash
npm run deploy
```

Or deploy directly:
```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy:prod
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

1. **Build failures**: Check `npm run build` locally
2. **Type errors**: Run `npm run type-check`
3. **Lint errors**: Run `npm run lint:fix`
4. **Missing environment variables**: Verify all required variables are set in Vercel

### Debug Commands:
```bash
# Test build locally
npm run build

# Check all quality checks
npm run quality

# Pull Vercel environment variables
npm run vercel:env
```

## Security Notes

- Never commit `.env` files to version control
- Rotate tokens regularly
- Use different environment variables for production/staging
- Enable 2FA on GitHub and Vercel accounts