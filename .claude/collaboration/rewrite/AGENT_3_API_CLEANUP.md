# Agent 3 - API Layer Cleanup

## 🎯 Your Mission
You are responsible for cleaning up all API endpoints to use the new service layer. Your job is to remove ALL direct database access from APIs and make them thin controllers that only orchestrate service calls.

## 🏛️ Architecture Context
Your APIs will:
- Use services created by Agent 2 (no direct repository access)
- Have NO business logic (all in services)
- Act as thin HTTP controllers only
- Let errors bubble up (proper error handling)

Position in architecture: UI → **APIs (YOU)** → Services → Repositories → Domain → Database

## 📁 Files You Will Update

### 1. **UPDATE: `api/businesses.ts`**
Transform from direct Supabase to service usage:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { BusinessService } from '../src/core/services/BusinessService';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create repository and service
    const repository = new SupabaseBusinessRepository(supabase);
    const businessService = new BusinessService(repository);
    
    // Parse query parameters
    const { 
      search, 
      industry, 
      location, 
      minEmployees, 
      maxEmployees,
      minRevenue,
      maxRevenue,
      limit = 100 
    } = req.query;
    
    // Build filters from query params
    const filters = {
      industry: industry ? [industry as string] : undefined,
      location: location ? { city: location as string } : undefined,
      employeeRange: (minEmployees || maxEmployees) ? {
        min: minEmployees ? parseInt(minEmployees as string) : undefined,
        max: maxEmployees ? parseInt(maxEmployees as string) : undefined,
      } : undefined,
      revenueRange: (minRevenue || maxRevenue) ? {
        min: minRevenue ? parseFloat(minRevenue as string) : undefined,
        max: maxRevenue ? parseFloat(maxRevenue as string) : undefined,
      } : undefined,
    };
    
    // Use service for business logic
    const result = await businessService.searchBusinesses(
      search as string || '',
      filters
    );
    
    // Return response
    return res.status(200).json({
      success: true,
      data: result.businesses.map(b => b.toJSON()),
      totalCount: result.totalCount,
      analytics: result.analytics,
    });
    
  } catch (error) {
    // Let error bubble - no business logic here
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
```

### 2. **UPDATE: `api/ai-chat-simple.ts`**
Use AI service instead of direct implementation:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { AIBusinessService } from '../src/core/services/AIBusinessService';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelResponse, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId } = req.body;
    
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    
    // Create repository and service
    const repository = new SupabaseBusinessRepository(supabase);
    const aiService = new AIBusinessService(repository, openai);
    
    // Get last user message
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    // Use service for business logic
    const { businesses, context } = await aiService.enhanceBusinessQuery(lastUserMessage);
    
    // Enhance messages with business context
    const enhancedMessages = [
      ...messages,
      {
        role: 'system',
        content: `Business context:\n${context}`,
      },
    ];
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: enhancedMessages,
      temperature: 0.7,
    });
    
    // Store conversation (if needed)
    if (sessionId) {
      await supabase.from('ai_conversations').insert({
        session_id: sessionId,
        messages: messages,
        response: completion.choices[0]?.message?.content,
        created_at: new Date().toISOString(),
      });
    }
    
    return res.status(200).json({
      content: completion.choices[0]?.message?.content,
      usage: completion.usage,
      model: completion.model,
      sessionId: sessionId || crypto.randomUUID(),
    });
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
```

### 3. **UPDATE: `api/ai-search.ts`**
Use AI service for semantic search:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { AIBusinessService } from '../src/core/services/AIBusinessService';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    
    // Create repository and service
    const repository = new SupabaseBusinessRepository(supabase);
    const aiService = new AIBusinessService(repository, openai);
    
    // Perform semantic search using service
    const businesses = await aiService.performSemanticSearch(query, limit);
    
    return res.status(200).json({
      success: true,
      query,
      results: businesses.map(b => b.toJSON()),
      count: businesses.length,
    });
    
  } catch (error) {
    console.error('AI Search Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Semantic search failed',
    });
  }
}
```

### 4. **UPDATE: `api/data-query.ts`**
Use services for data queries:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { BusinessService } from '../src/core/services/BusinessService';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, type, filters, context } = req.body;
    
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create repository and service
    const repository = new SupabaseBusinessRepository(supabase);
    const businessService = new BusinessService(repository);
    
    let results: any = {};
    
    switch (type) {
      case 'businesses':
      case 'companies': // Legacy support
        const searchResult = await businessService.searchBusinesses(query, filters);
        results.businesses = searchResult.businesses.map(b => b.toJSON());
        results.analytics = searchResult.analytics;
        break;
        
      case 'industry':
        const industryBusinesses = await businessService.getBusinessesByIndustry(query);
        results.businesses = industryBusinesses.map(b => b.toJSON());
        break;
        
      case 'location':
        const locationBusinesses = await businessService.getBusinessesByLocation(
          filters?.city,
          filters?.state,
          filters?.neighborhood
        );
        results.businesses = locationBusinesses.map(b => b.toJSON());
        break;
        
      case 'top-performers':
        const metric = filters?.metric || 'revenue';
        const topBusinesses = await businessService.getTopPerformers(metric, 10);
        results.businesses = topBusinesses.map(b => b.toJSON());
        break;
        
      default:
        // General search
        const generalResult = await businessService.searchBusinesses(query, filters);
        results.businesses = generalResult.businesses.map(b => b.toJSON());
        results.totalCount = generalResult.totalCount;
    }
    
    return res.status(200).json({
      success: true,
      query,
      type,
      data: results,
      timestamp: new Date().toISOString(),
      metadata: {
        queryType: type,
        filters,
        resultCount: results.businesses?.length || 0,
      },
    });
    
  } catch (error) {
    console.error('Data Query Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Query failed',
    });
  }
}
```

