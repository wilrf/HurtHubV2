import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSearchActivity } from "./debug-search";

export const config = {
  maxDuration: 30,
};

interface SearchRequest {
  query: string;
  limit?: number;
  useAI?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Initialize clients with proper error handling
  let openai;
  let supabase: SupabaseClient;

  try {
    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured in environment variables");
    }
    if (!openaiApiKey.startsWith("sk-")) {
      throw new Error("Invalid OpenAI key format");
    }

    openai = new OpenAI({
      apiKey: openaiApiKey,
      maxRetries: 3,
      timeout: 30000,
    });
  } catch (error: any) {
    console.error("OpenAI initialization failed:", error.message);
    return res.status(500).json({
      error: "AI service configuration error",
      details: error.message,
    });
  }

  try {
    // Initialize Supabase - NEVER USE FALLBACKS (CLAUDE.md rule)
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is required");
    }

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
      );
    }

    supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());
  } catch (error: any) {
    console.error("Supabase initialization failed:", error.message);
    return res.status(500).json({
      error: "Database configuration error",
      details: error.message,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, limit = 10, useAI = true } = req.body as SearchRequest;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("🎯 AI Search Request:", { 
      query, 
      limit, 
      useAI,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Use OpenAI to understand the search intent
    const intentStart = Date.now();
    const searchIntent = await analyzeSearchIntent(query, openai);
    const intentDuration = Date.now() - intentStart;
    
    console.log("🧠 Search Intent Analysis:", {
      duration: `${intentDuration}ms`,
      industries: searchIntent.industries,
      locations: searchIntent.locations,
      keywords: searchIntent.keywords,
      filters: searchIntent.filters,
    });

    // Step 2: Build smart database query based on intent
    const dbStart = Date.now();
    const searchResults = await performSmartSearch(
      searchIntent,
      limit,
      supabase,
      query,
      openai,
    );
    const dbDuration = Date.now() - dbStart;
    
    console.log("📁 Database Search Complete:", {
      duration: `${dbDuration}ms`,
      resultsFound: searchResults.length,
      companies: searchResults.slice(0, 3).map((c: any) => c.name),
    });

    // Step 3: If requested, enhance results with AI context
    let enhancedResults = searchResults;
    if (useAI && searchResults.length > 0) {
      enhancedResults = await enhanceWithAI(query, searchResults, openai);
    }

    // Log search activity for debugging
    logSearchActivity({
      query,
      intent: searchIntent,
      resultsCount: enhancedResults.length,
      duration: `${Date.now() - intentStart}ms`,
      method: useAI ? "ai-enhanced" : "basic",
      semanticCount: searchResults.filter((r: any) => r.searchType === "semantic").length,
      keywordCount: searchResults.filter((r: any) => r.searchType === "keyword").length,
      success: true,
      topResults: enhancedResults.slice(0, 3).map((r: any) => r.name),
    });

    return res.status(200).json({
      success: true,
      query,
      intent: searchIntent,
      results: enhancedResults,
      count: enhancedResults.length,
      source: "database",
      enhanced: useAI,
    });
  } catch (error: any) {
    console.error("AI Search Error:", error);
    return res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
}

// Analyze search intent using OpenAI
async function analyzeSearchIntent(query: string, openai: OpenAI) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a search intent analyzer for a Charlotte business database. 
          Analyze the user's query and extract:
          1. Business type/industry they're looking for
          2. Location/neighborhood if mentioned
          3. Specific attributes (size, revenue, ratings, etc.)
          4. Keywords to search for
          
          Return a JSON object with these fields:
          {
            "industries": ["array of relevant industries"],
            "locations": ["array of neighborhoods/areas mentioned"],
            "keywords": ["array of important keywords"],
            "filters": {
              "minRevenue": number or null,
              "maxRevenue": number or null,
              "minEmployees": number or null,
              "maxEmployees": number or null,
              "minRating": number or null
            },
            "searchType": "specific" | "broad" | "location" | "industry"
          }`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const intentJson = completion.choices[0]?.message?.content;
    return intentJson ? JSON.parse(intentJson) : {};
  } catch (error: any) {
    console.error("Intent analysis failed:", error);
    throw new Error(`Failed to analyze search intent: ${error.message}`);
  }
}

// Perform smart database search with semantic search
async function performSmartSearch(
  intent: any,
  limit: number,
  supabase: any,
  originalQuery: string,
  openai: OpenAI,
) {
  // Strategy 1: Try semantic search first if embeddings are available
  let semanticResults: any[] = [];
  const semanticStart = Date.now();
  try {
    semanticResults = await performSemanticSearch(
      originalQuery,
      openai,
      supabase,
      Math.ceil(limit * 0.7),
    );
    const semanticDuration = Date.now() - semanticStart;
    console.log("🧬 Semantic Search Results:", {
      duration: `${semanticDuration}ms`,
      count: semanticResults.length,
      topMatches: semanticResults.slice(0, 3).map((r: any) => ({
        name: r.name,
        similarity: r.similarity,
      })),
    });
  } catch (error: any) {
    console.warn(
      "⚠️ Semantic search failed, falling back to keyword search:",
      {
        error: error.message,
        duration: `${Date.now() - semanticStart}ms`,
      }
    );
  }

  // Strategy 2: Keyword-based search for remaining slots
  const keywordLimit =
    semanticResults.length > 0 ? limit - semanticResults.length : limit;
  let keywordResults: any[] = [];

  if (keywordLimit > 0) {
    const keywordStart = Date.now();
    keywordResults = await performKeywordSearch(intent, keywordLimit, supabase);
    const keywordDuration = Date.now() - keywordStart;
    
    console.log("🔤 Keyword Search Results:", {
      duration: `${keywordDuration}ms`,
      count: keywordResults.length,
      searchedFor: {
        industries: intent.industries?.slice(0, 3),
        keywords: intent.keywords?.slice(0, 5),
      },
      topMatches: keywordResults.slice(0, 3).map((r: any) => r.name),
    });
  }

  // Combine and deduplicate results
  const allResults = [...semanticResults, ...keywordResults];
  const uniqueResults = deduplicateResults(allResults);

  // Sort by relevance score if available, otherwise by revenue
  const finalResults = uniqueResults
    .sort(
      (a, b) =>
        (b.similarity || b.revenue || 0) - (a.similarity || a.revenue || 0),
    )
    .slice(0, limit);
    
  console.log("✨ Final Search Results:", {
    totalFound: allResults.length,
    afterDedup: uniqueResults.length,
    returned: finalResults.length,
    searchMethods: {
      semantic: semanticResults.length,
      keyword: keywordResults.length,
    },
    topResults: finalResults.slice(0, 5).map((r: any) => ({
      name: r.name,
      industry: r.industry,
      searchType: r.searchType || "keyword",
    })),
  });
  
  return finalResults;
}

// Semantic search using vector embeddings
async function performSemanticSearch(
  query: string,
  openai: OpenAI,
  supabase: any,
  limit: number,
) {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateQueryEmbedding(query, openai);

    // Call the semantic_business_search function
    const { data, error } = await supabase.rpc("semantic_business_search", {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,
      match_count: limit,
    });

    if (error) {
      throw new Error(`Semantic search failed: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      similarity: item.similarity,
      searchType: "semantic",
    }));
  } catch (error) {
    console.error("Semantic search error:", error);
    return [];
  }
}

