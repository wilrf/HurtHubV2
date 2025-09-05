# API Endpoints Index - Hurt Hub V2

## 📡 API Architecture Overview

The Hurt Hub V2 platform uses **Vercel Edge Functions** to provide fast, globally distributed API endpoints. All APIs are built with TypeScript and follow RESTful principles with proper CORS configuration.

### Base URL

- **Production**: `https://hurt-hub-v2.vercel.app/api/`
- **Development**: `http://localhost:3000/api/`

---

## 🔧 Diagnostic & Testing APIs

### **`/api/diagnose`** - Comprehensive System Diagnostics

**Purpose**: Full health check for OpenAI and Supabase configurations

- **Method**: `GET`
- **Max Duration**: 30 seconds
- **Authentication**: None (⚠️ Should be admin-only in production)
- **Usage**: Terminal/CLI testing, CI/CD pipelines

**Response**: Detailed system health report including API keys validation, connection tests, and recommendations

### **`/api/test-openai`** - OpenAI Connection Test

**Purpose**: Quick test specifically for OpenAI API connectivity

- **Method**: `GET`
- **Response**: Connection status and key validation info

### **`/api/test-env`** - Environment Variables Check

**Purpose**: Lists which environment variables are present (not values)

- **Method**: `GET`
- **Response**: Environment configuration status

**📚 Full Documentation**: See [`api-docs/diagnostic-endpoints.md`](../api-docs/diagnostic-endpoints.md)

---

## 🤖 AI & Chat APIs

### 1. **`/api/ai-chat-simple`** - Primary AI Chat Endpoint

**Purpose**: Main AI conversation interface with business context injection

- **Method**: `POST`
- **Max Duration**: 60 seconds
- **Authentication**: None (public endpoint)
- **OpenAI Model**: GPT-4o-mini (configurable)
- **Initialization**: Lazy-loaded OpenAI client via singleton pattern

**Request Format**:

```typescript
{
  messages: ChatMessage[];        // Conversation history
  model?: string;                 // Default: 'gpt-4o-mini'
  temperature?: number;           // Default: 0.7
  module?: 'business-intelligence' | 'community-pulse';
  sessionId?: string;            // Auto-generated if not provided
}
```

**Response Format**:

```typescript
{
  content: string; // AI response
  usage: OpenAI.Usage; // Token usage stats
  model: string; // Model used
  sessionId: string; // Session identifier
}
```

**Key Features**:

- ✅ **Smart Business Context**: Automatically queries Supabase for relevant business data
- ✅ **Session Management**: Persistent conversation tracking
- ✅ **Context Enhancement**: Injects real Charlotte business data into AI responses
- ✅ **Conversation Storage**: Saves chat history to `ai_conversations` table
- ✅ **Error Handling**: Explicit error handling with no fallbacks (fail-fast approach)
- ✅ **Environment Safety**: Lazy initialization ensures env vars are loaded

**Data Flow**:

```
Request → Analyze Query → Fetch Business Data →
Enhance Context → OpenAI API → Store Conversation → Response
```

### 2. **`/api/chat`** - Alternative Chat Interface

**Purpose**: Legacy chat endpoint with GPT-5 integration support

- **Method**: `POST`
- **Max Duration**: 60 seconds
- **Features**: Streaming support, session management

**Request Format**:

```typescript
{
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;             // Streaming response support
  sessionId?: string;
  module?: 'business-intelligence' | 'community-pulse';
}
```

### 3. **`/api/analyze`** - Deep Analysis Engine

**Purpose**: Advanced business analysis with GPT-4 reasoning

- **Method**: `POST`
- **Max Duration**: 120 seconds (extended for deep analysis)
- **Authentication**: None

**Request Format**:

```typescript
{
  type: 'code' | 'business' | 'market' | 'competitive';
  data: any;                    // Data to analyze
  depth: 'quick' | 'standard' | 'deep';
  context?: string;             // Additional context
}
```

**Analysis Types**:

- **`business`**: Company performance, metrics, trends
- **`market`**: Industry analysis, competitive landscape
- **`competitive`**: Competitor analysis and positioning
- **`code`**: Technical code analysis and recommendations

### 4. **`/api/context`** - Conversation Context Management

**Purpose**: Advanced conversation context storage and retrieval

- **Methods**: `GET`, `POST`
- **Max Duration**: 30 seconds
- **Features**: Semantic search, conversation summaries

**Actions Supported**:

```typescript
{
  action: 'store' | 'retrieve' | 'search' | 'summarize';
  sessionId?: string;
  userId?: string;
  messages?: ChatMessage[];
  query?: string;              // For semantic search
  limit?: number;              // Default: 10
}
```

**Features**:

- **Context Storage**: Persistent conversation history
- **Semantic Search**: Find relevant past conversations
- **Summarization**: AI-powered conversation summaries
- **User-based Context**: User-specific conversation retrieval

---

## 📊 Data & Query APIs

### 5. **`/api/data-query`** - Business Data Query Engine

**Purpose**: Structured business data retrieval with smart filtering

