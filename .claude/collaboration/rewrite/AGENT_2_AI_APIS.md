# Agent 2 - AI & Search APIs Implementation

## 🎯 Your Mission
You are responsible for updating all AI-related and search APIs to use the businesses table. This includes implementing the nuclear semantic search approach - no keyword preprocessing!

## 📁 Files You Own
1. **UPDATE:** `api/ai-search.ts` (Major changes)
2. **UPDATE:** `api/ai-chat-simple.ts` (Remove intent detection, add semantic search)
3. **UPDATE:** `api/generate-embeddings.ts` (Verify/update table reference)

---

## 📝 Task 1: Update api/ai-search.ts

### File: `api/ai-search.ts` (UPDATE)

**Line-by-line changes:**

### Line ~353: Update table and remove status filter
```typescript
// OLD:
let query = supabase.from("companies").select("*").eq("status", "active");

// NEW - REPLACE WITH:
let query = supabase.from("businesses").select("*");
// No status field exists - all records are considered active
```

### Lines ~366-371: Update location search
```typescript
// OLD:
if (locationKeywords.length > 0) {
  const locationConditions = locationKeywords
    .map(loc => `headquarters.ilike.%${loc}%,description.ilike.%${loc}%`)
    .join(",");
  query = query.or(locationConditions);
}

// NEW - REPLACE WITH:
if (locationKeywords.length > 0) {
  const locationConditions = locationKeywords
    .map(loc => `city.ilike.%${loc}%,state.ilike.%${loc}%,neighborhood.ilike.%${loc}%`)
    .join(",");
  query = query.or(locationConditions);
}
```

### Lines ~374-379: Update keyword search (remove description)
```typescript
// OLD:
if (searchKeywords.length > 0) {
  const keywordConditions = searchKeywords
    .map(keyword => 
      `name.ilike.%${keyword}%,description.ilike.%${keyword}%,industry.ilike.%${keyword}%`
    )
    .join(",");
  query = query.or(keywordConditions);
}

// NEW - REPLACE WITH:
if (searchKeywords.length > 0) {
  const keywordConditions = searchKeywords
    .map(keyword => 
      `name.ilike.%${keyword}%,industry.ilike.%${keyword}%,business_type.ilike.%${keyword}%`
    )
    .join(",");
  query = query.or(keywordConditions);
}
```

### Lines ~391-394: Update employee filter
```typescript
// OLD:
if (sizeFilter) {
  query = query.gte("employees_count", sizeFilter.min)
               .lte("employees_count", sizeFilter.max);
}

// NEW - REPLACE WITH:
if (sizeFilter) {
  query = query.gte("employees", sizeFilter.min)
               .lte("employees", sizeFilter.max);
}
```

### Add at top of file after imports:
```typescript
import { BusinessAdapter } from '../src/services/BusinessAdapter';
```

### Update the return transformation (around line ~420):
```typescript
// OLD:
return {
  results: data || [],
  // ... rest of return
}

// NEW - REPLACE WITH:
return {
  results: BusinessAdapter.toCompatibleFormatArray(data || []),
  searchType: "keyword", // or "semantic" when using semantic search
  total: data?.length || 0,
  query: originalQuery,
  filters: appliedFilters
}
```

---

## 📝 Task 2: Update api/ai-chat-simple.ts

### File: `api/ai-chat-simple.ts` (MAJOR REWRITE)

### REMOVE COMPLETELY (find and delete):
```typescript
// DELETE this entire function:
function detectSearchIntent(query: string): string {
  // ... entire function body ...
}
```

### ADD NEW SEMANTIC SEARCH FUNCTION:
Add this after imports, before the main handler:

```typescript
/**
 * Nuclear Semantic Search - Direct query to embedding with NO preprocessing
 */
async function performSemanticSearch(
  query: string, 
  supabase: any, 
  openai: any,
  limit: number = 10
): Promise<any[]> {
  try {
    // Step 1: Generate embedding for the FULL query - no preprocessing!
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query  // Direct, unmodified user query
    });
    
    if (!embeddingResponse.data?.[0]?.embedding) {
      throw new Error("Failed to generate embedding");
    }
    
    // Step 2: Call semantic search RPC
    const { data, error } = await supabase.rpc('semantic_business_search', {
      query_embedding: embeddingResponse.data[0].embedding,
      limit_count: limit
    });
    
    if (error) {
      console.error('Semantic search error:', error);
      throw error; // Fail fast - no fallbacks!
    }
    
    // Step 3: Fetch full business details for the results
    if (data && data.length > 0) {
      const businessIds = data.map((r: any) => r.id);
      const { data: fullBusinesses, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .in('id', businessIds);
        
      if (fetchError) throw fetchError;
      
      // Merge similarity scores with full data
      return fullBusinesses.map((business: any) => {
        const searchResult = data.find((r: any) => r.id === business.id);
        return {
          ...business,
          similarity: searchResult?.similarity || 0
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Semantic search failed:', error);
    // Fail fast - no fallback to keyword search!
    throw error;
  }
}
```