### 5. **UPDATE: `api/health-check.ts`**
Simple health check using repository:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create repository
    const repository = new SupabaseBusinessRepository(supabase);
    
    // Simple health checks
    const startTime = Date.now();
    const count = await repository.getTotalCount();
    const latency = Date.now() - startTime;
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latency,
      },
      businessCount: count,
      architecture: 'Repository Pattern + Domain-Driven Design',
    });
    
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 6. **UPDATE: `api/diagnose.ts`**
Diagnostic endpoint using services:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: 'Vercel',
      nodeVersion: process.version,
      architecture: 'Clean Architecture',
    },
    checks: {},
    recommendations: [],
  };

  try {
    // Check environment variables
    diagnostics.checks.environment = {
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    };
    
    // Test database connection
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const repository = new SupabaseBusinessRepository(supabase);
      const count = await repository.getTotalCount();
      
      diagnostics.checks.database = {
        connected: true,
        businessCount: count,
        usingRepository: true,
      };
      
      if (count === 0) {
        diagnostics.recommendations.push('No businesses in database - run data import');
      }
    } catch (dbError) {
      diagnostics.checks.database = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Connection failed',
      };
      diagnostics.recommendations.push('Check database credentials and connection');
    }
    
    // Test OpenAI
    diagnostics.checks.openai = {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      expectedLength: 164, // New project keys
    };
    
    if (!process.env.OPENAI_API_KEY) {
      diagnostics.recommendations.push('Set OPENAI_API_KEY environment variable');
    }
    
    // Architecture check
    diagnostics.checks.architecture = {
      repositoryPattern: true,
      domainEntities: true,
      serviceLayer: true,
      cleanArchitecture: true,
    };
    
    // Overall status
    diagnostics.status = 
      diagnostics.checks.database?.connected && 
      diagnostics.checks.environment?.hasSupabaseUrl &&
      diagnostics.checks.environment?.hasSupabaseKey
        ? 'healthy' 
        : 'degraded';
    
    const statusCode = diagnostics.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(diagnostics);
    
  } catch (error) {
    diagnostics.status = 'critical';
    diagnostics.error = error instanceof Error ? error.message : 'Diagnostic failed';
    return res.status(500).json(diagnostics);
  }
}
```

### 7. **UPDATE: `api/unified-search.ts`**
Unified search using services:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { BusinessService } from '../src/core/services/BusinessService';
import { AIBusinessService } from '../src/core/services/AIBusinessService';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, useAI = false, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const repository = new SupabaseBusinessRepository(supabase);
    
    let results;
    
    if (useAI) {
      // Use AI service for semantic search
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });
      const aiService = new AIBusinessService(repository, openai);
      const businesses = await aiService.performSemanticSearch(query);
      results = {
        businesses: businesses.map(b => b.toJSON()),
        searchType: 'semantic',
      };
    } else {
      // Use regular business service
      const businessService = new BusinessService(repository);
      const searchResult = await businessService.searchBusinesses(query, filters);
      results = {
        businesses: searchResult.businesses.map(b => b.toJSON()),
        totalCount: searchResult.totalCount,
        analytics: searchResult.analytics,
        searchType: 'structured',
      };
    }
    
    return res.status(200).json({
      success: true,
      query,
      ...results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Unified Search Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
}
```

