# Claude Code Project Context

## 🖥️ OS DETECTION & COMMAND USAGE

**Always check user's OS before running commands:**

- **Windows**: Use PowerShell commands or Windows-native commands
  - `taskkill /F /IM process.exe` (not `pkill`)
  - `Get-Process` (not `ps`)
  - `Select-String` or `findstr` (not `grep`)
  - `Get-ChildItem` or `dir /s` (not `find`)
  - `Get-Content` or `type` (not `cat`)
- **If Unix commands absolutely needed**: Request user switch to Git Bash or WSL
- **Avoid Unix commands on Windows**: They will fail with path/encoding errors

## 🚨 CRITICAL REQUIREMENTS

### 🔍 **CODE REVIEW REQUIREMENT - MANDATORY**

**ALL CODE CHANGES MUST BE REVIEWED BEFORE EXECUTION**

When asked to investigate and change code, you MUST follow this workflow:

1. **INVESTIGATE FIRST**: Analyze the current code, understand the context
2. **PRESENT THE PLAN**: Show exactly what changes you plan to make
3. **EXPLAIN REASONING**: Provide clear explanation for each modification
4. **WAIT FOR APPROVAL**: Get explicit user approval before executing
5. **NEVER SKIP REVIEW**: Do not jump straight into modifying code

**Required Presentation Format:**
```
CURRENT CODE:
[Show the existing code that will be changed]

PROPOSED CHANGES:
[Show the new code with clear indication of what's different]

REASONING:
- Why this change is needed
- What problem it solves
- Potential impacts or side effects
- Alternative approaches considered
```

**Exceptions:**
- Read-only operations (viewing files, searching, analyzing)
- Emergency fixes explicitly marked as "urgent - skip review"
- User explicitly says "just do it" or "implement without review"

**This rule overrides any request to "fix", "update", or "change" code - always show first!**

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
const apiKey = process.env.OPENAI_API_KEY || "";

// ✅ CORRECT - Explicit failure
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is required");
```

### **TESTING TOOL REQUIREMENTS**

**NEVER SUBSTITUTE SPECIFIED TESTING TOOLS.**

- ❌ NO switching from requested testing framework without explicit permission
- ❌ NO "shortcuts" that bypass user-specified tools (e.g., Playwright MCP)
- ❌ NO API-only testing when browser testing was requested
- ✅ PERSIST with requested tool even if setup takes longer
- ✅ DEBUG tool issues rather than switching approaches
- ✅ DELIVER visual evidence (screenshots) when using browser testing tools

**Critical Rule:** When user specifies Playwright, use Playwright MCP specifically. Browser-based testing catches issues that API testing misses.

## 🚨🚨🚨 CRITICAL TESTING RULES - VIOLATION = FAILURE 🚨🚨🚨

### **PLAYWRIGHT IS MANDATORY - NO EXCEPTIONS**

**IF USER REQUESTS PLAYWRIGHT, YOU MUST USE PLAYWRIGHT. PERIOD.**

- ❌ **ABSOLUTELY FORBIDDEN**: Switching to curl, Node.js scripts, PowerShell, or ANY other testing method
- ❌ **ABSOLUTELY FORBIDDEN**: Giving up when Playwright takes time to configure
- ❌ **ABSOLUTELY FORBIDDEN**: Making excuses about ports, timeouts, or setup issues
- ✅ **REQUIRED**: Debug Playwright issues until it works
- ✅ **REQUIRED**: Use `npx playwright test --headed` if needed to see what's happening
- ✅ **REQUIRED**: Kill conflicting processes if ports are blocked
- ✅ **REQUIRED**: Configure Playwright to use the CORRECT port (not assume defaults)

### **WHY THIS MATTERS**

- **API tests DON'T catch browser issues** (like manifest.json parsing errors)
- **Console errors ONLY show in browsers** (Vite import-analysis errors)
- **Screenshots provide evidence** (for debugging and documentation)
- **Browser testing catches REAL user experience issues**

### **CONSEQUENCES OF DISOBEDIENCE**

When you abandon Playwright for "easier" alternatives:

1. You miss critical browser-specific bugs
2. You waste the user's time with incomplete testing
3. You fail to deliver the visual evidence needed
4. You demonstrate unreliability that could cost someone their job

### **THE RULE**

If Playwright is requested → Use Playwright
If Playwright fails → Fix Playwright
If fixing takes time → Keep fixing Playwright
NEVER substitute without explicit permission

### **VERCEL DEPLOYMENT TESTING**

When testing with Playwright:

1. Use Vercel preview deployments (not local development)
2. Update the Playwright test BASE_URL to the Vercel preview URL
3. Pass the deployment URL as an environment variable or argument
4. Test against real deployed services, not mocked environments

**NO EXCUSES. NO SHORTCUTS. NO SUBSTITUTIONS.**

## 🏛️ ARCHITECTURAL PRINCIPLES - NON-NEGOTIABLE

**CRITICAL: These principles are MANDATORY. Violating them will result in code rejection.**

### **Core Principles Summary**

1. **ORM-Only Data Access** - NO direct SQL, NO stored procedures, EVER
2. **Domain-Driven Design** - Business logic in services, NEVER in UI or database
3. **Repository Pattern** - Data access ONLY through repository interfaces
4. **Global Exception Handling** - NO try-catch in business logic, let exceptions bubble up
5. **Clean Architecture** - Strict separation between UI, business, and data layers

### **Quick Reference: RIGHT vs WRONG**

```typescript
// ✅ RIGHT - Using ORM
const companies = await supabase.from('companies').select('*');

