# Agent 3 - Utility APIs & SQL Implementation

## 🎯 Your Mission
You are responsible for updating all utility APIs and preparing the SQL migration for semantic search. These are simpler changes but critical for system functionality.

## 📁 Files You Own
1. **UPDATE:** `api/diagnose.ts`
2. **UPDATE:** `api/health-check.ts`
3. **UPDATE:** `api/unified-search.ts`
4. **UPDATE:** `api/data-query.ts`
5. **PREPARE:** SQL migration script (as text for orchestrator)

---

## 📝 Task 1: Update api/diagnose.ts

### File: `api/diagnose.ts` (UPDATE)

### Line ~169: Update first table reference
```typescript
// OLD:
const { count: companiesCount } = await supabase
  .from("companies")
  .select("*", { count: "exact", head: true });

// NEW - REPLACE WITH:
const { count: businessesCount } = await supabase
  .from("businesses")
  .select("*", { count: "exact", head: true });
```

### Line ~182: Update second table reference
```typescript
// OLD:
const { data: sampleCompanies } = await supabase
  .from("companies")
  .select("id, name, industry")
  .limit(3);

// NEW - REPLACE WITH:
const { data: sampleBusinesses } = await supabase
  .from("businesses")
  .select("id, name, industry")
  .limit(3);
```

### Update variable references:
```typescript
// Change all references from companiesCount to businessesCount
// Change all references from sampleCompanies to sampleBusinesses
// Update any display text from "companies" to "businesses"
```

---

## 📝 Task 2: Update api/health-check.ts

### File: `api/health-check.ts` (UPDATE)

### Line ~82: Update table reference
```typescript
// OLD:
const { count, error } = await supabase
  .from("companies")
  .select("*", { count: "exact", head: true });

// NEW - REPLACE WITH:
const { count, error } = await supabase
  .from("businesses")
  .select("*", { count: "exact", head: true });
```

### Update response message:
```typescript
// If there's a message like "companies table connected"
// Change to: "businesses table connected"
```

---

## 📝 Task 3: Update api/unified-search.ts

### File: `api/unified-search.ts` (UPDATE)

### Line ~235: Update table reference and remove status
```typescript
// OLD:
let dbQuery = supabase.from("companies").select("*").eq("status", "active");

// NEW - REPLACE WITH:
let dbQuery = supabase.from("businesses").select("*");
// No status field - all records considered active
```

### Add import at top of file:
```typescript
import { BusinessAdapter } from '../src/services/BusinessAdapter';
```

### Update field references in filters (search for these patterns):
```typescript
// REPLACE ALL:
"employees_count" → "employees"
"founded_year" → "year_established"
"sector" → "industry"  // sector doesn't exist, use industry
"description" → "name"  // description doesn't exist for search
```

### Update the return transformation (find where data is returned):
```typescript
// OLD:
return {
  results: data || [],
  // ...
}

// NEW - REPLACE WITH:
return {
  results: BusinessAdapter.toCompatibleFormatArray(data || []),
  total: count || 0,
  searchType: "unified",
  source: "database"
}
```

---

## 📝 Task 4: Update api/data-query.ts

### File: `api/data-query.ts` (UPDATE)

### Line ~122: Update table reference
```typescript
// OLD:
let query = supabase.from("companies").select(selectFields);

// NEW - REPLACE WITH:
let query = supabase.from("businesses").select(selectFields);
```

### Update field mappings in the query builder:
```typescript
// Look for any query construction and update:
"employees_count" → "employees"
"founded_year" → "year_established"
// Remove any references to: status, sector, description, logo_url, website
```

### Add transformation before return:
```typescript
import { BusinessAdapter } from '../src/services/BusinessAdapter';

// Before returning data, transform it:
// OLD:
return { data: results, ... }

// NEW:
return { 
  data: BusinessAdapter.toCompatibleFormatArray(results),
  ...
}
```

---

## 📝 Task 5: Prepare SQL Migration Script

### Create this SQL script as a text string (DO NOT EXECUTE):

```sql
-- ============================================================
-- Semantic Search Setup for Businesses Table
-- Date: 2025-09-07
-- Purpose: Enable vector search on businesses table
-- ============================================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Verify businesses table has embedding column
-- (Should already exist from previous migration)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 3: Create index for fast similarity search
CREATE INDEX IF NOT EXISTS businesses_embedding_idx 
ON businesses 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Create semantic search function
CREATE OR REPLACE FUNCTION semantic_business_search(
  query_embedding vector(1536),
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id VARCHAR,
  name VARCHAR,
  industry VARCHAR,
  neighborhood VARCHAR,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.industry,
    b.neighborhood,
    1 - (b.embedding <=> query_embedding) as similarity
  FROM businesses b
  WHERE b.embedding IS NOT NULL
  ORDER BY b.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$;

-- Step 5: Create enhanced semantic search with filters
CREATE OR REPLACE FUNCTION semantic_business_search_filtered(
  query_embedding vector(1536),
  filter_industry VARCHAR DEFAULT NULL,
  filter_neighborhood VARCHAR DEFAULT NULL,
  min_revenue NUMERIC DEFAULT NULL,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id VARCHAR,
  name VARCHAR,
  industry VARCHAR,
  neighborhood VARCHAR,
  revenue NUMERIC,
  employees INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.industry,
    b.neighborhood,
    b.revenue,
    b.employees,
    1 - (b.embedding <=> query_embedding) as similarity
  FROM businesses b
  WHERE b.embedding IS NOT NULL
    AND (filter_industry IS NULL OR b.industry ILIKE '%' || filter_industry || '%')
    AND (filter_neighborhood IS NULL OR b.neighborhood = filter_neighborhood)
    AND (min_revenue IS NULL OR b.revenue >= min_revenue)
  ORDER BY b.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION semantic_business_search TO anon, authenticated;
GRANT EXECUTE ON FUNCTION semantic_business_search_filtered TO anon, authenticated;

-- Step 7: Verify setup
-- Run these queries to verify:
-- SELECT COUNT(*) FROM businesses WHERE embedding IS NOT NULL;
-- SELECT proname FROM pg_proc WHERE proname LIKE 'semantic_%';
```

**Save this SQL as a comment block in EXECUTION_LOG.md for the orchestrator to run via Supabase MCP when ready.**

---

## 🎯 Testing Your Changes

After each file:
```bash
# 1. Type check
npm run typecheck

# 2. Fix any errors
# 3. Update EXECUTION_LOG.md
```

---

## ⚠️ Common Issues

1. **Simple updates**: These files mostly just need table/field name changes
2. **Don't overthink**: If a field doesn't exist, remove it or use BusinessAdapter
3. **Import paths**: Make sure BusinessAdapter import is correct

---

## 📊 Progress Tracking

Update EXECUTION_LOG.md after each file:
1. ✅ api/diagnose.ts updated
2. ✅ api/health-check.ts updated
3. ✅ api/unified-search.ts updated
4. ✅ api/data-query.ts updated
5. ✅ SQL migration prepared

---

## 🚨 If You Get Stuck

1. These are simpler changes - mostly find/replace
2. BusinessAdapter handles complex transformations
3. Report any blockers immediately

---

## ✅ Definition of Done

- [ ] All 4 API files updated to use businesses table
- [ ] All "companies" references changed to "businesses"
- [ ] All field names updated (employees_count → employees, etc.)
- [ ] SQL migration script prepared (not executed)
- [ ] No TypeScript errors
- [ ] Status updated in EXECUTION_LOG.md