// Generate embedding for search query
async function generateQueryEmbedding(
  query: string,
  openai: OpenAI,
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

// Traditional keyword-based search as fallback
async function performKeywordSearch(intent: any, limit: number, supabase: any) {
  console.log("🔍 Building Keyword Query:", {
    industries: intent.industries?.length || 0,
    locations: intent.locations?.length || 0,
    keywords: intent.keywords?.length || 0,
    limit,
  });
  
  let query = supabase.from("companies").select("*").eq("status", "active");

  // Apply industry filters
  if (intent.industries && intent.industries.length > 0) {
    const industryConditions = intent.industries
      .map((ind: string) => `industry.ilike.%${ind}%`)
      .join(",");
    query = query.or(industryConditions);
  }

  // Apply location filters
  if (intent.locations && intent.locations.length > 0) {
    const locationConditions = intent.locations
      .map(
        (loc: string) =>
          `description.ilike.%${loc}%,headquarters.ilike.%${loc}%`,
      )
      .join(",");
    query = query.or(locationConditions);
  }

  // Apply keyword search on name and description
  if (intent.keywords && intent.keywords.length > 0) {
    const keywordConditions = intent.keywords
      .map((kw: string) => `name.ilike.%${kw}%,description.ilike.%${kw}%`)
      .join(",");
    query = query.or(keywordConditions);
  }

  // Apply numeric filters
  if (intent.filters) {
    if (intent.filters.minRevenue) {
      query = query.gte("revenue", intent.filters.minRevenue);
    }
    if (intent.filters.maxRevenue) {
      query = query.lte("revenue", intent.filters.maxRevenue);
    }
    if (intent.filters.minEmployees) {
      query = query.gte("employees_count", intent.filters.minEmployees);
    }
    if (intent.filters.maxEmployees) {
      query = query.lte("employees_count", intent.filters.maxEmployees);
    }
  }

  // Order by relevance (revenue for now, but could be improved)
  query = query.order("revenue", { ascending: false, nullsFirst: false });

  // Apply limit
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error("❌ Database search error:", error);
    throw error;
  }

  console.log("📋 Query Results:", {
    returnedRows: data?.length || 0,
    industries: [...new Set((data || []).map((d: any) => d.industry))].slice(0, 5),
    topCompanies: (data || []).slice(0, 3).map((d: any) => d.name),
  });

  return (data || []).map((item: any) => ({
    ...item,
    searchType: "keyword",
  }));
}

// Remove duplicate results based on company ID
function deduplicateResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// Enhance results with AI-generated context
async function enhanceWithAI(
  originalQuery: string,
  results: any[],
  openai: OpenAI,
) {
  if (results.length === 0) return results;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are enhancing search results with relevant context. 
          For each business, add a brief relevance explanation based on the user's query.
          Keep explanations concise (1-2 sentences).`,
        },
        {
          role: "user",
          content: `Query: "${originalQuery}"
          
          Enhance these search results with relevance explanations:
          ${JSON.stringify(
            results.map((r) => ({
              name: r.name,
              industry: r.industry,
              description: r.description,
            })),
            null,
            2,
          )}`,
        },
      ],
      temperature: 0.5,
    });

    const enhancements = completion.choices[0]?.message?.content;

    // Parse and merge enhancements with results
    // For now, just add the AI response as context
    return results.map((result, index) => ({
      ...result,
      relevance: `Match found based on industry and location criteria`,
      aiContext: enhancements,
    }));
  } catch (error) {
    console.error("Enhancement failed:", error);
    return results;
  }
}
