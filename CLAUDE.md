# Claude Code Project Context

## 🚨 CRITICAL REQUIREMENTS

### **NEVER USE FALLBACKS RULE**
**FALLBACKS ARE FORBIDDEN. ALWAYS FAIL FAST AND REPORT ERRORS.**
- ❌ NO `||` operators for environment variables
- ❌ NO empty string fallbacks `|| ''`
- ❌ NO hardcoded fallback values
- ❌ NO localhost fallbacks in production code
- ✅ ALWAYS throw explicit errors when configs are missing
- ✅ ALWAYS validate environment variables on startup

**Example:**
```typescript
// ❌ WRONG - Silent failure
const apiKey = process.env.OPENAI_API_KEY || '';

// ✅ CORRECT - Explicit failure
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is required');
```

### Codebase Navigation & Documentation
**ALWAYS consult `.claude/` directory for comprehensive codebase documentation:**
- **`.claude/PROJECT_OVERVIEW.md`**: Complete architecture overview and tech stack
- **`.claude/API_INDEX.md`**: All API endpoints with request/response formats
- **`.claude/FRONTEND_INDEX.md`**: React components, hooks, and state management
- **`.claude/DATABASE_INDEX.md`**: Database schema, relationships, and queries
- **`.claude/DEVELOPMENT.md`**: Development setup, testing, and deployment guides
- **`.claude/ARCHITECTURE_CICD.md`**: Architecture patterns, CI/CD pipeline, deployment flows
- **`.claude/DOCUMENTATION_MAINTENANCE.md`**: 🆕 Guide for keeping docs updated over time

**Use this documentation to:**
- ✅ **Navigate the codebase**: Find the right files for specific functionality
- ✅ **Assess change locations**: Identify likely places to implement features/fixes
- ✅ **Understand relationships**: See how components, APIs, and data interact
- ✅ **Verify implementations**: Cross-reference with documentation before changes

### Documentation Maintenance
**Keep documentation synchronized with code changes:**
```bash
# Validate that documentation is complete and up-to-date
npm run docs:validate

# Update documentation dates and scan for undocumented changes
npm run docs:update

# Check what was changed recently (helps identify what to document)
git diff --name-only HEAD~1
```

**When making code changes:**
1. **Update relevant `.claude/*.md` files** in the same commit
2. **Run `npm run docs:validate`** before committing to catch missing docs
3. **Ask for help** if unsure what to document - just mention what you changed

**Automated helpers:**
- **Validation script** (`scripts/validate-docs.js`): Checks for undocumented APIs, components, and tables
- **Update script** (`scripts/update-docs.js`): Updates dates and finds new endpoints/components
- **Git hooks**: Remind you to update docs when changing critical files

See `.claude/DOCUMENTATION_MAINTENANCE.md` for the complete maintenance guide.

### API Documentation Reference
**ALWAYS check `api-docs/` folder BEFORE any API-related work:**
- **Vercel**: See `api-docs/vercel-env-vars.md` for environment variables
- **Supabase**: See `api-docs/supabase-config.md` for configuration
- **Troubleshooting**: See `api-docs/troubleshooting-vercel-supabase.md` for common issues
- **Client Reference**: See `api-docs/supabase/javascript-client-reference.md` for API methods

This prevents configuration errors and ensures correct implementation.

## Project Overview
- **Name**: Hurt Hub V2
- **Stack**: Vite + React, TypeScript, Supabase, Vercel
- **Purpose**: Business directory and networking platform

## Key Environment Variables
```bash
# Client-side (MUST have VITE_ prefix for Vite projects)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Server-side only (used in Vercel API functions)
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
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