# Architecture, CI/CD & Deployment Patterns - Hurt Hub V2

## 🏗️ System Architecture Overview

### **High-Level Architecture**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Vercel Edge     │────▶│    External     │
│  (React/Vite)   │     │   Functions      │     │    Services     │
│                 │     │   (API Layer)    │     │                 │
│  - Pages        │     │                  │     │  - OpenAI API   │
│  - Components   │     │  - ai-chat       │     │  - Supabase DB  │
│  - Redux Store  │     │  - data-query    │     │                 │
│  - Services     │     │  - health-check  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        ↓                        ↓                         ↓
   [Browser]              [Edge Network]            [Cloud Services]
```

### **Domain-Driven Architecture (Clean Architecture)**

```
┌───────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  React Components  │  Pages  │  Hooks  │  UI Utils  │    │
│  └──────────────────────────────────────────────────────┘    │
│           ↓ Uses (never contains business logic)              │
├───────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │    Use Cases    │    DTOs    │    Mappers    │       │    │
│  │  CreateCompany  │  Request/  │   Entity ↔     │       │    │
│  │  AnalyzeMarket  │  Response  │     DTO        │       │    │
│  └──────────────────────────────────────────────────────┘    │
│           ↓ Orchestrates                                      │
├───────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER (Core Business)               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │   Entities   │  Value Objects  │  Domain Services    │    │
│  │   Company    │      Money      │  ValuationService   │    │
│  │   User       │      Email      │  AcquisitionService │    │
│  │   Investment │    CompanyId     │  AnalyticsService   │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         Repository Interfaces (Contracts)             │    │
│  │  ICompanyRepository  │  IUserRepository  │  etc.      │    │
│  └──────────────────────────────────────────────────────┘    │
│           ↑ Depends on abstractions                           │
├───────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │        Repository Implementations                      │    │
│  │  SupabaseCompanyRepo  │  SupabaseUserRepo  │  etc.    │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         External Service Integrations                  │    │
│  │    OpenAIService   │   EmailService   │   S3Service   │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              API/HTTP Layer (Vercel Functions)         │    │
│  │    Request Handlers  │  Middleware  │  Auth           │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘

                    DEPENDENCY FLOW
                         ↓
    UI → Application → Domain ← Infrastructure
         (inward)              (outward)
```

### **Request Flow with Clean Architecture**

```
1. USER ACTION
   └→ React Component (Presentation)
      └→ useCompanySearch Hook (Presentation)
         └→ SearchCompaniesUseCase (Application)
            ├→ Validates request DTO
            ├→ Calls CompanyRepository.search() (Domain Interface)
            ├→ Applies business rules via CompanyService (Domain)
            ├→ Maps entities to response DTOs
            └→ Returns to UI

2. EXTERNAL API CALL
   └→ API Route Handler (Infrastructure)
      └→ CreateCompanyUseCase (Application)
         ├→ Validates input
         ├→ Creates Company entity (Domain)
         ├→ Saves via ICompanyRepository (Domain Interface)
         │  └→ SupabaseCompanyRepository (Infrastructure)
         ├→ Publishes domain events
         └→ Returns success response
```

---

## 🚀 CI/CD Pipeline

### **Current Deployment Flow**

```yaml
Development Environment: Vercel Preview Deployments (no local dev)
  ↓ git commit
  Feature Branch
  ↓ git push
  GitHub Repository
  ↓ webhook
  Vercel Preview Deploy (automatic)
  ↓ PR merge
  Main Branch
  ↓ webhook
  Vercel Production Deploy (automatic)
```

### **Deployment Triggers**

| Event                  | Action          | Environment | URL Pattern                                         |
| ---------------------- | --------------- | ----------- | --------------------------------------------------- |
| Push to `main`         | Auto-deploy     | Production  | `https://hurt-hub-v2.vercel.app`                    |
| Push to feature branch | Auto-deploy     | Preview     | `https://hurt-hub-v2-[branch]-[project].vercel.app` |
| Manual CLI             | `vercel --prod` | Production  | Same as main                                        |
| Manual CLI             | `vercel`        | Preview     | Unique preview URL                                  |

### **Build Process**

```bash
# Vercel Build Pipeline
1. Install Dependencies     → npm ci
2. Generate Version        → npm run prebuild
3. Build Application       → vite build
4. Optimize Assets         → Automatic by Vite
5. Deploy Edge Functions   → API routes compiled
6. Cache Static Assets     → CDN distribution
```

### **Key Architectural Rules**

