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

    // Analyze what data the user might need using AI-powered search
    const businessData = await fetchRelevantBusinessData(userMessage);

    // Build smart context with real data
    const systemMessage = buildSmartSystemMessage(module, businessData);

    // Create messages with context
    const contextualMessages: ChatMessage[] = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // Call OpenAI with real data context
    const completion = await openai.chat.completions.create({
      model,
      messages: contextualMessages,
      temperature,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content || "";

    // Store conversation in database
    await storeConversation(sessionId, messages, responseContent, supabase);

    return res.status(200).json({
      content: responseContent,
      usage: completion.usage,
      model: completion.model,
      sessionId,
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
async function fetchRelevantBusinessData(query: string) {
  const data: any = {
    companies: [],
    developments: [],
    economicIndicators: [],
    summary: {},
  };

  try {
    // Use AI-powered search for better results - NO FALLBACKS
    // Get base URL for API calls - Vercel-only deployment
    const vercelUrl = process.env.VERCEL_URL;
    if (!vercelUrl) {
      throw new Error(
        "VERCEL_URL environment variable is required - this app only runs on Vercel",
      );
    }
    const baseUrl = `https://${vercelUrl}`;

    console.log(`Making AI search request to: ${baseUrl}/api/ai-search`);
    const searchResponse = await fetch(`${baseUrl}/api/ai-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit: 20,
        useAI: true,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`AI search failed with status ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    if (!searchData.results) {
      throw new Error("AI search returned invalid response format");
    }

    data.companies = searchData.results;
    data.summary.searchIntent = searchData.intent;
    data.summary.totalCompanies = searchData.results.length;

    // Calculate summary statistics
    if (searchData.results.length > 0) {
      data.summary.totalRevenue = searchData.results.reduce(
        (sum: number, c: any) => sum + (c.revenue || 0),
        0,
      );
      data.summary.totalEmployees = searchData.results.reduce(
        (sum: number, c: any) => sum + (c.employees_count || 0),
        0,
      );
    }

    console.log(
      `AI Search returned ${searchData.results.length} relevant companies`,
    );
    return data;
  } catch (error: any) {
    console.error("AI-powered search failed:", error);
    throw new Error(`Failed to fetch business data: ${error.message}`);
  }
}

// Build system message with real business data
function buildSmartSystemMessage(module: string, businessData: any): string {
  let systemMessage = `You are an AI assistant specialized in business intelligence for Charlotte, NC. 
You have access to real business data and should provide specific, data-driven insights.`;

  // Add actual data context
  if (businessData.companies && businessData.companies.length > 0) {
    systemMessage += `\n\nCOMPANIES IN DATABASE (${businessData.companies.length} shown):`;
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

  systemMessage += `\n\nIMPORTANT: Use the real data provided above in your responses. Be specific with company names, numbers, and trends.`;

  return systemMessage;
}

// Store conversation in Supabase
async function storeConversation(
  sessionId: string,
  messages: ChatMessage[],
  aiResponse: string,
  supabase: SupabaseClient,
): Promise<void> {
  try {
    const userMessage = messages[messages.length - 1]?.content || "";

    const { error } = await supabase.from("ai_conversations").insert({
      session_id: sessionId,
      user_message: userMessage,
      ai_response: aiResponse,
      module: "business-intelligence",
      token_usage: {
        total_tokens: 0, // Would need to calculate from OpenAI response
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to store conversation:", error);
      // NO FALLBACK - Let it fail
      throw error;
    }
  } catch (error: any) {
    console.error("Error storing conversation:", error);
    throw new Error(`Failed to store conversation: ${error.message}`);
  }
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
