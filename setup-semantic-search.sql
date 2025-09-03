-- Setup Semantic Search Infrastructure for Hurt Hub V2
-- Execute these commands in Supabase SQL Editor

-- 1. Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create index for vector similarity search
CREATE INDEX IF NOT EXISTS companies_embedding_idx 
ON companies USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Create embedding_updates tracking table
CREATE TABLE IF NOT EXISTS embedding_updates (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    model_used TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_name, record_id)
);

-- 5. Create semantic business search function
CREATE OR REPLACE FUNCTION semantic_business_search(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id text,
    name text,
    industry text,
    description text,
    headquarters text,
    revenue bigint,
    employees_count int,
    founded_year int,
    status text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.industry,
        c.description,
        c.headquarters,
        c.revenue,
        c.employees_count,
        c.founded_year,
        c.status,
        1 - (c.embedding <=> query_embedding) as similarity
    FROM companies c
    WHERE c.embedding IS NOT NULL
        AND c.status = 'active'
        AND 1 - (c.embedding <=> query_embedding) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Grant permissions (adjust schema/role as needed)
GRANT EXECUTE ON FUNCTION semantic_business_search TO authenticated;
GRANT EXECUTE ON FUNCTION semantic_business_search TO anon;

-- 7. Create RLS policies if needed
ALTER TABLE embedding_updates ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read embedding updates
CREATE POLICY "Allow authenticated read on embedding_updates" 
ON embedding_updates FOR SELECT 
TO authenticated 
USING (true);

-- Policy to allow service role to insert/update embedding updates  
CREATE POLICY "Allow service role write on embedding_updates"
ON embedding_updates FOR ALL
TO service_role
USING (true);

-- Optional: Create a function to get embedding statistics
CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_companies', (SELECT COUNT(*) FROM companies WHERE status = 'active'),
        'companies_with_embeddings', (SELECT COUNT(*) FROM companies WHERE embedding IS NOT NULL AND status = 'active'),
        'embedding_coverage_percent', 
            CASE 
                WHEN (SELECT COUNT(*) FROM companies WHERE status = 'active') > 0 
                THEN ROUND(
                    (SELECT COUNT(*) FROM companies WHERE embedding IS NOT NULL AND status = 'active')::decimal / 
                    (SELECT COUNT(*) FROM companies WHERE status = 'active')::decimal * 100, 2
                )
                ELSE 0 
            END,
        'last_embedding_update', (SELECT MAX(created_at) FROM embedding_updates)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant permissions for stats function
GRANT EXECUTE ON FUNCTION get_embedding_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_embedding_stats TO anon;