### Update main handler (find where detectSearchIntent was called):
```typescript
// OLD - Find and replace this pattern:
const searchIntent = detectSearchIntent(query);
// ... code using searchIntent ...

// NEW - REPLACE WITH:
// Determine if we need business data (simple heuristic)
const needsBusinessData = query.toLowerCase().includes('business') ||
                         query.toLowerCase().includes('company') ||
                         query.toLowerCase().includes('restaurant') ||
                         query.toLowerCase().includes('shop') ||
                         query.toLowerCase().includes('store') ||
                         query.toLowerCase().includes('find') ||
                         query.toLowerCase().includes('show') ||
                         query.toLowerCase().includes('list');

let businessContext = [];
if (needsBusinessData) {
  try {
    businessContext = await performSemanticSearch(
      question,  // Use the user's question directly
      supabase,
      openai,
      20  // Get top 20 results
    );
    console.log(`Found ${businessContext.length} relevant businesses via semantic search`);
  } catch (error) {
    console.error('Semantic search failed, continuing without business context:', error);
    // Continue without business data rather than failing completely
  }
}

// Add business context to the system prompt if we found any
let enrichedSystemPrompt = systemPrompt;
if (businessContext.length > 0) {
  // Transform with adapter for consistent format
  const formattedBusinesses = BusinessAdapter.toCompatibleFormatArray(businessContext);
  
  enrichedSystemPrompt += `\n\nRelevant businesses from the database:\n${JSON.stringify(formattedBusinesses, null, 2)}`;
  enrichedSystemPrompt += `\n\nUse this real business data to answer the user's question. Be specific and reference actual businesses by name when relevant.`;
}
```

### Update any other "companies" references:
```typescript
// Search for any remaining .from("companies") and replace with:
.from("businesses")

// Search for any "employees_count" and replace with:
"employees"

// Search for any "founded_year" and replace with:
"year_established"
```

---

## 📝 Task 3: Update api/generate-embeddings.ts

### File: `api/generate-embeddings.ts` (VERIFY & UPDATE)

### Line ~151: Update table reference
```typescript
// OLD:
const { data: companies, error: fetchError } = await supabase
  .from("companies")
  .select("id, name, description, industry, headquarters")
  .is("embedding", null)
  .limit(batchSize);

// NEW - REPLACE WITH:
const { data: businesses, error: fetchError } = await supabase
  .from("businesses")
  .select("id, name, industry, city, state, neighborhood, business_type")
  .is("embedding", null)
  .limit(batchSize);
```

### Update text generation for embedding (around line ~165):
```typescript
// OLD:
const textToEmbed = `${company.name} ${company.description || ''} ${company.industry || ''} ${company.headquarters || ''}`.trim();

// NEW - REPLACE WITH:
// Create rich text representation for embedding
const textToEmbed = [
  business.name,
  business.industry,
  business.business_type,
  business.neighborhood,
  business.city,
  business.state
].filter(Boolean).join(' ');
```

### Update the update query (around line ~180):
```typescript
// OLD:
const { error: updateError } = await supabase
  .from("companies")
  .update({ embedding: embedding })
  .eq("id", company.id);

// NEW - REPLACE WITH:
const { error: updateError } = await supabase
  .from("businesses")
  .update({ embedding: embedding })
  .eq("id", business.id);
```

### Update all variable names:
```typescript
// Replace all instances of "company" or "companies" variables with "business" or "businesses"
// Example:
// OLD: for (const company of companies)
// NEW: for (const business of businesses)
```

---

## 🎯 Testing Your Changes

After each file:
```bash
# 1. Type check
npm run typecheck

# 2. Fix any errors before moving to next file
# 3. Update EXECUTION_LOG.md with progress
```

---

## ⚠️ Critical Nuclear Semantic Search Rules

1. **NO keyword preprocessing** - User query goes directly to embedding
2. **NO intent detection** - Let the AI understand naturally
3. **NO fallbacks** - If semantic search fails, fail fast
4. **Direct embedding** - Full user question preserved

---

## 📊 Progress Tracking

Update EXECUTION_LOG.md after completing each file:
1. ✅ api/ai-search.ts updated
2. ✅ api/ai-chat-simple.ts updated with semantic search
3. ✅ api/generate-embeddings.ts verified

---

## 🚨 If You Get Stuck

1. Check SHARED_REFERENCE.md for field mappings
2. BusinessAdapter (from Agent 1) handles all transformations
3. Semantic search RPC expects vector(1536) embeddings
4. Report blockers immediately in EXECUTION_LOG.md

---

## ✅ Definition of Done

- [ ] api/ai-search.ts updated to use businesses table
- [ ] api/ai-chat-simple.ts has nuclear semantic search implemented
- [ ] detectSearchIntent function completely removed
- [ ] api/generate-embeddings.ts works with businesses table
- [ ] No TypeScript errors
- [ ] Status updated in EXECUTION_LOG.md