- **Method**: `POST`
- **Authentication**: None
- **Response Time**: ~200-500ms

**Request Format**:

```typescript
{
  query: string;                // Natural language or structured query
  type: 'companies' | 'developments' | 'economic' | 'comprehensive' | 'search';
  filters?: {
    industry?: string;
    sector?: string;
    companyId?: string;
    dateRange?: { start: string; end: string };
    limit?: number;
  };
  context?: string;             // Additional query context
}
```

**Query Types**:

- **`companies`**: Business entity data, revenue, employees
- **`developments`**: Business news, updates, announcements
- **`economic`**: Economic indicators, GDP, unemployment data
- **`comprehensive`**: Multi-table joined analysis
- **`search`**: Full-text search across all business data

**Response Format**:

```typescript
{
  success: boolean;
  query: string;
  type: string;
  data: {
    companies?: Company[];
    developments?: Development[];
    economicIndicators?: EconomicIndicator[];
    summary?: BusinessSummary;
  };
  timestamp: string;
  metadata: {
    queryType: string;
    filters: object;
    resultCount: number;
  }
}
```

---

## 🏥 System Health & Monitoring

### 6. **`/api/diagnose`** - Comprehensive Diagnostics Endpoint

**Purpose**: Deep system diagnostics and environment validation

- **Method**: `GET`
- **Authentication**: None
- **Use Cases**: Deployment verification, debugging, monitoring

**Response Format**:

```typescript
{
  timestamp: string;
  environment: {
    platform: 'Vercel';
    region?: string;
    env?: string;
    url?: string;
    nodeVersion: string;
  };
  checks: {
    openai: {
      hasKey: boolean;
      keyLength: number;
      expectedLength: number;    // 164 for project keys, 51 for legacy
      lengthValid: boolean;
      format?: string;           // sk-proj-... or sk-...
      isProjectKey: boolean;
      needsTrim?: boolean;      // Detects whitespace issues
      validation?: object;       // From singleton validator
    };
    supabase: {
      hasUrl: boolean;
      hasAnonKey: boolean;
      hasServiceKey: boolean;
      urlValue?: string;
      connection?: {
        success: boolean;
        error?: string;
        companyCount?: number;   // Should be ~299
      };
    };
    openaiConnection?: {         // Live API test
      success: boolean;
      response?: string;
      model?: string;
      error?: string;
    };
  };
  recommendations: string[];    // Actionable fix suggestions
  status: 'healthy' | 'degraded' | 'critical';
}
```

**Diagnostic Features**:

- ✅ **OpenAI Key Validation**: Format, length, whitespace detection
- ✅ **Supabase Configuration**: Multi-source env var checking
- ✅ **Live Connection Tests**: Actual API calls to verify credentials
- ✅ **Smart Recommendations**: Specific fix instructions
- ✅ **Status Codes**: 200 (healthy), 503 (degraded), 500 (critical)

### 7. **`/api/health-check`** - System Health Monitoring

**Purpose**: Comprehensive system health and database status

- **Method**: `GET`
- **Authentication**: None
- **Use Cases**: Monitoring, debugging, system diagnostics

**Response Format**:

```typescript
{
  status: 'healthy' | 'unhealthy' | 'error';
  timestamp: string;
  database: {
    connected: boolean;
    latency: number;            // Response time in ms
  };
  tables: {
    companies: boolean;
    developments: boolean;
    economic_indicators: boolean;
    ai_conversations: boolean;
    ai_session_summaries: boolean;
  };
  dataCounts: {
    companies: number;          // Currently ~299 Charlotte businesses
    developments: number;
    economic_indicators: number;
    ai_conversations: number;
    ai_session_summaries: number;
  };
  recommendations: string[];    // System optimization suggestions
}
```

**Health Checks**:

- ✅ **Database Connectivity**: Supabase connection test
- ✅ **Table Accessibility**: RLS policy verification
- ✅ **Data Integrity**: Record counts and validation
- ✅ **Performance Monitoring**: Query latency tracking
- ✅ **Automated Recommendations**: System optimization suggestions

### 8. **`/api/test-openai`** - OpenAI Configuration Test

**Purpose**: Isolated OpenAI API key validation and testing

- **Method**: `GET`
- **Use Cases**: Quick OpenAI connectivity check
- **Features**: Key format validation, trimming detection, live API test

### 9. **`/api/test-db`** - Database Testing Utility

**Purpose**: Environment variable and database configuration testing

- **Method**: `GET`, `POST`
- **Use Cases**: Deployment verification, configuration testing

**Features**:

- Environment variable availability check
- Database connection testing with multiple credential sources
- Company data validation (should show ~299 Charlotte businesses)
- Configuration recommendations

### 10. **`/api/ai-search`** - AI-Powered Business Search

**Purpose**: Smart search with OpenAI intent analysis and context enhancement

- **Method**: `POST`
- **Max Duration**: 30 seconds
- **Features**: Intent analysis, smart filtering, AI-enhanced results

**Request Format**:

