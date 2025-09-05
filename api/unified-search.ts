import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const config = {
  maxDuration: 30,
};

interface UnifiedSearchRequest {
  query: string;
  searchType?: "semantic" | "keyword" | "hybrid";
  filters?: {
    industry?: string[];
    location?: string[];
    minRevenue?: number;
    maxRevenue?: number;
    minEmployees?: number;
    maxEmployees?: number;
  };
  limit?: number;
  includeAnalytics?: boolean;
  enhanceWithAI?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Initialize clients
  let supabase;
  let openai;

  try {
    // Initialize Supabase
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

    // Initialize OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    openai = new OpenAI({
      apiKey: openaiApiKey,
      maxRetries: 3,
      timeout: 30000,
    });
  } catch (error: any) {
    console.error("Client initialization failed:", error.message);
    return res.status(500).json({
      error: "Service configuration error",
      details: error.message,
    });
  }

  try {
    const {
      query,
      searchType = "hybrid",
      filters = {},
      limit = 10,
      includeAnalytics = false,
      enhanceWithAI = false,
    } = req.body as UnifiedSearchRequest;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Unified Search Request:", {
      query,
      searchType,
      filters,
      limit,
    });

    let results: any[] = [];
    let searchMethods: string[] = [];

    // Perform search based on type
    switch (searchType) {
      case "semantic":
        results = await performSemanticSearch(
          query,
          openai,
          supabase,
          limit,
          filters,
        );
        searchMethods = ["semantic"];
        break;

      case "keyword":
        results = await performKeywordSearch(query, supabase, limit, filters);
        searchMethods = ["keyword"];
        break;

      case "hybrid":
      default:
        // Hybrid approach: 70% semantic, 30% keyword
        const semanticLimit = Math.ceil(limit * 0.7);
        const keywordLimit = Math.ceil(limit * 0.3);

        const [semanticResults, keywordResults] = await Promise.all([
          performSemanticSearch(
            query,
            openai,
            supabase,
            semanticLimit,
            filters,
          ).catch((err) => {
            console.warn("Semantic search failed:", err);
            return [];
          }),
          performKeywordSearch(query, supabase, keywordLimit, filters),
        ]);

        // Combine and deduplicate
        const combined = [...semanticResults, ...keywordResults];
        results = deduplicateResults(combined).slice(0, limit);
        searchMethods = ["semantic", "keyword"];
        break;
    }

    // Enhance with AI context if requested
    if (enhanceWithAI && results.length > 0) {
      results = await enhanceResultsWithAI(query, results, openai);
    }

    // Include analytics if requested
    let analytics = null;
    if (includeAnalytics) {
      analytics = await calculateSearchAnalytics(results);
    }

    return res.status(200).json({
      success: true,
      query,
      searchType,
      methods: searchMethods,
      results: results.map((result) => ({
        ...result,
        relevanceScore:
          result.similarity || calculateKeywordRelevance(query, result),
      })),
      count: results.length,
      analytics,
      source: "database",
      enhanced: enhanceWithAI,
    });
  } catch (error: any) {
    console.error("Unified Search Error:", error);
    return res.status(500).json({
      error: "Search failed",
      details: error.message,
    });
  }
}

// Semantic search using embeddings
async function performSemanticSearch(
  query: string,
  openai: OpenAI,
  supabase: any,
  limit: number,
  filters: any,
): Promise<any[]> {
  try {
    // Generate embedding for search query
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });

    const queryEmbedding = response.data[0].embedding;

    // Call semantic search function
    const { data, error } = await supabase.rpc("semantic_business_search", {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,
      match_count: limit * 2, // Get more for filtering
    });

    if (error) {
      throw new Error(`Semantic search failed: ${error.message}`);
    }

    let results = data || [];

    // Apply additional filters
    results = applyFilters(results, filters);

    return results.slice(0, limit).map((item: any) => ({
      ...item,
      similarity: item.similarity,
      searchMethod: "semantic",
    }));
  } catch (error) {
    console.error("Semantic search error:", error);
    return [];
  }
}

