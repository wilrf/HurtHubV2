# Development Guide - Hurt Hub V2

## 🚀 Quick Start

### **Prerequisites**
- **Node.js**: 18.0.0+ (LTS recommended)
- **npm**: 8.0.0+
- **Git**: Latest version
- **Code Editor**: VS Code recommended with TypeScript support

### **Initial Setup**
```bash
# Clone the repository
git clone <repository-url>
cd hurt-hub-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials

# Validate configuration
node scripts/validate-deployment.cjs
node scripts/validate-deployment.cjs --test-connection  # Test API connections

# Start development server
npm run dev
```

**Access the application**:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/*

---

## 🔧 Development Environment

### **Environment Variables Setup**

#### **📁 Clean Environment Structure (2025-09-02 Cleanup)**
We simplified from **9 confusing files → 3 clean files**:

| File | Purpose | Committed? | Contains Real Keys? |
|------|---------|------------|--------------------|
| `.env` | Local development | ❌ NO | ✅ YES (your keys) |
| `.env.production` | Production template | ❌ NO | ❌ NO (placeholders only) |
| `.env.example` | Developer template | ✅ YES | ❌ NO (examples only) |

**📖 See `ENV_GUIDE.md` for complete documentation**

#### **Required Variables** (`.env`)
```bash
# 🤖 OpenAI Configuration (Server-side only)
OPENAI_API_KEY=sk-proj-your-actual-key-here

# 🗄️ Supabase Configuration  
VITE_SUPABASE_URL=https://osnbklmavnsxpgktdeun.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 📊 Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true

# 🛠️ Development Settings
VITE_DEBUG_MODE=true
VITE_MOCK_API=false
VITE_SHOW_DEV_TOOLS=true
```

#### **⚠️ CRITICAL: Environment File Security**
**NO NEWLINES IN VALUES** - They break parsing!
```bash
# ❌ WRONG - Has newline characters
VITE_APP_NAME="My App\n"
OPENAI_API_KEY="sk-proj-key\r\n"

# ✅ CORRECT - Clean values
VITE_APP_NAME="My App"
OPENAI_API_KEY="sk-proj-key"
```

#### **🚨 CRITICAL: No Fallbacks Rule**
**Always fail fast - never use fallback values:**
```typescript
// ❌ WRONG - Silent failure
const apiKey = process.env.OPENAI_API_KEY || '';

// ✅ CORRECT - Explicit failure
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is required');
```

#### **🔄 Singleton Pattern for API Clients**
**Use lazy initialization to avoid serverless timing issues:**
```typescript
// lib/openai-singleton.ts
import { getOpenAIClient } from '../lib/openai-singleton';

// Inside API handler (NOT module level)
export default async function handler(req, res) {
  try {
    const openai = getOpenAIClient();  // Lazy initialization
    // Use openai client...
  } catch (error) {
    // Handle initialization errors
  }
}
```

### **Environment Variable Prefixes**
- **`VITE_`**: Client-side variables (accessible in browser)
- **No prefix**: Server-side only (API endpoints)
- **Security**: Never expose API keys client-side

---

## 📦 Development Commands

### **Core Development**
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally  
npm run preview
```

### **Code Quality**
```bash
# Run ESLint
npm run lint
npm run lint:fix       # Auto-fix issues

# Type checking  
npm run type-check

# Run all quality checks
npm run quality        # Runs lint + type-check + format

# Pre-deployment validation
node scripts/validate-deployment.cjs  # Check env vars and configuration

# Environment setup validation
cp .env.example .env  # Create from template
# Edit .env with your actual values
node scripts/validate-deployment.cjs --test-connection  # Test with real APIs

# Format code with Prettier
npm run format
npm run format:check

# Run all quality checks
npm run quality        # lint + type-check + format:check
npm run quality:fix    # Auto-fix all issues
```

### **Testing**
```bash
# Unit tests with Vitest
npm run test
npm run test:ui        # Visual test runner
npm run test:coverage  # Coverage reports

# End-to-end tests with Playwright
npm run test:e2e
npm run test:e2e:ui    # Interactive test runner
npm run test:e2e:debug # Debug mode
npm run test:e2e:headed # Run with browser UI
```

### **Deployment**
```bash
# Pre-deployment validation
node scripts/validate-deployment.cjs           # Check configuration
node scripts/validate-deployment.cjs --test-connection  # Test APIs
node scripts/validate-deployment.cjs --typescript      # Check types

# Deploy to production
vercel --prod  # Or: npm run deploy:prod

# Deploy preview
vercel         # Or: npm run deploy:preview

# Post-deployment verification
curl https://hurt-hub-v2.vercel.app/api/diagnose  # Check health

# Pull environment variables from Vercel
npm run vercel:env
```

---

## 🏗️ Project Architecture

### **Directory Structure**
```
hurt-hub-v2/
├── api/                     # Vercel Edge Functions
│   ├── ai-chat-simple.ts    # Main AI chat endpoint
│   ├── ai-search.ts         # AI-powered search
│   ├── diagnose.ts          # Comprehensive diagnostics
│   ├── test-openai.ts       # OpenAI configuration test
│   ├── health-check.ts      # System health monitoring  
│   ├── data-query.ts        # Business data queries
│   └── context.ts           # AI conversation context
├── lib/                     # Shared libraries
│   ├── openai-singleton.ts  # OpenAI client singleton
│   └── supabase.ts          # Supabase configuration
├── src/                     # Frontend application
│   ├── components/          # React components
│   │   ├── ai/             # AI chat components
│   │   ├── ui/             # Design system
│   │   └── search/         # Business search
│   ├── pages/              # Route components  
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic
│   ├── store/              # Redux state management
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Utility functions
│   └── config/             # Configuration
├── scripts/                # Build and deployment scripts
│   ├── validate-deployment.cjs  # Pre-deployment validation
│   ├── validate-docs.cjs    # Documentation validation
│   └── update-docs.cjs      # Documentation updates
├── .env                    # Local development (not in git)
├── .env.production         # Production template (not in git) 
├── .env.example           # Template with docs (in git)
├── ENV_GUIDE.md           # Complete environment guide
├── .env-backup/           # Archived old env files (can delete)
├── tests/                  # Test files
├── api-docs/              # API documentation
└── .claude/               # Codebase documentation
```

### **Key Configuration Files**
- **`package.json`**: Dependencies and scripts
- **`vite.config.ts`**: Build configuration
- **`tsconfig.json`**: TypeScript settings
- **`tailwind.config.js`**: Styling configuration
- **`vercel.json`**: Deployment configuration
- **`CLAUDE.md`**: Development guidelines

---

## 🔄 Development Workflow

### **Feature Development Process**
1. **Planning**: Review requirements and create feature branch
2. **Development**: Implement feature with proper typing
3. **Validation**: Run `validate-deployment.cjs` to check configuration
4. **Testing**: Add unit and E2E tests
5. **Quality**: Run linting, type checking, formatting
6. **Documentation**: Update `.claude/*.md` files if needed
7. **Review**: Code review and approval
8. **Deployment**: Deploy to staging, verify with `/api/diagnose`, then production

### **Git Workflow**
```bash
# Create feature branch
git checkout -b feature/ai-chat-improvements

# Make changes and commit
git add .
git commit -m "feat: enhance AI chat with business context"

# Push and create PR
git push origin feature/ai-chat-improvements
# Create pull request via GitHub/GitLab
```

### **Commit Message Convention**
```bash
feat: add new AI chat functionality
fix: resolve environment variable loading issue  
docs: update API documentation
style: format code with Prettier
refactor: optimize database queries
test: add E2E tests for AI chat
chore: update dependencies
```

---

## 🧪 Testing Strategy

### **Unit Testing** (Vitest)
```bash
# Test structure
src/
├── components/
│   └── __tests__/          # Component tests
├── hooks/
│   └── __tests__/          # Hook tests  
├── services/
│   └── __tests__/          # Service tests
└── utils/
    └── __tests__/          # Utility tests
```

**Example Test**:
```typescript
// src/hooks/__tests__/useBusinessAIChat.test.ts
import { renderHook } from '@testing-library/react';
import { useBusinessAIChat } from '../useBusinessAIChat';

describe('useBusinessAIChat', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useBusinessAIChat('business-intelligence')
    );
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
```

### **E2E Testing** (Playwright)
```typescript
// tests/e2e/ai-chat.spec.ts
import { test, expect } from '@playwright/test';

test('AI chat should respond to user messages', async ({ page }) => {
  await page.goto('/business-intelligence');
  
  // Wait for AI chat to load
  await page.waitForSelector('[data-testid="ai-chat"]');
  
  // Send a message
  await page.fill('[data-testid="chat-input"]', 'What are the top companies?');
  await page.click('[data-testid="send-button"]');
  
  // Verify response
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
});
```

---

## 🚀 Deployment Guide

### **Vercel Deployment**

#### **Automatic Deployment**
- **Production**: Deploys on push to `main` branch
- **Preview**: Deploys on push to any branch
- **URL**: https://hurt-hub-v2.vercel.app

#### **Manual Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

#### **Environment Variables in Vercel**
```bash
# Set production environment variables
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Pull environment variables
vercel env pull
```

### **Build Configuration** (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist", 
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

---

## 🔍 Debugging & Troubleshooting

### **Common Development Issues**

#### **1. Environment Variables Not Loading**
```bash
# Check if variables are accessible
node -e "console.log(process.env.OPENAI_API_KEY)"

# Verify .env file location and syntax
cat .env

# Restart development server
npm run dev
```

#### **2. TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf dist

# Reinstall dependencies
npm ci

# Run type checking
npm run type-check
```

#### **3. API Endpoint Issues**
```bash
# Test API endpoints locally
curl http://localhost:3000/api/health-check

# Check API logs in development
npm run dev  # Watch terminal for API logs

# Test AI chat endpoint
node scripts/test-ai-simple.js
```

#### **4. Database Connection Issues**
```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Verify Supabase credentials
# Check Supabase dashboard for correct URLs
```

### **Development Tools**

#### **VS Code Extensions**
- **TypeScript**: Enhanced TypeScript support
- **ESLint**: Real-time linting
- **Prettier**: Code formatting
- **Tailwind IntelliSense**: CSS class suggestions
- **GitLens**: Git integration and history

#### **Browser DevTools**
- **React DevTools**: Component inspection
- **Redux DevTools**: State debugging  
- **Network Tab**: API request monitoring
- **Console**: Error tracking and logging

### **Debugging Techniques**

#### **API Debugging**
```typescript
// Add debug logging to API endpoints
console.log('API Request:', req.body);
console.log('Database Query Result:', data);
console.log('OpenAI Response:', response);
```

#### **Frontend Debugging**
```typescript
// React component debugging
useEffect(() => {
  console.log('Component mounted with props:', props);
}, []);

// Redux state debugging
const state = useSelector((state: RootState) => state);
console.log('Current Redux state:', state);
```

---

## 📚 API Development

### **Creating New API Endpoints**

#### **File Structure**
```typescript
// api/new-endpoint.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30, // seconds
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // API logic here
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### **Environment Variable Access**
```typescript
// ❌ WRONG - Never use fallbacks
const apiKey = process.env.OPENAI_API_KEY || '';

// ✅ CORRECT - Fail fast with explicit errors
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required but not set in environment variables');
}
```

### **API Testing Scripts**
```javascript
// scripts/test-new-endpoint.js
const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/new-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEndpoint();
```

---

## 🎨 UI Development

### **Component Development Patterns**

#### **Component Structure**
```typescript
// src/components/example/ExampleComponent.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

interface ExampleComponentProps {
  title: string;
  variant?: 'default' | 'highlighted';
  onClick?: () => void;
}

export function ExampleComponent({ 
  title, 
  variant = 'default', 
  onClick 
}: ExampleComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={cn(
      'p-4 rounded-lg',
      variant === 'highlighted' && 'bg-sapphire-500',
      isActive && 'border-2 border-sapphire-400'
    )}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onClick}>
        {isActive ? 'Active' : 'Inactive'}
      </Button>
    </div>
  );
}
```

#### **Styling with TailwindCSS**
```scss
// Custom design system colors
.bg-midnight-950    // Primary dark background
.bg-sapphire-400    // Accent color
.text-foreground    // Main text color
.border-border      // Border color

// Glass effect utilities  
.glass              // Translucent glass effect
.backdrop-blur-sm   // Background blur
```

---

## 🔧 Performance Optimization

### **Build Optimization**
```typescript
// vite.config.ts - Bundle splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'], 
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['@headlessui/react', 'framer-motion'],
          charts: ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 512,
  },
});
```

### **Code Splitting**
```typescript
// Lazy loading for pages
const BusinessIntelligence = lazy(() => import('@/pages/BusinessIntelligence'));

// Conditional component loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function ConditionalRender({ showHeavy }: { showHeavy: boolean }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showHeavy && <HeavyComponent />}
    </Suspense>
  );
}
```

### **Database Query Optimization**
```typescript
// Efficient pagination
async function getBusinesses(page: number, limit: number) {
  const { data } = await supabase
    .from('companies')
    .select('*')
    .range(page * limit, (page + 1) * limit - 1)
    .order('revenue', { ascending: false });
  
  return data;
}

// Index-optimized queries
async function searchCompanies(query: string) {
  const { data } = await supabase
    .from('companies') 
    .select('name, industry, revenue')  // Only needed columns
    .textSearch('name', query)          // Use text search index
    .limit(20);                         // Limit results
  
  return data;
}
```

---

## 📋 Development Checklist

### **Before Committing**
- [ ] Run `npm run quality` (lint + type-check + format)
- [ ] Run `npm run test` (unit tests)
- [ ] Test API endpoints manually
- [ ] Verify environment variables work
- [ ] Check browser console for errors
- [ ] Test responsive design
- [ ] Verify AI chat functionality

### **Before Deploying**
- [ ] Run `npm run build` successfully
- [ ] Test production build with `npm run preview`
- [ ] Verify environment variables in Vercel
- [ ] Run E2E tests `npm run test:e2e`
- [ ] Check API health endpoint
- [ ] Verify database connections
- [ ] Monitor deployment logs

### **Code Review Checklist**
- [ ] TypeScript types are properly defined
- [ ] No fallback values used (fail fast principle)
- [ ] Error handling is comprehensive
- [ ] Security best practices followed
- [ ] Performance optimizations applied
- [ ] Tests cover new functionality
- [ ] Documentation updated

---

## 🆘 Getting Help

### **Documentation References**
1. **Project Docs**: Check `.claude/` directory for comprehensive guides
2. **API Docs**: See `api-docs/` for API-specific information  
3. **CLAUDE.md**: Development guidelines and rules
4. **README.md**: Basic project information

### **Common Resources**
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev/guide/
- **TailwindCSS**: https://tailwindcss.com/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### **Debugging Resources**
- **Browser DevTools**: F12 for debugging
- **VS Code Debugger**: Built-in debugging support
- **Network Tab**: Monitor API requests/responses
- **React DevTools**: Component and state inspection

---

*Generated: 2025-09-02*
*Last Updated: 2025-09-02*  
*Development Environment: Node.js 18+ with Vite*  
*Total Scripts: 15+ build and utility scripts*  
*Code Quality: ESLint + Prettier + TypeScript strict mode*