1. **Dependency Direction**: Dependencies point inward. Domain never depends on infrastructure.
2. **Business Logic Location**: All business logic in Domain layer services/entities.
3. **Data Access**: Only through Repository interfaces, implemented in Infrastructure.
4. **No Framework Coupling**: Domain layer has zero framework dependencies.
5. **Exception Handling**: Let exceptions bubble to global handlers at system boundaries.

---

## 🔐 Environment Management

### **Critical Pattern: No Fallbacks**

```typescript
// ❌ WRONG - Silent failures with fallbacks
const apiKey = process.env.OPENAI_API_KEY || "";
const dbUrl = process.env.SUPABASE_URL || "";

// ✅ CORRECT - Fail fast with explicit errors
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is required");
```

### **Singleton Pattern for API Clients**

```typescript
// lib/openai-singleton.ts
let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    // Validate format and create client
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}
```

### **🧹 Environment Cleanup (2025-09-02)**

**Major cleanup: 9 files → 3 clean files**

| Before                        | After                  | Status   |
| ----------------------------- | ---------------------- | -------- |
| 9 env files (confusing)       | 3 clean files          | ✅ FIXED |
| Newlines in values (`\n`)     | Clean values           | ✅ FIXED |
| Wrong Supabase projects mixed | Single correct project | ✅ FIXED |
| No .gitignore protection      | Protected env files    | ✅ FIXED |
| Secrets in files              | Templates only         | ✅ FIXED |

### **Environment Variable Hierarchy**

#### **Development Environment** (Vercel Preview)

```bash
# All environment variables managed in Vercel Dashboard
# No local .env files needed
# Preview deployments use same variables as production
# Variables set for both Preview and Production environments
```

#### **Production Environment** (Vercel Dashboard + `.env.production` template)

```bash
# Production Variables (Set in Vercel Dashboard)
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_MOCK_API=false
VITE_SHOW_DEV_TOOLS=false

# Production API Keys (REAL keys in Vercel Dashboard ONLY)
OPENAI_API_KEY=your-real-production-key  # 164 chars for project keys
VITE_SUPABASE_URL=https://osnbklmavnsxpgktdeun.supabase.co  # Correct project
VITE_SUPABASE_ANON_KEY=your-real-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-real-service-key
```

**📁 Template File: `.env.production`**

- Contains placeholders only (no real secrets)
- Used as reference for Vercel Dashboard setup
- Safe to have in codebase (no actual keys)

### **🔒 Environment Variable Security Rules**

#### **Critical Security Fixes**

```bash
# ❌ WRONG - Newlines break parsing in Vercel
VITE_APP_NAME="Charlotte Platform\n"
OPENAI_API_KEY="sk-proj-key\r\n"

# ✅ CORRECT - Clean values, no newlines
VITE_APP_NAME="Charlotte Platform"
OPENAI_API_KEY="sk-proj-key"
```

#### **Variable Prefix Rules**

```typescript
// ✅ CORRECT: Client-side variables with VITE_ prefix
VITE_SUPABASE_URL; // Accessible in browser (public)
VITE_SUPABASE_ANON_KEY; // Accessible in browser (public)

// ✅ CORRECT: Server-side only (no prefix)
OPENAI_API_KEY; // NEVER exposed to client
SUPABASE_SERVICE_ROLE_KEY; // NEVER exposed to client

// ❌ WRONG: Never do this
VITE_OPENAI_API_KEY; // Would expose secret to browser!
```

#### **File Protection**

```bash
# .gitignore now properly protects:
.env                      # Your local secrets
.env.production          # Production template (no real keys)
.env.*                   # All env files
!.env.example           # Except the template
```

### **Vercel Serverless Function Lifecycle**

```
1. Cold Start Phase:
   - Module loading begins
   - Top-level code executes
   - ⚠️ Environment variables MAY NOT be ready

2. Handler Invocation:
   - Request received
   - Handler function called
   - ✅ Environment variables GUARANTEED available

3. Warm Invocations:
   - Reuses existing module scope
   - Cached clients remain initialized
```

### **Key Management Best Practices**

- **OpenAI Project Keys**: 164 characters (new format as of 2024)
- **OpenAI Legacy Keys**: 51 characters (old format)
- **Always Trim Keys**: `process.env.KEY?.trim()` to handle whitespace
- **Validate Format**: Check for `sk-proj-` or `sk-` prefix
- **Use Vercel Dashboard**: More reliable than CLI for setting env vars

---

## 🗄️ Database Architecture

### **Current Database Strategy**

**Current State**: Preview and Production use the SAME database

```
Both environments → https://osnbklmavnsxpgktdeun.supabase.co
```

