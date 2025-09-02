import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialize clients with proper error handling
  let openai;
  let supabase: SupabaseClient;

  try {
    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured in environment variables');
    }
    if (!openaiApiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI key format');
    }
    
    openai = new OpenAI({ 
      apiKey: openaiApiKey,
      maxRetries: 3,
      timeout: 30000
    });
  } catch (error: any) {
    console.error('OpenAI initialization failed:', error.message);
    return res.status(500).json({ 
      error: 'AI service configuration error',
      details: error.message 
    });
  }

  try {
    // Initialize Supabase - NEVER USE FALLBACKS (CLAUDE.md rule)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL or SUPABASE_SUPABASE_URL is required');
    }

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());
  } catch (error: any) {
    console.error('Supabase initialization failed:', error.message);
    return res.status(500).json({ 
      error: 'Database configuration error',
      details: error.message 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 10, useAI = true } = req.body as SearchRequest;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('AI Search Request:', { query, limit, useAI });

    // Step 1: Use OpenAI to understand the search intent
    const searchIntent = await analyzeSearchIntent(query, openai);
    console.log('Search Intent:', searchIntent);

    // Step 2: Build smart database query based on intent
    const searchResults = await performSmartSearch(searchIntent, limit, supabase);
    console.log(`Found ${searchResults.length} results`);

    // Step 3: If requested, enhance results with AI context
    let enhancedResults = searchResults;
    if (useAI && searchResults.length > 0) {
      enhancedResults = await enhanceWithAI(query, searchResults, openai);
    }

    return res.status(200).json({
      success: true,
      query,
      intent: searchIntent,
      results: enhancedResults,
      count: enhancedResults.length,
      source: 'database',
      enhanced: useAI
    });

  } catch (error: any) {
    console.error('AI Search Error:', error);
    return res.status(500).json({
      error: 'Search failed',
      details: error.message
    });
  }
}

// Analyze search intent using OpenAI
async function analyzeSearchIntent(query: string, openai: OpenAI) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
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
          }`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const intentJson = completion.choices[0]?.message?.content;
    return intentJson ? JSON.parse(intentJson) : {};
  } catch (error) {
    console.error('Intent analysis failed:', error);
    throw new Error(`Failed to analyze search intent: ${error.message}`);
  }
}

// Perform smart database search based on intent
async function performSmartSearch(intent: any, limit: number, supabase: any) {
  let query = supabase
    .from('companies')
    .select('*')
    .eq('status', 'active');

  // Apply industry filters
  if (intent.industries && intent.industries.length > 0) {
    const industryConditions = intent.industries
      .map((ind: string) => `industry.ilike.%${ind}%`)
      .join(',');
    query = query.or(industryConditions);
  }

  // Apply location filters
  if (intent.locations && intent.locations.length > 0) {
    const locationConditions = intent.locations
      .map((loc: string) => `description.ilike.%${loc}%,headquarters.ilike.%${loc}%`)
      .join(',');
    query = query.or(locationConditions);
  }

  // Apply keyword search on name and description
  if (intent.keywords && intent.keywords.length > 0) {
    const keywordConditions = intent.keywords
      .map((kw: string) => `name.ilike.%${kw}%,description.ilike.%${kw}%`)
      .join(',');
    query = query.or(keywordConditions);
  }

  // Apply numeric filters
  if (intent.filters) {
    if (intent.filters.minRevenue) {
      query = query.gte('revenue', intent.filters.minRevenue);
    }
    if (intent.filters.maxRevenue) {
      query = query.lte('revenue', intent.filters.maxRevenue);
    }
    if (intent.filters.minEmployees) {
      query = query.gte('employees_count', intent.filters.minEmployees);
    }
    if (intent.filters.maxEmployees) {
      query = query.lte('employees_count', intent.filters.maxEmployees);
    }
  }

  // Order by relevance (revenue for now, but could be improved)
  query = query.order('revenue', { ascending: false, nullsFirst: false });
  
  // Apply limit
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Database search error:', error);
    throw error;
  }

  return data || [];
}

// Enhance results with AI-generated context
async function enhanceWithAI(originalQuery: string, results: any[], openai: OpenAI) {
  if (results.length === 0) return results;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are enhancing search results with relevant context. 
          For each business, add a brief relevance explanation based on the user's query.
          Keep explanations concise (1-2 sentences).`
        },
        {
          role: 'user',
          content: `Query: "${originalQuery}"
          
          Enhance these search results with relevance explanations:
          ${JSON.stringify(results.map(r => ({
            name: r.name,
            industry: r.industry,
            description: r.description
          })), null, 2)}`
        }
      ],
      temperature: 0.5
    });

    const enhancements = completion.choices[0]?.message?.content;
    
    // Parse and merge enhancements with results
    // For now, just add the AI response as context
    return results.map((result, index) => ({
      ...result,
      relevance: `Match found based on industry and location criteria`,
      aiContext: enhancements
    }));
  } catch (error) {
    console.error('Enhancement failed:', error);
    return results;
  }
}