# Claude Code Project Context

## Critical Requirements

### API Documentation Reference
**ALWAYS check `api-docs/` folder BEFORE any API-related work:**
- **Vercel**: See `api-docs/vercel-env-vars.md` for environment variables
- **Supabase**: See `api-docs/supabase-config.md` for configuration
- **Troubleshooting**: See `api-docs/troubleshooting-vercel-supabase.md` for common issues
- **Client Reference**: See `api-docs/supabase/javascript-client-reference.md` for API methods

This prevents configuration errors and ensures correct implementation.

## Project Overview
- **Name**: Hurt Hub V2
- **Stack**: Next.js, TypeScript, Supabase, Vercel
- **Purpose**: Business directory and networking platform

## Key Environment Variables
```bash
# Client-side (MUST have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Server-side only
SUPABASE_SERVICE_ROLE_KEY
```

## Database Connection (Vercel)
Use IPv4 via Supavisor:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Testing Commands
```bash
npm run lint
npm run typecheck
npm run build
```

## Common Issues & Solutions
1. **Undefined env vars**: Check prefix, redeploy after changes
2. **CORS errors**: Verify https:// in URLs, add domain to Supabase
3. **Auth redirects**: Configure all URL patterns in Supabase Dashboard
4. **Database timeouts**: Use Supavisor URLs for IPv4 on Vercel

## Before Committing
- Run lint and typecheck
- Verify environment variables are not exposed
- Test authentication flows
- Check API endpoints work locally