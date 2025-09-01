# Vercel Environment Variables Documentation

## Overview
Environment variables in Vercel are key-value pairs configured outside your source code that can change depending on the Environment. These values are encrypted at rest and visible to any user that has access to the project. It's safe to use both non-sensitive and sensitive data.

## Key Concepts

### Configuration Levels
- **Team-level variables**: Available to all team projects
- **Project-level variables**: Specific to individual projects

### Environments
1. **Production**: Live production deployments
2. **Preview**: Preview deployments from branches
3. **Development**: Local development environment
4. **Custom environments**: User-defined environments

## Size Limitations
- **Total limit**: 64 KB per deployment
- **Edge Functions/Middleware**: 5 KB per variable
- **Supported runtimes**: Node.js, Python, Ruby, Go, and custom runtimes

## How to Add Environment Variables

### Via Dashboard
1. Go to your project dashboard
2. Select the **Settings** tab
3. Navigate to **Environment Variables** section
4. Enter:
   - **Name** (e.g., `API_URL`, `DATABASE_URL`)
   - **Value**
   - Select deployment environment(s)
5. Click **Save**
6. **Important**: Redeploy your project to apply changes

### Via CLI
```bash
# Pull environment variables to local .env file
vercel env pull

# Add a new environment variable
vercel env add

# List environment variables
vercel env ls

# Remove an environment variable
vercel env rm
```

## Accessing Environment Variables in Code

### Node.js / Next.js
```javascript
const apiUrl = process.env.API_URL;
const databaseUrl = process.env.DATABASE_URL;
```

### Python
```python
import os
api_url = os.environ.get('API_URL')
database_url = os.environ.get('DATABASE_URL')
```

### Go
```go
import "os"
apiUrl := os.Getenv("API_URL")
databaseUrl := os.Getenv("DATABASE_URL")
```

### Ruby
```ruby
api_url = ENV['API_URL']
database_url = ENV['DATABASE_URL']
```

## System Environment Variables (Automatically Provided)

Vercel automatically populates these system environment variables:

### Core Variables
- `VERCEL`: Set to `1`, indicates system environment variables are exposed
- `CI`: Set to `1`, indicates a Continuous Integration environment
- `VERCEL_ENV`: Shows deployment environment (`production`, `preview`, `development`)
- `VERCEL_TARGET_ENV`: Shows system or custom environment

### Deployment URLs
- `VERCEL_URL`: Generated deployment URL domain (e.g., `*.vercel.app`)
- `VERCEL_BRANCH_URL`: Git branch deployment URL
- `VERCEL_PROJECT_PRODUCTION_URL`: Project's production domain

### Identifiers
- `VERCEL_REGION`: Region ID where the app is running
- `VERCEL_DEPLOYMENT_ID`: Unique deployment identifier
- `VERCEL_PROJECT_ID`: Unique project identifier

### Git Information
- `VERCEL_GIT_PROVIDER`: Git provider (github, gitlab, bitbucket)
- `VERCEL_GIT_REPO_SLUG`: Repository name
- `VERCEL_GIT_REPO_OWNER`: Repository owner
- `VERCEL_GIT_REPO_ID`: Repository ID
- `VERCEL_GIT_COMMIT_REF`: Git branch or tag
- `VERCEL_GIT_COMMIT_SHA`: Git commit SHA
- `VERCEL_GIT_COMMIT_MESSAGE`: Commit message
- `VERCEL_GIT_COMMIT_AUTHOR_LOGIN`: Commit author username
- `VERCEL_GIT_COMMIT_AUTHOR_NAME`: Commit author name
- `VERCEL_GIT_PREVIOUS_SHA`: Previous commit SHA
- `VERCEL_GIT_PULL_REQUEST_ID`: Pull request ID (if applicable)

### Security & Features
- `VERCEL_SKEW_PROTECTION_ENABLED`: Indicates if Skew Protection is enabled
- `VERCEL_AUTOMATION_BYPASS_SECRET`: Protection Bypass for Automation secret
- `VERCEL_OIDC_TOKEN`: OpenID Connect token for secure connections

## Local Development

### Using .env Files
Create a `.env.local` file in your project root:
```
API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://localhost:5432/mydb
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Using vercel dev
The `vercel dev` command automatically downloads development environment variables:
```bash
vercel dev
```

### Pulling Environment Variables
Pull environment variables from Vercel to create local .env files:
```bash
# Pull development environment variables
vercel env pull .env.local

# Pull production environment variables
vercel env pull .env.production.local --environment=production
```

## Best Practices

### Naming Conventions
- Use UPPERCASE with underscores (e.g., `DATABASE_URL`, `API_KEY`)
- Prefix with service name for clarity (e.g., `SUPABASE_URL`, `STRIPE_SECRET_KEY`)
- Use descriptive names that indicate purpose

### Security
- Environment variables are encrypted at rest
- Use sensitive environment variables for secrets that shouldn't be decrypted
- Never commit `.env` files to version control
- Add `.env*` to `.gitignore`

### Framework-Specific Prefixes
Different frameworks have specific prefixes for client-side exposure:

#### Next.js
- `NEXT_PUBLIC_*`: Exposed to the browser
- Without prefix: Server-side only

Example:
```javascript
// Available in browser and server
const publicUrl = process.env.NEXT_PUBLIC_API_URL;

// Server-side only
const secretKey = process.env.SECRET_API_KEY;
```

#### Vite/Vue
- `VITE_*`: Exposed to the browser

#### Create React App
- `REACT_APP_*`: Exposed to the browser

### Important Notes
1. **Changes require redeployment**: Environment variable changes only apply to new deployments
2. **Build-time vs Runtime**: Some variables are used during build, others during function execution
3. **Environment-specific**: Variables can be set for specific environments (production, preview, development)
4. **Precedence**: Project-level variables override team-level variables

## Common Use Cases

### Database Connection
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### API Keys
```
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...
```

### Service URLs
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Feature Flags
```
ENABLE_BETA_FEATURES=true
DEBUG_MODE=false
```

## Troubleshooting

### Environment Variables Undefined
1. Ensure variables are added to the correct environment
2. Redeploy after adding/changing variables
3. Check variable names match exactly (case-sensitive)
4. For client-side access, ensure proper prefix is used

### Vercel CLI Issues
```bash
# Verify CLI is logged in
vercel whoami

# Check current project link
vercel link

# Force pull latest environment variables
vercel env pull --force
```

### Build vs Runtime
- Build-time variables: Available during `npm run build`
- Runtime variables: Available in serverless functions and API routes

## References
- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Managing Environment Variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Framework Environment Variables](https://vercel.com/docs/environment-variables/framework-environment-variables)