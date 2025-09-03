import { api } from "@/services/api";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  sessionId?: string;
  module?: "business-intelligence" | "community-pulse";
}

export interface ChatResponse {
  content: string;
  sessionId?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export interface AnalysisRequest {
  type: "code" | "business" | "market" | "competitive";
  data: any;
  depth?: "quick" | "standard" | "deep";
  context?: string;
}

export interface AnalysisResponse {
  analysis: string;
  insights: {
    keyFindings: string[];
    recommendations: string[];
    risks: string[];
    opportunities: string[];
    metrics: Record<string, any>;
    priority: "low" | "medium" | "high";
  };
  metadata: {
    type: string;
    depth: string;
    model: string;
    tokens: any;
    timestamp: string;
  };
}

// GPT-4 Chat Completion with memory and context
export async function createChatCompletion(
  req: ChatRequest,
): Promise<ChatResponse> {
  try {
    if (req.stream) {
      // For streaming, use raw fetch with API URL helper
      const res = await fetch(api.getUrl("/ai-chat-simple"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: req.messages,
          model: req.model || "gpt-4o-mini", // Default to gpt-4o-mini
          temperature: req.temperature || 0.7,
          stream: req.stream || false,
          sessionId: req.sessionId || generateSessionId(),
          module: req.module || "business-intelligence",
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `GPT-4 API failed: ${res.status} - ${detail.substring(0, 200)}`,
        );
      }

      return handleStreamingResponse(res);
    }

    // For non-streaming, use the API service
    const data = await api.post("/ai-chat-simple", {
      messages: req.messages,
      model: req.model || "gpt-4o-mini",
      temperature: req.temperature || 0.7,
      stream: false,
      sessionId: req.sessionId || generateSessionId(),
      module: req.module || "business-intelligence",
    });

    return {
      content: data.content || "",
      sessionId: data.sessionId,
      usage: data.usage,
      model: data.model,
    };
  } catch (error) {
    console.error("GPT-4 Chat Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to complete chat with GPT-4");
  }
}

// Health Check Function
export async function checkDatabaseHealth(): Promise<any> {
  try {
    return await api.get("/health-check");
  } catch (error) {
    console.error("Database health check failed:", error);
    return null;
  }
}

// Smart Data Query Function
export async function queryBusinessData(
  query: string,
  type: 'companies' | 'developments' | 'economic' | 'comprehensive' | 'search',
  filters?: any,
  context?: string
): Promise<any> {
  try {
    return await api.post("/data-query", {
      query,
      type,
      filters,
      context
    });
  } catch (error) {
    console.error("Business data query failed:", error);
    return null;
  }
}

// Enhanced Chat Completion with Database Context
export async function createSmartChatCompletion(
  req: ChatRequest,
): Promise<ChatResponse> {
  try {
    // First, check if we need business data context
    const needsBusinessData = await analyzeQueryForBusinessData(req.messages);

    let businessContext = null;
    if (needsBusinessData.needsData) {
      // Query relevant business data
      businessContext = await queryBusinessData(
        needsBusinessData.query,
        needsBusinessData.queryType,
        needsBusinessData.filters,
        extractConversationContext(req.messages)
      );
    }

    // Enhance the system message with business context
    const enhancedMessages = await enhanceMessagesWithContext(
      req.messages,
      businessContext,
      req.module
    );

    // Create the enhanced request
    const enhancedReq: ChatRequest = {
      ...req,
      messages: enhancedMessages
    };

    // Proceed with regular chat completion
    return await createChatCompletion(enhancedReq);
  } catch (error) {
    console.error("Smart chat completion failed:", error);
    // Fallback to regular chat completion
    return await createChatCompletion(req);
  }
}

// Deep Analysis with GPT-4's advanced reasoning
export async function performDeepAnalysis(
  req: AnalysisRequest,
): Promise<AnalysisResponse> {
  try {
    return await api.post("/analyze", {
      type: req.type,
      data: req.data,
      depth: req.depth || "standard",
      context: req.context,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error instanceof Error ? error : new Error("Analysis failed");
  }
}

// Context Management Functions
export async function storeContext(
  sessionId: string,
  messages: ChatMessage[],
): Promise<boolean> {
  try {
    await api.post("/context", {
      action: "store",
      sessionId,
      messages,
    });
    return true;
  } catch (error) {
    console.error("Failed to store context:", error);
    return false;
  }
}

export async function retrieveContext(
  sessionId: string,
  limit: number = 10,
): Promise<any> {
  try {
    return await api.post("/context", {
      action: "retrieve",
      sessionId,
      limit,
    });
  } catch (error) {
    console.error("Failed to retrieve context:", error);
    return null;
  }
}

export async function searchContext(
  query: string,
  userId?: string,
): Promise<any> {
  try {
    return await api.post("/context", {
      action: "search",
      query,
      userId,
    });
  } catch (error) {
    console.error("Failed to search context:", error);
    return null;
  }
}

export async function summarizeConversation(
  sessionId: string,
): Promise<string> {
  try {
    const data = await api.post("/context", {
      action: "summarize",
      sessionId,
    });
    return data.summary || "";
  } catch (error) {
    console.error("Failed to summarize conversation:", error);
    return "";
  }
}

// Handle streaming responses from GPT-5
async function handleStreamingResponse(
  response: Response,
): Promise<ChatResponse> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let content = "";

  if (!reader) throw new Error("No response body");

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            content += parsed.content || "";
          } catch (_e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return { content };
  } finally {
    reader.releaseLock();
  }
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper Functions for Smart AI Context

// Analyze if a query needs business data context
async function analyzeQueryForBusinessData(messages: ChatMessage[]): Promise<{
  needsData: boolean;
  query: string;
  queryType: 'companies' | 'developments' | 'economic' | 'comprehensive' | 'search';
  filters?: any;
}> {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return { needsData: false, query: '', queryType: 'search' };
  }

  const userQuery = lastMessage.content.toLowerCase();

  // Keywords that indicate business data queries
  const businessKeywords = [
    'company', 'companies', 'business', 'industry', 'sector',
    'revenue', 'employees', 'market', 'economic', 'gdp',
    'unemployment', 'growth', 'investment', 'development',
    'news', 'charlotte', 'nc', 'analysis', 'data', 'statistics'
  ];

  const needsData = businessKeywords.some(keyword => userQuery.includes(keyword));

  if (!needsData) {
    return { needsData: false, query: '', queryType: 'search' };
  }

  // Determine query type and filters based on content
  let queryType: 'companies' | 'developments' | 'economic' | 'comprehensive' | 'search' = 'search';
  const filters: any = {};

  if (userQuery.includes('company') || userQuery.includes('business')) {
    queryType = 'companies';
  } else if (userQuery.includes('news') || userQuery.includes('development')) {
    queryType = 'developments';
  } else if (userQuery.includes('economic') || userQuery.includes('gdp') || userQuery.includes('unemployment')) {
    queryType = 'economic';
  } else if (userQuery.includes('market') || userQuery.includes('analysis')) {
    queryType = 'comprehensive';
  }

  // Extract industry/sector filters
  const industries = ['financial', 'technology', 'retail', 'healthcare', 'manufacturing', 'energy'];
  const foundIndustry = industries.find(industry => userQuery.includes(industry));
  if (foundIndustry) {
    filters.industry = foundIndustry;
  }

  return {
    needsData: true,
    query: lastMessage.content,
    queryType,
    filters
  };
}

// Extract conversation context for better data querying
function extractConversationContext(messages: ChatMessage[]): string {
  const recentMessages = messages.slice(-5); // Last 5 messages for context
  return recentMessages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
}

// Enhance messages with business context
async function enhanceMessagesWithContext(
  messages: ChatMessage[],
  businessContext: any,
  module?: string
): Promise<ChatMessage[]> {
  if (!businessContext?.data) {
    return messages;
  }

  // Create enhanced system message with business context
  let systemMessage = messages.find(msg => msg.role === 'system');

  if (!systemMessage) {
    systemMessage = {
      role: 'system',
      content: getDefaultSystemMessage(module)
    };
  }

  // Add business data context to system message
  const contextString = formatBusinessContext(businessContext.data);
  systemMessage.content += `\n\nCURRENT BUSINESS CONTEXT:\n${contextString}`;

  // Return messages with enhanced system message
  return [
    systemMessage,
    ...messages.filter(msg => msg.role !== 'system')
  ];
}

// Format business data for context injection
function formatBusinessContext(data: any): string {
  let context = '';

  if (data.companies && data.companies.length > 0) {
    context += `COMPANIES IN DATABASE:\n`;
    data.companies.slice(0, 5).forEach((company: any) => {
      context += `- ${company.name} (${company.industry}): $${company.revenue?.toLocaleString() || 'N/A'} revenue, ${company.employees_count || 'N/A'} employees\n`;
    });
    context += '\n';
  }

  if (data.developments && data.developments.length > 0) {
    context += `RECENT DEVELOPMENTS:\n`;
    data.developments.slice(0, 3).forEach((dev: any) => {
      context += `- ${dev.title} (${dev.companies?.name || 'Unknown company'})\n`;
    });
    context += '\n';
  }

  if (data.economicIndicators && data.economicIndicators.length > 0) {
    const latest = data.economicIndicators[0];
    context += `ECONOMIC INDICATORS:\n`;
    context += `- Unemployment: ${latest.unemployment_rate}%\n`;
    context += `- GDP Growth: ${latest.gdp_growth}%\n`;
    context += `- Job Growth: ${latest.job_growth}\n`;
    context += '\n';
  }

  if (data.marketSummary) {
    const summary = data.marketSummary;
    context += `MARKET SUMMARY:\n`;
    context += `- Total Companies: ${summary.overview.totalCompanies}\n`;
    context += `- Recent Developments: ${summary.overview.totalDevelopments}\n`;
    if (summary.insights.topIndustries.length > 0) {
      context += `- Top Industries: ${summary.insights.topIndustries.map((i: any) => i.industry).join(', ')}\n`;
    }
    context += '\n';
  }

  return context || 'No business data available in database.';
}

// Default system message for business AI
function getDefaultSystemMessage(module?: string): string {
  const baseMessage = `You are an advanced AI assistant powered by GPT-4, specialized in business intelligence and economic analysis for Charlotte, NC.
You have access to comprehensive business data including company information, revenue analytics, employment statistics, and market trends.
Provide deep, cutting-edge analysis with actionable insights.`;

  if (module === 'business-intelligence') {
    return `${baseMessage}

Focus on:
- Market trend analysis and predictions
- Competitive intelligence and benchmarking
- Revenue and growth opportunity identification
- Industry performance metrics and KPIs
- Strategic business recommendations

Use your enhanced reasoning capabilities to provide comprehensive analysis.`;
  }

  return baseMessage;
}
