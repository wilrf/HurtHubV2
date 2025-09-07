import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

export const config = {
  maxDuration: 60,
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  module?: "business-intelligence" | "community-pulse";
  sessionId?: string;
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
    // The correct project is osnbklmavnsxpgktdeun (has 299 companies)
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

    // Trim keys to handle any whitespace issues
    supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

    // Debug logging to verify environment variables
    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      urlPrefix: supabaseUrl.substring(0, 30),
      keyPrefix: supabaseKey.substring(0, 20),
    });
  } catch (error: any) {
    console.error("Supabase initialization failed:", error.message);
    return res.status(500).json({
      error: "Database configuration error",
      details: error.message,
    });
  }

  try {
    const {
      messages,
      model = "gpt-4o-mini", // Use real OpenAI model
      temperature = 0.7,
      module = "business-intelligence",
      sessionId = generateSessionId(),
    } = req.body as ChatRequest;

    // Get the user's latest message
    const userMessage = messages[messages.length - 1]?.content || "";

    console.log("🎯 AI Chat Request:", {
      sessionId,
      module,
      userMessage: userMessage.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // Analyze what data the user might need using semantic search
    const startTime = Date.now();
    const businessData = await fetchRelevantBusinessData(userMessage, openai, supabase);
    const searchDuration = Date.now() - startTime;

    console.log("📊 Business Data Fetched:", {
      searchDuration: `${searchDuration}ms`,
      companiesFound: businessData.companies?.length || 0,
      developmentsFound: businessData.developments?.length || 0,
      hasEconomicData: !!businessData.economicIndicators?.length,
      searchIntent: businessData.summary?.searchIntent,
    });

    // Build smart context with real data
    const systemMessage = buildSmartSystemMessage(module, businessData);
    
    console.log("🔨 System Message Built:", {
      messageLength: systemMessage.length,
      includesCompanyData: systemMessage.includes("COMPANIES IN DATABASE"),
      includesDevelopments: systemMessage.includes("RECENT DEVELOPMENTS"),
      includesEconomicData: systemMessage.includes("ECONOMIC INDICATORS"),
    });

    // Create messages with context
    const contextualMessages: ChatMessage[] = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // Call OpenAI with real data context
    console.log("🤖 Calling OpenAI:", {
      model,
      temperature,
      contextMessages: contextualMessages.length,
      systemMessagePreview: systemMessage.substring(0, 200),
    });

    const openaiStart = Date.now();
    const completion = await openai.chat.completions.create({
      model,
      messages: contextualMessages,
      temperature: 0.3, // Lower temperature to reduce creativity/hallucination
      max_tokens: 2000,
    });
    const openaiDuration = Date.now() - openaiStart;

    const responseContent = completion.choices[0]?.message?.content || "";

    console.log("✅ OpenAI Response:", {
      duration: `${openaiDuration}ms`,
      model: completion.model,
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
      responseLength: responseContent.length,
      responsePreview: responseContent.substring(0, 150),
    });

    // Monitor attribution accuracy (logging only, non-blocking)
    const knownCompanyNames = businessData.companies?.map((c: any) => c.name.toLowerCase()) || [];
    const responseWords = responseContent.toLowerCase();
    const userWords = userMessage.toLowerCase();
    
    // Track external company mentions to verify proper attribution
    const externalCompanies = ['starbucks', 'mcdonalds', 'walmart', 'target', 'amazon', 'red lobster'];
    const mentionedExternals = externalCompanies.filter(company => responseWords.includes(company));
    
    if (mentionedExternals.length > 0) {
      // Check if these are properly attributed
      const hasAttribution = responseWords.includes('general knowledge') || 
                           responseWords.includes('not in our database') ||
                           responseWords.includes('general market');
      
      console.log("📊 Attribution Check:", {
        sessionId,
        externalCompanies: mentionedExternals,
        userMentioned: mentionedExternals.filter(c => userWords.includes(c)),
        hasProperAttribution: hasAttribution,
        timestamp: new Date().toISOString(),
      });
      
      if (!hasAttribution && mentionedExternals.some(c => !userWords.includes(c))) {
        console.warn("⚠️ External company mentioned without clear attribution");
      }
    }
    
    // Track database company mentions to ensure they're marked
    const dbCompaniesInResponse = knownCompanyNames.filter(company => 
      responseWords.includes(company)
    );
    
    if (dbCompaniesInResponse.length > 0) {
      const hasDbAttribution = responseWords.includes('from our database') || 
                              responseWords.includes('in our database');
      
      if (!hasDbAttribution && dbCompaniesInResponse.length > 2) {
        console.log("💡 Consider adding clearer database attribution for:", dbCompaniesInResponse.slice(0, 3));
      }
    }

    // Store conversation in database
    await storeConversation(sessionId, messages, responseContent, supabase);

    return res.status(200).json({
      content: responseContent,
      usage: completion.usage,
      model: completion.model,
      sessionId,
      metadata: {
        dataSource: "local_database",
        companiesProvided: businessData.companies?.length || 0,
        searchIntent: businessData.summary?.searchIntent || "general",
        totalRevenue: businessData.summary?.totalRevenue || 0,
        totalEmployees: businessData.summary?.totalEmployees || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);

    // Add debugging info in development
    const debugInfo =
      process.env.NODE_ENV !== "production"
        ? {
            hasOpenAI: !!process.env.OPENAI_API_KEY,
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            errorType: error.constructor.name,
            errorCode: (error as any).code,
          }
        : {};

    if (error.status === 401) {
      return res.status(401).json({
        error: "Invalid OpenAI API key. Please check your configuration.",
        debug: debugInfo,
      });
    }

    return res.status(500).json({
      error: "Failed to process chat request",
      details: error.message,
      debug: debugInfo,
    });
  }
}

// Fetch relevant business data based on user query using AI-powered search
async function fetchRelevantBusinessData(query: string, openai: OpenAI, supabase: SupabaseClient) {
  const data: any = {
    companies: [],
    developments: [],
    economicIndicators: [],
    summary: {},
  };

  try {
    // Use semantic search with embeddings for better results
    console.log(`🔍 Performing semantic search for: ${query}`);
    
    // 1. Generate query embedding using OpenAI
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });
    
    // 2. Call database function via Supabase RPC for semantic search
    const { data: searchResults, error: searchError } = await supabase.rpc(
      'semantic_business_search',
      {
        query_embedding: queryEmbedding.data[0].embedding,
        limit_count: 20
      }
    );

    if (searchError) {
      console.error("Semantic search error:", searchError);
      // Fall back to basic text search if semantic search fails
      const { data: fallbackResults } = await supabase
        .from('businesses')
        .select('*')
        .or(`name.ilike.%${query}%,industry.ilike.%${query}%`)
        .limit(20);
      
      data.companies = fallbackResults || [];
    } else {
      // Get full business details for the semantic search results
      const businessIds = searchResults.map((r: any) => r.id);
      const { data: businessDetails } = await supabase
        .from('businesses')
        .select('*')
        .in('id', businessIds);
      
      data.companies = businessDetails || [];
    }
    
    data.summary.searchIntent = detectSearchIntent(query);
    data.summary.totalCompanies = data.companies.length;

    // Calculate summary statistics
    if (data.companies.length > 0) {
      data.summary.totalRevenue = data.companies.reduce(
        (sum: number, c: any) => sum + (c.revenue || 0),
        0,
      );
      data.summary.totalEmployees = data.companies.reduce(
        (sum: number, c: any) => sum + (c.employees || 0),
        0,
      );
      
      // Log the actual companies found
      console.log("🏢 Companies Found:", {
        count: searchData.results.length,
        topCompanies: searchData.results.slice(0, 5).map((c: any) => ({
          name: c.name,
          industry: c.industry,
          revenue: c.revenue,
          employees: c.employees_count,
        })),
        industries: [...new Set(searchData.results.map((c: any) => c.industry))].slice(0, 10),
      });
    }

    console.log(
      `✨ AI Search Summary:`,
      {
        companiesFound: searchData.results.length,
        intent: searchData.intent,
        source: searchData.source || "database",
        enhanced: searchData.enhanced,
        totalRevenue: data.summary.totalRevenue,
        totalEmployees: data.summary.totalEmployees,
      }
    );
    return data;
  } catch (error: any) {
    console.error("AI-powered search failed:", error);
    throw new Error(`Failed to fetch business data: ${error.message}`);
  }
}

// Build system message with real business data
function buildSmartSystemMessage(module: string, businessData: any): string {
  let systemMessage = `You are a Charlotte business intelligence assistant with access to a local business database.

RESPONSE GUIDELINES - NATURAL CONVERSATION WITH CLEAR ATTRIBUTION:

1. DATABASE FIRST: Always prioritize and highlight businesses from our database
2. NATURAL ATTRIBUTION: Use inline attribution naturally in your responses:
   - "(from our database)" or "(in our database)" for local businesses
   - "(general market knowledge)" for industry insights not in our data
   - "(per your mention)" when the user brings up a specific business
   - "(not in our database)" when acknowledging businesses we don't track

3. CONVERSATIONAL APPROACH:
   - Be helpful and informative, never refuse reasonable business discussions
   - When users mention companies like Starbucks, McDonald's, etc., you can discuss them
   - Just be clear about what's from our database vs. general knowledge
   
4. EXAMPLE RESPONSES:
   ✅ "Looking at our database, Harbor Grill (from our database) has $2.3M revenue with 35 employees. For comparison, a typical Red Lobster (general market knowledge) has 80-100 employees."
   ✅ "Bob's Seafood (per your mention) isn't in our database, but based on the 3 seafood restaurants we track in Huntersville..."
   ✅ "While Starbucks (not in our database) dominates nationally, our local coffee shops like Queen City Grounds (from our database) show strong revenue of $1.2M"

5. DATA ACCURACY:
   - All specific numbers, revenue figures, and employee counts MUST come from the database below
   - Industry insights and comparisons can use general knowledge but must be labeled as such`;

  // Add actual data context
  if (businessData.companies && businessData.companies.length > 0) {
    systemMessage += `\n\nONLY THESE COMPANIES EXIST IN OUR DATABASE (${businessData.companies.length} shown):`;
    businessData.companies.slice(0, 5).forEach((company: any) => {
      systemMessage += `\n- ${company.name} (${company.industry}): $${(company.revenue || 0).toLocaleString()} revenue, ${company.employees_count || "N/A"} employees`;
    });
  }

  if (businessData.developments && businessData.developments.length > 0) {
    systemMessage += `\n\nRECENT DEVELOPMENTS:`;
    businessData.developments.slice(0, 3).forEach((dev: any) => {
      systemMessage += `\n- ${dev.title} (${dev.companies?.name || "Unknown"})`;
    });
  }

  if (businessData.summary.latestEconomic) {
    const eco = businessData.summary.latestEconomic;
    systemMessage += `\n\nLATEST ECONOMIC INDICATORS (${eco.date}):`;
    systemMessage += `\n- Unemployment Rate: ${eco.unemploymentRate}%`;
    systemMessage += `\n- GDP Growth: ${eco.gdpGrowth}%`;
    systemMessage += `\n- Job Growth: ${eco.jobGrowth}`;
  }

  if (businessData.summary.totalCompanies) {
    systemMessage += `\n\nMARKET SUMMARY:`;
    systemMessage += `\n- Total Companies Analyzed: ${businessData.summary.totalCompanies}`;
    systemMessage += `\n- Combined Revenue: $${businessData.summary.totalRevenue?.toLocaleString() || 0}`;
    systemMessage += `\n- Total Employees: ${businessData.summary.totalEmployees?.toLocaleString() || 0}`;
    if (businessData.summary.topIndustries) {
      systemMessage += `\n- Top Industries: ${businessData.summary.topIndustries.map((i: any) => i.industry).join(", ")}`;
    }
  }

  // Module-specific instructions
  if (module === "business-intelligence") {
    systemMessage += `\n\nFocus on market analysis, competitive intelligence, and business metrics. 
Provide specific company names, actual revenue figures, and real data from the database above.`;
  } else {
    systemMessage += `\n\nFocus on community dynamics, local business relationships, and economic impact. 
Reference specific businesses and real data from the database above.`;
  }

  systemMessage += `\n\nKEY REMINDERS: 
- Lead with database companies when available, clearly marked "(from our database)"
- You CAN discuss external companies if relevant, marked "(general knowledge)" or "(not in our database)"
- Specific numbers (revenue, employees) must ONLY come from the database above
- Help users understand both our local market data AND broader context when useful`;

  return systemMessage;
}

// Store conversation in Supabase using proper schema
async function storeConversation(
  sessionId: string,
  messages: ChatMessage[],
  aiResponse: string,
  supabase: SupabaseClient,
): Promise<void> {
  try {
    // Build complete conversation history including system message
    const conversationMessages = [
      ...messages,
      { role: "assistant", content: aiResponse }
    ];

    const { error } = await supabase.from("ai_conversations").insert({
      session_id: sessionId,
      user_id: null, // Anonymous for now - can be set when auth is implemented
      messages: conversationMessages,
      metadata: {
        module: "business-intelligence",
        model: "gpt-4o-mini",
        token_usage: {
          total_tokens: 0, // Would calculate from OpenAI response
        },
        conversation_length: conversationMessages.length,
        created_via: "ai-chat-simple"
      },
      // embeddings will be generated asynchronously if needed
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to store conversation:", error);
      throw error;
    }

    console.log(`✅ Conversation stored: ${sessionId} (${conversationMessages.length} messages)`);
  } catch (error: any) {
    console.error("Error storing conversation:", error);
    throw new Error(`Failed to store conversation: ${error.message}`);
  }
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to detect search intent from query
function detectSearchIntent(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('restaurant') || lowerQuery.includes('food') || lowerQuery.includes('dining')) {
    return 'restaurants';
  } else if (lowerQuery.includes('tech') || lowerQuery.includes('software') || lowerQuery.includes('it')) {
    return 'technology';
  } else if (lowerQuery.includes('retail') || lowerQuery.includes('shop') || lowerQuery.includes('store')) {
    return 'retail';
  } else if (lowerQuery.includes('revenue') || lowerQuery.includes('profit') || lowerQuery.includes('financial')) {
    return 'financial';
  } else if (lowerQuery.includes('employee') || lowerQuery.includes('staff') || lowerQuery.includes('hiring')) {
    return 'employment';
  } else if (lowerQuery.includes('downtown') || lowerQuery.includes('location') || lowerQuery.includes('where')) {
    return 'location';
  } else {
    return 'general';
  }
}