// Keyword-based search
async function performKeywordSearch(
  query: string,
  supabase: any,
  limit: number,
  filters: any,
): Promise<any[]> {
  try {
    let dbQuery = supabase.from("companies").select("*").eq("status", "active");

    // Text search across multiple fields
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 2);
    if (searchTerms.length > 0) {
      const conditions = searchTerms
        .map(
          (term) =>
            `name.ilike.%${term}%,description.ilike.%${term}%,industry.ilike.%${term}%`,
        )
        .join(",");
      dbQuery = dbQuery.or(conditions);
    }

    // Apply filters
    if (filters.industry?.length) {
      const industryConditions = filters.industry
        .map((ind: string) => `industry.ilike.%${ind}%`)
        .join(",");
      dbQuery = dbQuery.or(industryConditions);
    }

    if (filters.location?.length) {
      const locationConditions = filters.location
        .map((loc: string) => `headquarters.ilike.%${loc}%`)
        .join(",");
      dbQuery = dbQuery.or(locationConditions);
    }

    if (filters.minRevenue) {
      dbQuery = dbQuery.gte("revenue", filters.minRevenue);
    }
    if (filters.maxRevenue) {
      dbQuery = dbQuery.lte("revenue", filters.maxRevenue);
    }
    if (filters.minEmployees) {
      dbQuery = dbQuery.gte("employees_count", filters.minEmployees);
    }
    if (filters.maxEmployees) {
      dbQuery = dbQuery.lte("employees_count", filters.maxEmployees);
    }

    dbQuery = dbQuery
      .order("revenue", { ascending: false, nullsFirst: false })
      .limit(limit);

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Keyword search failed: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      searchMethod: "keyword",
    }));
  } catch (error) {
    console.error("Keyword search error:", error);
    return [];
  }
}

// Apply additional filters to results
function applyFilters(results: any[], filters: any): any[] {
  return results.filter((item) => {
    if (filters.minRevenue && (item.revenue || 0) < filters.minRevenue)
      return false;
    if (filters.maxRevenue && (item.revenue || 0) > filters.maxRevenue)
      return false;
    if (
      filters.minEmployees &&
      (item.employees_count || 0) < filters.minEmployees
    )
      return false;
    if (
      filters.maxEmployees &&
      (item.employees_count || 0) > filters.maxEmployees
    )
      return false;

    if (filters.industry?.length) {
      const hasIndustryMatch = filters.industry.some((ind: string) =>
        item.industry?.toLowerCase().includes(ind.toLowerCase()),
      );
      if (!hasIndustryMatch) return false;
    }

    if (filters.location?.length) {
      const hasLocationMatch = filters.location.some((loc: string) =>
        item.headquarters?.toLowerCase().includes(loc.toLowerCase()),
      );
      if (!hasLocationMatch) return false;
    }

    return true;
  });
}

// Remove duplicate results
function deduplicateResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// Calculate keyword relevance score
function calculateKeywordRelevance(query: string, result: any): number {
  if (result.similarity) return result.similarity; // Already has semantic score

  const queryTerms = query.toLowerCase().split(/\s+/);
  const text =
    `${result.name} ${result.description || ""} ${result.industry || ""}`.toLowerCase();

  let score = 0;
  queryTerms.forEach((term) => {
    const occurrences = (text.match(new RegExp(term, "g")) || []).length;
    score += occurrences * 0.1;
  });

  // Boost score for name matches
  if (result.name?.toLowerCase().includes(query.toLowerCase())) {
    score += 0.5;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

// Enhance results with AI-generated context
async function enhanceResultsWithAI(
  query: string,
  results: any[],
  openai: OpenAI,
): Promise<any[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are enhancing business search results. For each business, provide a brief (1 sentence) explanation of why it's relevant to the user's query. Focus on specific business attributes.`,
        },
        {
          role: "user",
          content: `Query: "${query}"\n\nEnhance these search results with relevance explanations:\n${JSON.stringify(
            results.map((r) => ({
              name: r.name,
              industry: r.industry,
              description: r.description?.substring(0, 200),
            })),
            null,
            2,
          )}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const enhancement = completion.choices[0]?.message?.content || "";

    return results.map((result, index) => ({
      ...result,
      aiContext:
        enhancement.split("\n")[index] ||
        "Relevant match found based on search criteria.",
      enhanced: true,
    }));
  } catch (error) {
    console.error("AI enhancement failed:", error);
    return results.map((result) => ({
      ...result,
      enhanced: false,
    }));
  }
}

// Calculate search analytics
async function calculateSearchAnalytics(results: any[]) {
  if (results.length === 0) return null;

  const totalRevenue = results.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const totalEmployees = results.reduce(
    (sum, r) => sum + (r.employees_count || 0),
    0,
  );

  const industries = results.reduce((acc, r) => {
    const industry = r.industry || "Unknown";
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {});

  return {
    totalResults: results.length,
    totalRevenue,
    totalEmployees,
    averageRevenue: totalRevenue / results.length,
    averageEmployees: totalEmployees / results.length,
    topIndustries: Object.entries(industries)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5),
  };
}
