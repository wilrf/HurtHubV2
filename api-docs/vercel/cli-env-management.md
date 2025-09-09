# Vercel CLI Environment Variable Management

## Complete Reference for `vercel env` Command

### Purpose

The `vercel env` command is used to manage Environment Variables of a Project, providing functionality to list, add, remove, and export variables.

## Authentication First

Before using any `vercel env` commands, ensure you're authenticated:

```bash
# Check if logged in
vercel whoami

# Log in if needed
vercel login

# Link to project if needed
vercel link
```

## Core Subcommands

### 1. List Environment Variables

```bash
# List all environment variables
vercel env ls

# List variables for specific environment
vercel env ls production
vercel env ls preview
vercel env ls development

# List variables for specific git branch
vercel env ls --git-branch main
```

### 2. Add Environment Variables

```bash
# Interactive add (will prompt for value and environment)
vercel env add

# Add to specific environment
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development

# Add to all environments
vercel env add VARIABLE_NAME

# Add using file content
vercel env add VARIABLE_NAME < secret.txt

# Add to specific git branch
vercel env add VARIABLE_NAME --git-branch feature-branch
```

**Interactive Flow Example:**

```bash
$ vercel env add
? What's the name of the variable? OPENAI_API_KEY
? What's the value of OPENAI_API_KEY? [hidden]
? Add OPENAI_API_KEY to which Environments (select multiple)?
  ◉ Production
  ◯ Preview
  ◯ Development
```

### 3. Remove Environment Variables

```bash
# Remove from specific environment
vercel env rm VARIABLE_NAME production
vercel env rm VARIABLE_NAME preview
vercel env rm VARIABLE_NAME development

# Interactive removal (will prompt for environment)
vercel env rm VARIABLE_NAME

# Skip confirmation prompt
vercel env rm VARIABLE_NAME production --yes
```

### 4. Pull Environment Variables

```bash
# Pull development environment variables to .env.local
vercel env pull

# Pull to specific file
vercel env pull .env.production

# Pull production environment variables
vercel env pull .env.production --environment=production

# Pull preview environment variables
vercel env pull .env.preview --environment=preview

# Pull for specific git branch
vercel env pull --git-branch feature-branch

# Force overwrite existing file
vercel env pull --yes
```

## Command Options

### Global Options

- `--cwd <path>`: Change working directory
- `--debug`: Enable debug mode
- `--scope <team>`: Set context to team
- `--token <token>`: Login token for CI/CD
- `--yes`: Skip confirmation prompts

### Environment-Specific Options

- `--environment <env>`: Target specific environment (production, preview, development)
- `--git-branch <branch>`: Target specific git branch

## Best Practices

### 1. Secure Handling

```bash
# For sensitive values, use file input to avoid command history
echo "sk-1234567890" > temp_key.txt
vercel env add OPENAI_API_KEY production < temp_key.txt
rm temp_key.txt
```

### 2. Environment Strategy

```bash
# Different values for different environments
vercel env add DATABASE_URL production  # Production DB
vercel env add DATABASE_URL preview     # Staging DB
vercel env add DATABASE_URL development # Local/dev DB
```

### 3. Team Workflow

```bash
# Pull latest environment variables for development
vercel env pull .env.local --environment=development

# Ensure local .env.local is in .gitignore
echo ".env.local" >> .gitignore
```

### 4. CI/CD Integration

```bash
# Use token for automated deployments
vercel env add SECRET_KEY production --token $VERCEL_TOKEN --yes
```

## Common Patterns

### Initial Project Setup

```bash
# 1. Link to project
vercel link

# 2. Pull development environment
vercel env pull .env.local

# 3. Start development
vercel dev
```

### Production Deployment Setup

```bash
# Add all required production environment variables
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production

# Trigger deployment
vercel --prod
```

### Debugging Environment Issues

```bash
# List all environment variables to verify
vercel env ls

# Check specific environment
vercel env ls production

# Pull and compare environments
vercel env pull .env.production --environment=production
vercel env pull .env.preview --environment=preview
```

## Important Notes

1. **Redeployment Required**: Changes to environment variables require redeployment to take effect
2. **Case Sensitive**: Variable names are case-sensitive
3. **Size Limits**: 64 KB total per deployment, 5 KB per variable for Edge Functions
4. **Encryption**: All environment variables are encrypted at rest
5. **Visibility**: Variables are visible to users with project access

## Error Handling

### Common Issues

```bash
# Variable already exists
Error: A variable with the name `VARIABLE_NAME` already exists

# Solution: Remove first, then add
vercel env rm VARIABLE_NAME production --yes
vercel env add VARIABLE_NAME production
```

### Authentication Issues

```bash
# Not logged in
Error: Not authenticated

# Solution: Login first
vercel login
vercel link  # If needed
```

### Project Not Linked

```bash
# No project found
Error: No project linked

# Solution: Link to project
vercel link
```

## Reference Links

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Environment Variables Overview](https://vercel.com/docs/environment-variables)
- [Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