**Note**: This is acceptable for internal business tools where preview deployments need real data for testing.

### **🎯 RECOMMENDED: Separate Databases**

```yaml
Development:
  URL: https://dev-osnbklmavnsxpgktdeun.supabase.co
  Purpose: Testing, development, experiments
  Data: Sample/test data
  Risk: Can break without affecting users

Production:
  URL: https://osnbklmavnsxpgktdeun.supabase.co
  Purpose: Live user data
  Data: Real business data (299+ companies)
  Risk: Must be protected and stable
```

### **Implementation Steps for Database Separation**

```bash
# 1. Create new Supabase project for development
# 2. Export schema from production
supabase db dump > schema.sql

# 3. Import schema to development
supabase db push --db-url "postgresql://dev-connection-string"

# 4. Update local .env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key

# 5. Keep production variables in Vercel only
```

---

## 📦 Deployment Patterns

### **Feature Development Workflow**

```bash
# 1. Create feature branch
git checkout -b feature/new-ai-enhancement

# 2. Make changes locally (no dev server)
# Edit files in your preferred editor

# 3. Validate before deployment
npm run quality          # Lint + Type-check + Format
npm run test            # Unit tests (if applicable)

# 4. Push for preview deployment
git add .
git commit -m "feat: add new AI enhancement"
git push origin feature/new-ai-enhancement
# → Automatic preview deploy to unique URL

# 5. Test in preview environment
# Visit: https://hurt-hub-v2-feature-new-ai-enhancement.vercel.app
curl https://hurt-hub-v2-feature.vercel.app/api/diagnose  # Check health

# 6. Merge to main for production
git checkout main
git merge feature/new-ai-enhancement
git push origin main
# → Automatic production deployment

# 7. Verify production deployment
curl https://hurt-hub-v2.vercel.app/api/diagnose
```

### **Hotfix Deployment Pattern**

```bash
# 1. Create hotfix from main
git checkout -b hotfix/critical-bug main

# 2. Fix issue
# Make changes...
npm run quality  # Validate code

# 3. Push for preview test (even for hotfix)
git push origin hotfix/critical-bug
# Test on preview URL quickly

# 4. Direct deploy to production (emergency)
vercel --prod --confirm

# 5. Backport to main
# Create PR and merge
```

### **Rollback Pattern**

```bash
# View recent deployments
vercel ls

# Inspect specific deployment
vercel inspect hurt-hub-v2-xxxxx.vercel.app

# Rollback to previous version
vercel rollback hurt-hub-v2-previous.vercel.app

# Or use Vercel Dashboard for visual rollback
```

---

## 🔍 Diagnostic & Validation Tools

### **Pre-Deployment Validation Script**

```bash
# scripts/validate-deployment.cjs
node scripts/validate-deployment.cjs [options]

Options:
  --test-connection    Test live API connections
  --typescript        Run TypeScript compilation check

Checks:
  ✓ OpenAI API key format and length
  ✓ Supabase configuration
  ✓ File structure integrity
  ✓ Environment variable presence
  ✓ Whitespace detection in keys
```

### **Diagnostic Endpoint**

```bash
# Production diagnostics
curl https://hurt-hub-v2.vercel.app/api/diagnose

# Returns comprehensive health report:
- Environment details (Vercel region, Node version)
- OpenAI configuration status
- Supabase connection health
- Active company count
- Actionable recommendations
```

### **OpenAI-Specific Testing**

```bash
# Quick OpenAI test
curl https://hurt-hub-v2.vercel.app/api/test-openai

# Returns:
- Key length and format validation
- Whitespace detection
- Live API test result
```

---

## 🏛️ Code Architecture Patterns

### **Component Architecture**

```typescript
// Presentation Layer (UI Components)
src/components/ui/          → Pure, reusable UI components
src/components/layouts/      → Layout wrappers and shells

// Feature Components
src/components/ai/          → AI-specific components
src/components/search/      → Search functionality

// Container Components (Pages)
src/pages/                  → Route-level components with business logic

// Singleton Services
lib/openai-singleton.ts     → Lazy-loaded OpenAI client
lib/supabase.ts            → Supabase client configuration

// Business Logic Layer
src/hooks/                  → Custom hooks for logic encapsulation
src/services/               → API and external service integration

// State Management
src/store/                  → Redux slices and configuration
src/contexts/               → React Context providers
```

### **API Architecture Pattern**