### 8. **UPDATE: `api/generate-embeddings.ts`**
Admin endpoint for generating embeddings:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This is an admin endpoint - should have authentication in production
    const { adminKey } = req.body;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Initialize infrastructure
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    
    const repository = new SupabaseBusinessRepository(supabase);
    
    // Get all businesses
    const businesses = await repository.findAll(1000);
    
    let processed = 0;
    let errors = 0;
    
    // Generate embeddings for each business
    for (const business of businesses) {
      try {
        // Create text representation for embedding
        const text = `${business.name} ${business.industry || ''} ${business.neighborhood || ''} ${business.city}`;
        
        // Generate embedding
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        
        // Update database with embedding
        const { error } = await supabase
          .from('businesses')
          .update({ embedding: response.data[0].embedding })
          .eq('id', business.id);
        
        if (error) throw error;
        processed++;
        
      } catch (err) {
        console.error(`Failed to generate embedding for ${business.id}:`, err);
        errors++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Embeddings generated',
      processed,
      errors,
      total: businesses.length,
    });
    
  } catch (error) {
    console.error('Generate Embeddings Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate embeddings',
    });
  }
}
```

## 📋 Implementation Checklist

- [ ] Remove ALL `import { BusinessAdapter }` statements
- [ ] Remove ALL direct Supabase queries from APIs
- [ ] Update all APIs to use services (BusinessService, AIBusinessService)
- [ ] Ensure APIs are thin controllers (no business logic)
- [ ] Implement proper error handling (let errors bubble)
- [ ] Add CORS headers to all endpoints
- [ ] Run `npm run type-check` - fix any errors
- [ ] Run `npm run build` - ensure it compiles
- [ ] Update EXECUTION_LOG.md with your progress

## 🎯 Success Criteria

1. **No direct database access** - All through services
2. **No business logic in APIs** - Only HTTP handling
3. **Services properly instantiated** - Repository → Service pattern
4. **Error handling** - Errors bubble up, proper status codes
5. **Clean controllers** - APIs are thin orchestration layers
6. **Type safety** - Full TypeScript compliance

## 🚨 Critical Notes

- **Wait for Agent 1 & 2** - You need their repositories and services
- **No Supabase queries** - Only services should access repositories
- **Thin controllers** - APIs should be <100 lines each ideally
- **Let errors bubble** - Don't hide errors with try-catch
- **CORS headers** - Include on all endpoints for browser access

## 🔄 Dependencies

**From Agent 1:**
- `SupabaseBusinessRepository` for instantiation
- `Business` domain entity (through services)

**From Agent 2:**
- `BusinessService` for business operations
- `AIBusinessService` for AI operations
- `BusinessIntelligenceService` (if needed)

## 📝 Pattern to Follow

Every API should follow this pattern:
1. Handle CORS
2. Validate HTTP method
3. Initialize infrastructure (Supabase client)
4. Create repository
5. Create service(s)
6. Call service method(s)
7. Return response
8. Let errors bubble to catch block
9. Return error with appropriate status code

Your APIs are the gateway - keep them clean and simple!