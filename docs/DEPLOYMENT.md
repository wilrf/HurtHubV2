# Deployment Guide - Charlotte Economic Development Platform

## Quick Start Deployment Steps

### 1. Set Up Supabase (Database)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project (choose closest region to Charlotte)

2. **Configure Database**
   - Once project is created, go to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Click "Run" to create all tables and sample data

3. **Get Your API Keys**
   - Go to Settings → API
   - Copy these values:
     - `Project URL` → VITE_SUPABASE_URL
     - `anon public` key → VITE_SUPABASE_ANON_KEY  
     - `service_role` key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

### 2. Configure Environment Variables

1. **Update `.env` file locally** with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Add to Vercel Environment Variables**:
   ```bash
   # Using Vercel CLI
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add OPENAI_API_KEY
   ```

### 3. Deploy to Vercel

1. **Initial Setup** (if not done):
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   # Preview deployment
   vercel
   
   # Production deployment
   vercel --prod
   ```

### 4. Verify Deployment

After deployment, test these endpoints:
- Homepage: `https://your-app.vercel.app`
- Companies API: `https://your-app.vercel.app/api/companies`
- AI Chat: `https://your-app.vercel.app/api/ai-chat-enhanced`

## Environment Variables Reference

### Required for Production

```env
# Supabase (Database)
VITE_SUPABASE_URL="https://xxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# OpenAI (AI Features)
OPENAI_API_KEY="sk-..."

# Vercel
VERCEL_TOKEN="..."
```

### Optional Services

```env
# Analytics
VITE_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# Maps
VITE_MAPBOX_ACCESS_TOKEN="pk...."
```

## API Endpoints

Your app will have these API endpoints available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/companies` | GET, POST, PUT, DELETE | Company CRUD operations |
| `/api/economic-indicators` | GET, POST | Economic data |
| `/api/ai-chat-enhanced` | POST | AI chat with database context |
| `/api/openai-chat` | POST | Basic OpenAI chat |

## Testing the Integration

1. **Test Database Connection**:
   - Go to your app
   - Check if companies load on the homepage
   - Try the search functionality

2. **Test AI Integration**:
   - Open the AI Assistant
   - Ask: "Tell me about Bank of America in Charlotte"
   - Should respond with database context

3. **Test API Endpoints**:
   ```bash
   # Test companies endpoint
   curl https://your-app.vercel.app/api/companies
   
   # Test AI with database context
   curl -X POST https://your-app.vercel.app/api/ai-chat-enhanced \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"What companies are in Charlotte?"}]}'
   ```

## Troubleshooting

### Common Issues

1. **"Supabase credentials not found" error**
   - Ensure environment variables are set in Vercel
   - Redeploy after adding environment variables

2. **Database queries return empty**
   - Check if schema.sql was run successfully
   - Verify RLS policies in Supabase dashboard

3. **AI chat not working**
   - Verify OPENAI_API_KEY is set correctly
   - Check API usage limits on OpenAI dashboard

4. **CORS errors**
   - API routes already include CORS headers
   - If issues persist, check Vercel.json configuration

## Next Steps

1. **Add Authentication**:
   - Enable Supabase Auth
   - Add login/signup pages
   - Protect admin routes

2. **Add More Data**:
   - Import real company data
   - Set up news feed integration
   - Add real economic indicators

3. **Enable Real-time Features**:
   - Set up Supabase Realtime subscriptions
   - Add WebSocket connections for live updates

4. **Monitor Performance**:
   - Set up Vercel Analytics
   - Add error tracking (Sentry)
   - Monitor API usage

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Project Issues: Create an issue in your GitHub repo