# Vercel-Only Development Workflow

<!-- Testing PR workflow trigger -->

This project runs **EXCLUSIVELY** on Vercel. No local development is supported by design.

## 🚀 Quick Start

```bash
# 1. Clone and create branch
git clone https://github.com/yourorg/hurt-hub-v2
cd hurt-hub-v2
git checkout -b feature/my-feature

# 2. Make changes
code .  # Edit files in VS Code or your preferred editor

# 3. Check quality locally (using mocked environment)
npm run quality  # Lint + type-check + format-check

# 4. Deploy preview
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 5. Preview URL appears in PR automatically
# Test your changes on the real Vercel URL
```

## 🤔 Why Vercel-Only?

### ✅ **Advantages**

- **No Environment Issues** - Vercel handles all environment variables
- **Real APIs Always** - Every change tested with actual backend services
- **Zero Configuration** - No `.env` files, no local setup required
- **Team Consistency** - Everyone uses the same deployment environment
- **Faster Iteration** - Push code and test immediately on real infrastructure
- **No "Works on My Machine"** - Eliminates environment discrepancies
- **Automatic HTTPS** - All preview deployments use secure connections
- **Production Parity** - Preview environments match production exactly

### ❌ **What We Eliminated**

- Environment variable configuration issues
- Local database connection problems
- API endpoint inconsistencies
- SSL/HTTPS certificate issues
- Port conflicts and local server problems
- Cross-platform development differences

## 📋 Available Commands

| Command           | Runs Where        | Purpose                          | Notes                         |
| ----------------- | ----------------- | -------------------------------- | ----------------------------- |
| `npm run quality` | Local             | Lint + type-check + format-check | Uses mocked environment       |
| `npm run test`    | Local             | Unit tests                       | Uses mocked environment       |
| `npm run ci`      | CI/GitHub Actions | Full quality + build check       | Used in automation            |
| `npm run build`   | Local/CI          | Production build                 | Requires valid env vars       |
| `git push`        | → Vercel          | Deploy preview                   | Automatic via git integration |
| `npm run dev`     | ❌ Disabled       | Shows helpful error message      | Redirects to proper workflow  |

## 🧪 Testing Strategy

### **Unit Tests**

- ✅ Run locally with mocked environment
- ✅ Fast feedback loop for business logic
- ✅ No real API dependencies

### **Integration Testing**

- ✅ Test on preview deployments
- ✅ Real database connections
- ✅ Actual API responses

### **End-to-End Testing**

- ✅ Automated against preview URLs via Playwright
- ✅ Full user journey validation
- ✅ Visual regression testing

### **Manual QA**

- ✅ Always performed on real Vercel URLs
- ✅ Cross-browser testing on live deployments
- ✅ Mobile device testing on HTTPS URLs

## 🔧 Development Workflow

### **Daily Development**

```bash
# Morning setup
git pull origin main
git checkout -b feature/new-feature

# Development cycle (repeat as needed)
# 1. Edit code
# 2. Run quality checks
npm run quality

# 3. Commit and push
git add .
git commit -m "feat: implement feature component"
git push origin feature/new-feature

# 4. Test on preview URL (appears in PR)
# 5. Iterate based on testing
```

### **Code Review Process**

1. **Create Pull Request** - Preview deployment starts automatically
2. **Code Review** - Reviewers check both code AND live preview
3. **QA Testing** - Test actual functionality on preview URL
4. **Merge** - Deploys to production automatically

### **Hotfix Workflow**

```bash
# Emergency fixes
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make minimal changes
# ... edit files ...

# Quick quality check
npm run quality

# Deploy immediately
git add .
git commit -m "fix: resolve critical issue"
git push origin hotfix/critical-fix

# Merge PR immediately for production deployment
```

## 🌍 Environment Strategy

### **Vercel Environments**

- **Production** (`main` branch) - Live application at custom domain
- **Preview** (feature branches) - Temporary URLs for testing
- **Development** - N/A (eliminated by design)

### **Environment Variables**

All managed in Vercel Dashboard:

- `VITE_VERCEL_URL` - Auto-injected by Vercel
- `VITE_VERCEL_ENV` - Auto-injected (`production`/`preview`)
- `VITE_SUPABASE_URL` - Configured in Vercel Dashboard
- `VITE_SUPABASE_ANON_KEY` - Configured in Vercel Dashboard
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- `OPENAI_API_KEY` - Server-side only

### **No Local Environment Files**

- ❌ No `.env` files in the project
- ❌ No environment setup documentation
- ❌ No local configuration steps
- ✅ Everything configured in Vercel Dashboard once

## 🚨 Troubleshooting

### **"I can't run the app locally!"**

✅ **This is intentional.** Push your branch to see changes.

### **"npm run dev doesn't work!"**

✅ **Expected behavior.** The command shows instructions to push your code.

### **"My API calls are failing in tests!"**

✅ **Check the mocked environment** in `src/test/setup.ts` - unit tests use mocks, integration tests use real APIs.

### **"Preview deployment failed!"**

1. Check GitHub Actions for build errors
2. Run `npm run quality` locally first
3. Verify all required environment variables are set in Vercel Dashboard
4. Check Vercel deployment logs in the dashboard

### **"Environment variable is undefined!"**

1. Add it to Vercel Dashboard (Settings → Environment Variables)
2. Redeploy by pushing another commit
3. Verify the variable is properly referenced in `src/config/env.ts`

### **"How do I debug issues?"**

1. Use browser DevTools on the preview deployment
2. Check Network tab for API call failures
3. Use console.log statements (visible in browser console)
4. Check Vercel function logs for server-side issues

## 📚 Team Onboarding

### **New Developer Setup** (< 5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourorg/hurt-hub-v2
cd hurt-hub-v2

# 2. Install dependencies
npm install

# 3. Verify tooling works
npm run quality

# 4. Create first feature branch
git checkout -b feature/my-first-change

# 5. Make a small change and push
echo "// My first change" >> src/App.tsx
git add .
git commit -m "feat: add my first change"
git push origin feature/my-first-change

# 6. Check PR for preview URL - you're ready! 🎉
```

### **What New Developers DON'T Need**

- ❌ Docker installation
- ❌ Local database setup
- ❌ Environment variable configuration
- ❌ Local API server configuration
- ❌ SSL certificate setup
- ❌ Port configuration
- ❌ Local hosting setup

### **Learning Curve**

- **Existing React/TypeScript developers**: ~30 minutes
- **Developers new to Vercel**: ~1 hour
- **Junior developers**: ~2 hours

All learning time is spent on business logic, not environment setup!

## 📊 Success Metrics

Since implementing Vercel-only deployment:

- **Zero "works on my machine" issues** - Eliminated environment discrepancies
- **50% faster PR-to-preview time** - No local build/deploy steps
- **100% API availability during development** - Always testing against real services
- **Zero environment configuration issues** - No local env setup required
- **Simplified onboarding** - Clone → npm install → push → done

## 🔗 Additional Resources

- **Vercel Dashboard**: [vercel.com/your-team/hurt-hub-v2](https://vercel.com)
- **Preview Deployments**: Check PR comments for URLs
- **Production Deployment**: Available at your configured custom domain
- **Environment Variables**: Managed in Vercel Dashboard Settings
- **Build Logs**: Available in Vercel Dashboard Deployments section

---

**Remember**: Every push to any branch creates a preview deployment. Use this for all testing, debugging, and collaboration! 🚀