```typescript
{
  query: string;                // Natural language search
  limit?: number;               // Default: 10
  useAI?: boolean;             // Enable AI enhancement (default: true)
}
```

**Search Flow**:

1. **Intent Analysis**: OpenAI analyzes search intent
2. **Smart Query**: Builds database query based on intent
3. **AI Enhancement**: Enriches results with contextual information

---

## 🔐 Security & Environment Variables

### **Server-Side Environment Variables**

**Required for API functionality**:

```bash
# OpenAI Integration
OPENAI_API_KEY=sk-proj-...           # GPT-4o-mini API access

# Supabase Database (Multiple Sources)
VITE_SUPABASE_URL=https://osnbklmavnsxpgktdeun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Admin database access
SUPABASE_SUPABASE_URL=...            # Vercel integration URL
SUPABASE_SUPABASE_SERVICE_ROLE_KEY=... # Vercel integration key
```

### **API Security Features**

- ✅ **CORS Configuration**: Proper cross-origin resource sharing
- ✅ **Environment Isolation**: Server-side only API keys
- ✅ **Input Validation**: Request body validation and sanitization
- ✅ **Error Handling**: Explicit errors with no fallbacks (fail-fast)
- ✅ **Rate Limiting**: Vercel Edge Function natural rate limiting
- ✅ **Lazy Initialization**: Prevents env var timing issues
- ✅ **Singleton Pattern**: Secure, cached client instances
- ✅ **Key Validation**: Format and length checking with trimming

### **Authentication Flow**

- **Public Endpoints**: No authentication required for basic queries
- **Supabase RLS**: Row-level security for database access
- **API Key Security**: OpenAI keys never exposed to client-side

---

## 🗄️ Database Integration

### **Primary Database**: Supabase (PostgreSQL)

- **Project ID**: `osnbklmavnsxpgktdeun`
- **Connection**: Supavisor pooling for optimal performance
- **Tables**: 5 core tables with full relationships

### **Database Tables**:

1. **`companies`** (~299 records) - Charlotte business entities
2. **`developments`** - Business news and updates
3. **`economic_indicators`** - Regional economic data
4. **`ai_conversations`** - Chat history and session logs
5. **`ai_session_summaries`** - Conversation metadata and summaries

### **Query Patterns**:

- **Real-time Queries**: Direct Supabase client queries
- **Complex Analytics**: JOIN queries across multiple tables
- **AI Context**: Dynamic data injection based on user queries
- **Performance**: Optimized queries with proper indexing

---

## 🚀 Performance Optimization

### **Edge Function Benefits**:

- **Global Distribution**: Sub-100ms response times worldwide
- **Auto-scaling**: Handles traffic spikes automatically
- **Cold Start Optimization**: Minimal initialization overhead

### **Database Performance**:

- **Connection Pooling**: Supavisor for PostgreSQL optimization
- **Query Optimization**: Indexed searches and efficient JOINs
- **Caching Strategy**: SWR on frontend for data caching

### **AI API Performance**:

- **Context Optimization**: Smart data retrieval to minimize token usage
- **Model Selection**: GPT-4o-mini for optimal speed/quality balance
- **Streaming Support**: Available for real-time responses

---

## 🧪 Testing & Development

### **API Testing Commands**:

```bash
# Test AI Chat
node scripts/test-ai-simple.js

# Test Database Connection
curl https://hurt-hub-v2.vercel.app/api/health-check

# Test Business Data Query
curl -X POST https://hurt-hub-v2.vercel.app/api/data-query \
  -H "Content-Type: application/json" \
  -d '{"query": "charlotte restaurants", "type": "companies"}'
```

### **Development Tools**:

- **Vercel CLI**: Local API development and deployment
- **Supabase Dashboard**: Database management and query testing
- **OpenAI Playground**: AI model testing and prompt optimization

---

## 📈 Usage Analytics

### **Current Data Volume**:

- **Charlotte Businesses**: 299+ companies indexed
- **API Calls**: Real-time chat and data queries
- **Response Times**: <500ms average for data queries, <3s for AI responses

### **Common API Patterns**:

1. **Business Intelligence Queries**: Revenue, employment, industry analysis
2. **AI-Powered Insights**: Contextual business recommendations
3. **Real-time Data**: Live business metrics and updates
4. **Conversation Management**: Persistent chat sessions

---

_Last Updated: 2025-01-09_  
_Total Endpoints: 10_  
_API Coverage: 100% documented_

---

## 🛠️ Recent Changes & Improvements

### **2025-01-09 Updates**:

- **OpenAI Singleton Pattern**: Implemented `lib/openai-singleton.ts` for reliable client initialization
- **Lazy Loading**: All API routes now use lazy initialization to prevent env var timing issues
- **Diagnostic Endpoint**: Added `/api/diagnose` for comprehensive system health checks
- **Validation Script**: Created `scripts/validate-deployment.cjs` for pre-deployment checks
- **Error Handling**: Removed all fallbacks in favor of explicit error reporting
- **Key Management**: Added automatic trimming and validation for OpenAI's new 164-character project keys
