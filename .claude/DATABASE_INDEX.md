# Database Schema Index - Hurt Hub V2

## 🗄️ Database Architecture Overview

Hurt Hub V2 uses **Supabase** (PostgreSQL) as its primary database platform, providing a robust, scalable, and real-time data foundation for Charlotte's business intelligence platform.

### **Database Information**

- **Platform**: Supabase (PostgreSQL 15+)
- **Project ID**: `osnbklmavnsxpgktdeun`
- **Region**: US East (AWS)
- **Connection**: Supavisor connection pooling for optimal performance
- **Current Data**: ~299 Charlotte businesses with comprehensive business intelligence data

---

## 📊 Core Database Tables

### **1. `companies` Table** - Business Entity Master Data

**Purpose**: Central repository for all Charlotte business entities

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  industry VARCHAR,
  sector VARCHAR,
  description TEXT,
  founded_year INTEGER,
  employees_count INTEGER,
  revenue DECIMAL(15,2),
  website VARCHAR,
  headquarters VARCHAR,
  logo_url VARCHAR,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Data Volume**: ~299 Charlotte businesses
**Key Industries Represented**:

- Financial Services (Bank of America, Lowe's)
- Energy (Duke Energy)
- Automotive (Sonic Automotive)
- Technology & Manufacturing (Honeywell)
- And 20+ other industry sectors

**Sample Data Structure**:

```typescript
{
  id: "uuid-string",
  name: "Bank of America",
  industry: "Financial Services",
  sector: "Banking",
  description: "Multinational investment bank and financial services company",
  founded_year: 1998,
  employees_count: 213000,
  revenue: 94950000000,
  website: "https://bankofamerica.com",
  headquarters: "Charlotte, NC",
  status: "active"
}
```

**Indexes & Performance**:

- ✅ Primary key index on `id`
- ✅ Text search index on `name`, `industry`, `description`
- ✅ Performance index on `revenue` and `employees_count`
- ✅ Status filter index for active/inactive filtering

---

### **2. `developments` Table** - Business News & Updates

**Purpose**: Business development news, announcements, and market intelligence

```sql
CREATE TABLE developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR,
  source_url VARCHAR,
  category VARCHAR DEFAULT 'news' CHECK (category IN ('news', 'investment', 'expansion', 'partnership', 'other')),
  sentiment VARCHAR CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Data Categories**:

- **News**: General business news and updates
- **Investment**: Funding rounds, acquisitions, financial moves
- **Expansion**: New locations, market expansion, growth
- **Partnership**: Strategic partnerships and collaborations
- **Other**: Miscellaneous business developments

**Sentiment Analysis**:

- ✅ **Positive**: Growth, success, positive market news
- ✅ **Negative**: Layoffs, closures, negative market impact
- ✅ **Neutral**: Factual announcements without sentiment

**Relationships**:

```sql
-- Foreign key relationship to companies
company_id → companies.id (CASCADE DELETE)

-- Query pattern example:
SELECT d.*, c.name as company_name
FROM developments d
JOIN companies c ON d.company_id = c.id
WHERE d.published_at >= '2024-01-01'
ORDER BY d.published_at DESC;
```

---

### **3. `economic_indicators` Table** - Regional Economic Data

**Purpose**: Charlotte regional economic metrics and indicators

```sql
CREATE TABLE economic_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  unemployment_rate DECIMAL(5,2),
  gdp_growth DECIMAL(5,2),
  job_growth DECIMAL(8,0),
  inflation_rate DECIMAL(5,2),
  median_income DECIMAL(12,2),
  population_growth DECIMAL(5,2),
  business_confidence_index DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Economic Metrics Tracked**:

- **Unemployment Rate**: Monthly unemployment percentage
- **GDP Growth**: Quarterly GDP growth rate
- **Job Growth**: New jobs created (monthly/quarterly)
- **Inflation Rate**: Regional inflation metrics
- **Median Income**: Household median income data
- **Population Growth**: Regional population growth rate
- **Business Confidence Index**: Business sentiment indicator

**Time Series Analysis**:

```sql
-- Trend analysis query pattern
SELECT
  date,
  unemployment_rate,
  LAG(unemployment_rate) OVER (ORDER BY date) as prev_month,
  unemployment_rate - LAG(unemployment_rate) OVER (ORDER BY date) as change
FROM economic_indicators
ORDER BY date DESC;
```

---

### **4. `ai_conversations` Table** - Chat History & Session Management

**Purpose**: AI conversation logging and business intelligence chat history

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model VARCHAR DEFAULT 'gpt-4o-mini',
  module VARCHAR CHECK (module IN ('business-intelligence', 'community-pulse')),
  token_usage JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**AI Integration Features**:

- **Session Tracking**: Persistent conversation sessions
- **Module Support**: Business Intelligence vs Community Pulse contexts
- **Model Logging**: Track which AI model generated responses
- **Token Usage**: Monitor OpenAI API usage and costs
- **Business Context**: Conversations include real Charlotte business data

**Sample Conversation Data**:

```typescript
{
  id: "uuid",
  session_id: "session_2025_01_09_abc123",
  user_message: "What are the top revenue companies in Charlotte?",
  ai_response: "Based on the current data, the top revenue companies in Charlotte are: 1. Bank of America ($94.95B)...",
  model: "gpt-4o-mini",
  module: "business-intelligence",
  token_usage: {
    prompt_tokens: 450,
    completion_tokens: 200,
    total_tokens: 650
  }
}
```

**Query Patterns**:

```sql
-- Recent conversations by module
SELECT * FROM ai_conversations
WHERE module = 'business-intelligence'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Token usage analysis
SELECT
  DATE(created_at) as date,
  COUNT(*) as conversation_count,
  AVG((token_usage->>'total_tokens')::int) as avg_tokens
FROM ai_conversations
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### **5. `ai_session_summaries` Table** - Conversation Metadata

**Purpose**: AI session summaries and conversation analytics

```sql
CREATE TABLE ai_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR UNIQUE NOT NULL,
  summary TEXT,
  key_topics VARCHAR[],
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Session Analytics**:

- **Conversation Summaries**: AI-generated summaries of long conversations
- **Topic Extraction**: Key business topics discussed (revenue, companies, industry, etc.)
- **Usage Metrics**: Message counts, token usage, session duration
- **Activity Tracking**: Session start/end times, last activity

**Key Topics Tracked**:

```typescript
// Automatically extracted topics
key_topics: [
  "revenue",
  "companies",
  "industry",
  "employment",
  "growth",
  "economic",
  "developments",
];
```

---

## 🔗 Database Relationships & Foreign Keys

### **Relationship Diagram**

```
companies (1) ←→ (many) developments
    ↓
[ai_conversations] ← session_id → [ai_session_summaries]
    ↓
[economic_indicators] (independent time series)
```

### **Key Relationships**

#### **1. Companies ↔ Developments** (One-to-Many)

```sql
-- Companies can have multiple developments
ALTER TABLE developments
ADD CONSTRAINT fk_company_developments
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Query: Get company with recent developments
SELECT
  c.name,
  c.industry,
  d.title,
  d.published_at
FROM companies c
LEFT JOIN developments d ON c.id = d.company_id
WHERE c.status = 'active'
ORDER BY d.published_at DESC;
```

#### **2. AI Sessions ↔ Conversations** (One-to-Many)

```sql
-- Sessions can have multiple conversation entries
-- Linked by session_id (not FK to allow flexible session management)

-- Query: Get session with all conversations
SELECT
  s.summary,
  s.key_topics,
  c.user_message,
  c.ai_response,
  c.created_at
FROM ai_session_summaries s
JOIN ai_conversations c ON s.session_id = c.session_id
WHERE s.session_id = 'session_123'
ORDER BY c.created_at;
```

---

## 🔍 Advanced Query Patterns

### **1. Business Intelligence Queries**

#### **Top Performers Analysis**

```sql
-- Top companies by revenue with industry context
SELECT
  name,
  industry,
  revenue,
  employees_count,
  (revenue / NULLIF(employees_count, 0)) as revenue_per_employee,
  RANK() OVER (ORDER BY revenue DESC) as revenue_rank
FROM companies
WHERE status = 'active' AND revenue IS NOT NULL
ORDER BY revenue DESC
LIMIT 10;
```

#### **Industry Analysis**

```sql
-- Industry breakdown with analytics
SELECT
  industry,
  COUNT(*) as company_count,
  AVG(revenue) as avg_revenue,
  SUM(employees_count) as total_employees,
  AVG(employees_count) as avg_employees
FROM companies
WHERE status = 'active'
GROUP BY industry
ORDER BY avg_revenue DESC;
```

#### **Growth Analysis** (with developments)

```sql
-- Companies with positive recent developments
SELECT
  c.name,
  c.industry,
  c.revenue,
  COUNT(d.id) as positive_developments
FROM companies c
JOIN developments d ON c.id = d.company_id
WHERE d.sentiment = 'positive'
  AND d.published_at >= NOW() - INTERVAL '6 months'
GROUP BY c.id, c.name, c.industry, c.revenue
ORDER BY positive_developments DESC, c.revenue DESC;
```

### **2. AI Analytics Queries**

#### **Conversation Analytics**

```sql
-- AI usage patterns by module
SELECT
  module,
  COUNT(*) as conversation_count,
  AVG(LENGTH(user_message)) as avg_question_length,
  AVG(LENGTH(ai_response)) as avg_response_length,
  SUM((token_usage->>'total_tokens')::int) as total_tokens
FROM ai_conversations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY module;
```

#### **Popular Business Topics**

```sql
-- Most discussed topics in AI conversations
SELECT
  topic,
  COUNT(*) as mention_count
FROM ai_session_summaries s,
     UNNEST(s.key_topics) as topic
GROUP BY topic
ORDER BY mention_count DESC
LIMIT 10;
```

### **3. Economic Indicator Analysis**

#### **Economic Trend Analysis**

```sql
-- Economic indicators trend over time
SELECT
  date,
  unemployment_rate,
  gdp_growth,
  job_growth,
  LAG(unemployment_rate) OVER (ORDER BY date) as prev_unemployment,
  (unemployment_rate - LAG(unemployment_rate) OVER (ORDER BY date)) as unemployment_change
FROM economic_indicators
WHERE date >= NOW() - INTERVAL '12 months'
ORDER BY date;
```

---

## 🔒 Security & Access Control

### **Row Level Security (RLS)**

```sql
-- Enable RLS on sensitive tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Example policy: Public read access for companies
CREATE POLICY "companies_public_read" ON companies
FOR SELECT USING (status = 'active');

-- Example policy: Authenticated users can access AI conversations
CREATE POLICY "ai_conversations_auth_access" ON ai_conversations
FOR ALL USING (auth.uid() IS NOT NULL);
```

### **Data Privacy**

- ✅ **No PII Storage**: Business data only, no personal information
- ✅ **Anonymized AI Sessions**: No user identification in chat logs
- ✅ **Secure API Access**: Server-side service role keys only
- ✅ **Environment Isolation**: Proper production/development separation

---

## ⚡ Performance Optimization

### **Indexing Strategy**

```sql
-- Primary indexes for fast queries
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_revenue ON companies(revenue DESC);
CREATE INDEX idx_companies_employees ON companies(employees_count DESC);
CREATE INDEX idx_companies_status ON companies(status);

-- Text search indexes
CREATE INDEX idx_companies_name_gin ON companies USING gin(to_tsvector('english', name));
CREATE INDEX idx_companies_desc_gin ON companies USING gin(to_tsvector('english', description));

-- Time-based indexes
CREATE INDEX idx_developments_published ON developments(published_at DESC);
CREATE INDEX idx_ai_conversations_created ON ai_conversations(created_at DESC);
CREATE INDEX idx_economic_indicators_date ON economic_indicators(date DESC);
```

### **Query Optimization**

- ✅ **Connection Pooling**: Supavisor for optimal connection management
- ✅ **Prepared Statements**: Parameterized queries for security and performance
- ✅ **Result Caching**: Application-level caching with SWR
- ✅ **Pagination**: LIMIT/OFFSET patterns for large result sets

---

## 📈 Data Volume & Growth

### **Current Data Metrics** (as of deployment)

```sql
-- Current table sizes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'developments', 'ai_conversations');
```

**Estimated Volumes**:

- **Companies**: ~299 active Charlotte businesses
- **Developments**: Growing dataset of business news and updates
- **AI Conversations**: Growing with user engagement
- **Economic Indicators**: Monthly/quarterly data points
- **AI Session Summaries**: Proportional to conversation volume

### **Growth Projections**

- **Companies**: Steady growth as more Charlotte businesses are indexed
- **AI Conversations**: High growth expected with user adoption
- **Developments**: Regular updates from business news sources
- **Economic Data**: Regular monthly/quarterly additions

---

## 🔧 Database Client Integration

### **Supabase Client Configuration** (`src/lib/supabase.ts`)

```typescript
// Client-side configuration
const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
```

### **Common Operations Helper Functions**

```typescript
// Pre-built query helpers for common operations
export const supabaseAdmin = {
  companies: {
    getAll(),           // Get all active companies
    getById(id),        // Get company by ID
    search(query),      // Text search across companies
  },
  developments: {
    getRecent(limit),   // Get recent developments
    getByCompany(id),   // Get developments for specific company
  },
  indicators: {
    getCurrent(),       // Get latest economic indicators
    getHistorical(days), // Get historical trend data
  },
  chat: {
    createSession(),    // Create new AI chat session
    saveMessage(),      // Save conversation message
    getSessionHistory(), // Retrieve conversation history
  }
};
```

### **Type Safety Integration**

```typescript
// Full TypeScript integration with generated types
import type { Database } from "../types/database.types";

// All database operations are fully typed
const companies: Database["public"]["Tables"]["companies"]["Row"][] =
  await supabase.from("companies").select("*");
```

---

## 🧪 Development & Testing

### **Database Testing Patterns**

```sql
-- Health check queries used in /api/health-check
SELECT COUNT(*) FROM companies WHERE status = 'active';
SELECT MAX(created_at) FROM ai_conversations;
SELECT COUNT(*) FROM developments WHERE published_at >= NOW() - INTERVAL '30 days';
```

### **Data Seeding & Migration**

- **Production Data**: Real Charlotte business data (~299 companies)
- **Development Data**: Subset of production data for testing
- **Migration Strategy**: Supabase migrations for schema changes
- **Backup Strategy**: Automated Supabase backups

---

## 📊 Monitoring & Analytics

### **Database Metrics**

- **Connection Usage**: Monitor active connections via Supavisor
- **Query Performance**: Slow query monitoring and optimization
- **Storage Growth**: Table size and growth rate tracking
- **API Usage**: Track requests per table/operation

### **Business Intelligence Queries**

```sql
-- Dashboard KPIs
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_companies,
  SUM(revenue) FILTER (WHERE status = 'active') as total_revenue,
  SUM(employees_count) FILTER (WHERE status = 'active') as total_employees,
  COUNT(DISTINCT industry) as industry_count
FROM companies;

-- AI Usage Analytics
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as daily_conversations,
  COUNT(DISTINCT session_id) as unique_sessions
FROM ai_conversations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date;
```

---

_Generated: 2025-09-02_
_Last Updated: 2025-09-02_  
_Database Version: PostgreSQL 15+ (Supabase)_  
_Total Tables: 5 core tables_  
_Current Data Volume: ~299 companies + growing AI/development data_
