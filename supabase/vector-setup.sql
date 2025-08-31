-- Setup for vector embeddings in Supabase
-- Enable the pgvector extension for semantic search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS businesses_embedding_idx 
ON businesses USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Function for semantic business search
CREATE OR REPLACE FUNCTION semantic_business_search(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id varchar,
  name varchar,
  industry varchar,
  naics varchar,
  employees int,
  revenue decimal,
  neighborhood varchar,
  cluster varchar,
  business_type varchar,
  year_established int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.industry,
    b.naics,
    b.employees,
    b.revenue,
    b.neighborhood,
    b.cluster,
    b.business_type,
    b.year_established,
    1 - (b.embedding <=> query_embedding) as similarity
  FROM businesses b
  WHERE b.embedding IS NOT NULL
    AND 1 - (b.embedding <=> query_embedding) > similarity_threshold
  ORDER BY b.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to generate business embeddings (call this to populate embeddings)
CREATE OR REPLACE FUNCTION generate_business_embeddings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  business_record RECORD;
  business_text TEXT;
BEGIN
  -- Note: This would need to be called from your application
  -- as it requires OpenAI API calls to generate embeddings
  
  FOR business_record IN 
    SELECT id, name, industry, naics, neighborhood, cluster, business_type
    FROM businesses 
    WHERE embedding IS NULL
  LOOP
    -- Construct descriptive text for embedding
    business_text := business_record.name || ' ' || 
                    COALESCE(business_record.industry, '') || ' ' ||
                    COALESCE(business_record.naics, '') || ' ' ||
                    COALESCE(business_record.neighborhood, '') || ' ' ||
                    COALESCE(business_record.cluster, '') || ' ' ||
                    COALESCE(business_record.business_type, '');
    
    -- Note: You would call your embedding API here
    -- UPDATE businesses SET embedding = your_embedding WHERE id = business_record.id;
    
    RAISE NOTICE 'Would generate embedding for: %', business_text;
  END LOOP;
END;
$$;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_businesses_embedding_not_null 
ON businesses (id) WHERE embedding IS NOT NULL;

-- Add embedding tracking table
CREATE TABLE IF NOT EXISTS embedding_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(50) NOT NULL,
  embedding_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_used VARCHAR(50) DEFAULT 'text-embedding-3-small'
);

-- Function to track embedding updates
CREATE OR REPLACE FUNCTION track_embedding_update(
  table_name VARCHAR(50),
  record_id VARCHAR(50),
  model_name VARCHAR(50) DEFAULT 'text-embedding-3-small'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO embedding_updates (table_name, record_id, model_used)
  VALUES (table_name, record_id, model_name)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON businesses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION semantic_business_search TO anon, authenticated;