```typescript
// Standard API Endpoint Structure
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Environment validation (fail fast)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");

  // 2. CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 3. Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 4. Input validation
    const { validated } = validateInput(req.body);

    // 5. Business logic
    const result = await processBusinessLogic(validated);

    // 6. Response
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    // 7. Error handling
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      debug: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
}
```

### **Service Layer Pattern**

```typescript
// Centralized service for business logic
class BusinessDataService {
  private cache: Map<string, any> = new Map();

  async getBusinessData(id: string): Promise<Business> {
    // 1. Check cache
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    // 2. Fetch from database
    const data = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    // 3. Cache result
    this.cache.set(id, data);

    // 4. Return
    return data;
  }
}

// Singleton export
export const businessDataService = new BusinessDataService();
```

---

## 🔄 Development vs Production Differences

### **Configuration Differences**

| Aspect            | Preview (Development)                    | Production                           |
| ----------------- | ---------------------------------------- | ------------------------------------ |
| **API URL**       | `https://[preview-url].vercel.app/api`  | `https://hurt-hub-v2.vercel.app/api` |
| **Debug Mode**    | Enabled (detailed errors)                | Disabled (secure errors)             |
| **Source Maps**   | Included                                 | Excluded                             |
| **Hot Reload**    | N/A (Vercel deployment)                  | N/A                                  |
| **Bundle Size**   | Minified                                 | Minified & compressed                |
| **Caching**       | Moderate CDN caching                     | Aggressive CDN caching               |
| **Error Details** | Detailed messages                        | Generic messages                     |
| **Database**      | Same as production (shared)              | Production data                      |

### **Code Behavior Differences**

```typescript
// Environment-specific behavior
if (process.env.NODE_ENV === "production") {
  // Production-only code
  console.log = () => {}; // Disable console logs
  errorReporting.init(); // Enable error tracking
} else {
  // Development-only code
  window.__REDUX_DEVTOOLS_EXTENSION__ = true;
  import("./devtools").then((dt) => dt.init());
}
```

---

## 📊 Monitoring & Observability

### **Current Monitoring**

```bash
# Vercel Dashboard Metrics
- Deployment status
- Function invocations
- Error rates
- Response times

# Application Logs
vercel logs --prod          # Production logs
vercel logs --preview       # Preview logs

# Health Check Endpoint
curl https://hurt-hub-v2.vercel.app/api/health-check
```

### **Recommended Monitoring Setup**

```typescript
// 1. Structured Logging
console.log(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    service: "ai-chat",
    message: "Processing chat request",
    metadata: { sessionId, messageCount },
  }),
);

// 2. Performance Monitoring
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
console.log(`Operation completed in ${duration}ms`);

// 3. Error Tracking (future)
// Consider Sentry, LogRocket, or Datadog
```

---

## 🚨 Critical Recommendations

### **1. Database Strategy** ✅ ACCEPTABLE

```bash
# Current (Working fine for internal tool)
Preview & Prod → Same Database

# Optional (if data isolation needed)
Preview → dev-supabase-project.supabase.co
Prod → osnbklmavnsxpgktdeun.supabase.co
```

### **2. Environment Variable Validation**

```typescript
// Add to api endpoints and app initialization
function validateEnvironment() {
  const required = ["OPENAI_API_KEY", "SUPABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
```

### **3. Deployment Checklist Automation**

```json
// package.json
{
  "scripts": {
    "predeploy": "npm run quality && npm run test",
    "deploy:safe": "npm run predeploy && vercel --prod"
  }
}
```

### **4. Database Migration Strategy**

```bash
# Use Supabase migrations for schema changes
supabase migration new add_feature
supabase migration up         # Apply to dev
supabase migration up --prod  # Apply to prod after testing
```

---

## 📝 Quick Reference

### **Deployment Commands**

```bash
vercel --prod              # Deploy to production
vercel                     # Deploy preview
vercel ls                  # List deployments
vercel logs --prod         # View production logs
vercel env pull            # Pull env vars locally
vercel rollback [url]      # Rollback deployment
```

### **Development Commands**

```bash
npm run quality            # Run all checks (lint, type-check, format)
npm run build              # Build for production (rarely needed locally)
npm run test               # Run tests
vercel                     # Deploy preview
vercel --prod              # Deploy to production
```

### **Database Commands**

```bash
# Supabase CLI (if installed)
supabase start             # Start local Supabase
supabase db dump          # Export schema
supabase db push          # Apply migrations
supabase db reset         # Reset database
```

---

_Generated: 2025-09-02_
_Last Updated: 2025-09-02_  
_Status: Production deployment active_  
_Critical Issue: Shared database between dev/prod_  
_Recommendation: Implement separate development database immediately_