// ❌ WRONG - Direct SQL
const companies = await db.query('SELECT * FROM companies');

// ✅ RIGHT - Business logic in service
class CompanyService {
  calculateValuation(company: Company): number { /* logic */ }
}

// ❌ WRONG - Business logic in component
function CompanyCard() {
  const valuation = revenue * 2.5; // NO! Move to service!
}

// ✅ RIGHT - Let exceptions bubble
async function getCompany(id: string) {
  return await repository.findById(id); // Let it throw
}

// ❌ WRONG - Swallowing exceptions
try {
  return await repository.findById(id);
} catch {
  return null; // NEVER hide errors!
}
```

**📖 MANDATORY READING**: See `.claude/ARCHITECTURE_PRINCIPLES.md` for complete details.
**⚠️ PATTERNS GUIDE**: See `.claude/PATTERNS_ANTIPATTERNS.md` for specific examples.

### Codebase Navigation & Documentation

**ALWAYS consult `.claude/` directory for comprehensive codebase documentation:**

- **`.claude/ARCHITECTURE_PRINCIPLES.md`**: 🏛️ Core architectural principles and patterns
- **`.claude/PATTERNS_ANTIPATTERNS.md`**: ⚠️ Specific patterns to follow and avoid
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

- **Canonical Patterns**: See `api-docs/CANONICAL_ENV_VAR_PATTERNS.md` for official environment variable guidance
- **Vercel**: See `api-docs/vercel-env-vars.md` for environment variables
- **Supabase**: See `api-docs/supabase-config.md` for configuration
- **Troubleshooting**: See `api-docs/troubleshooting-vercel-supabase.md` for common issues
- **Client Reference**: See `api-docs/supabase/javascript-client-reference.md` for API methods

This prevents configuration errors and ensures correct implementation.

### 🚨 CRITICAL: External Service Configuration Process

**When working with external APIs or services (Supabase, OpenAI, etc.):**

1. **FIRST**: Fetch and read official documentation from canonical sources
2. **THEN**: Understand the service's environment variable patterns and security model
3. **FINALLY**: Implement configuration following official patterns, not assumptions

**Never make configuration changes without consulting official documentation first.**

## Project Overview

- **Name**: Hurt Hub V2
- **Stack**: Vite + React (NOT Next.js), TypeScript, Supabase, Vercel
- **Purpose**: Business directory and networking platform
- **Development**: Vercel-only (no local dev, use preview deployments)

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
5. **vercel.json rewrite issues**: Catch-all rewrites serve HTML for static assets, breaking Vite import analysis

## 🚀 VERCEL-ONLY DEPLOYMENT STRATEGY

**CRITICAL: This project uses Vercel-only deployment. Local development is intentionally disabled.**

### **Why Vercel-Only?**
- ✅ **No environment variable issues** - Vercel manages all secrets
- ✅ **Real API testing** - Always test with live services
- ✅ **Production parity** - Preview environments match production exactly
- ✅ **Zero configuration** - No local setup required
- ✅ **Team consistency** - Everyone uses the same environment

### **Development Workflow**
1. Edit code locally in your IDE
2. Push to branch for automatic preview deployment
3. Test on Vercel preview URL (auto-generated)
4. Merge to main for production deployment

**Note**: `npm run dev` is disabled and shows: "⚠️ Local dev is unsupported. Push to branch for preview deployment."

## Testing Protocol for Vercel Projects

**STANDARD APPROACH: When testing Vercel projects**

1. **Use Playwright MCP** for browser-based testing (when requested)
2. **Deploy to Vercel preview** for all testing - no local development
3. **Test actual frontend rendering** on deployed URLs, not just API endpoints
4. **Capture screenshots** for visual evidence of issues
5. **Check static assets** (manifest.json, icons) load correctly in browser
6. **Never substitute testing approaches** without explicit user permission

**Testing URLs:**
- Production: `https://hurt-hub-v2.vercel.app`
- Preview: `https://hurt-hub-v2-<branch-hash>.vercel.app`

## Before Committing

- Run lint and typecheck
- Verify environment variables are not exposed
- Push to branch for Vercel preview deployment
- Test authentication flows on preview URL
- Check API endpoints work on preview deployment

## 2025-09-03 Project Status Update

### Semantic Search

- Semantic search infrastructure (vector column, pgvector, `generate-embeddings.ts`) **exists but is not yet enabled**.
- Remaining work: enable pgvector in Supabase, add `embedding vector(1536)` column to `companies`, create `semantic_business_search()` function, run `/api/generate-embeddings` to populate vectors.

### Deployment Strategy

- **Decision:** Vercel-only deployment strategy - NO LOCAL DEVELOPMENT.
- Workflow: edit locally → `git push` → test at preview URL → merge to main for production.
- All environment variables managed in Vercel Dashboard (never in local files).
- Preview deployments for testing, production for live app.
- **Important**: `npm run dev` is intentionally disabled to enforce this workflow.
