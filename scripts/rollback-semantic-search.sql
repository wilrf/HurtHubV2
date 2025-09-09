-- Rollback script for semantic search function
-- Created: 2025-09-07
-- This script can restore the original function if needed

-- Original function that queries the companies table
CREATE OR REPLACE FUNCTION public.semantic_business_search(query_embedding vector, match_threshold double precision DEFAULT 0.78, match_count integer DEFAULT 10)
 RETURNS TABLE(id text, name text, industry text, description text, headquarters text, revenue bigint, employees_count integer, founded_year integer, status text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- To rollback: Run this script to restore the original function
-- Note: This function queries the non-existent companies table, 
-- so it won't work until companies table is recreated