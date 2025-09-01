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

// GPT-5 Chat Completion with memory and context
export async function createChatCompletion(req: ChatRequest): Promise<ChatResponse> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: req.messages,
        model: req.model || "gpt-5", // Default to GPT-5
        temperature: req.temperature || 0.7,
        stream: req.stream || false,
        sessionId: req.sessionId || generateSessionId(),
        module: req.module || "business-intelligence",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`GPT-5 API failed: ${res.status} - ${detail.substring(0, 200)}`);
    }

    if (req.stream) {
      // Handle streaming response
      return handleStreamingResponse(res);
    }

    const data = await res.json();
    return {
      content: data.content || "",
      sessionId: data.sessionId,
      usage: data.usage,
      model: data.model,
    };
  } catch (error) {
    console.error("GPT-5 Chat Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to complete chat with GPT-5");
  }
}

// Deep Analysis with GPT-5's advanced reasoning
export async function performDeepAnalysis(req: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: req.type,
        data: req.data,
        depth: req.depth || "standard",
        context: req.context,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Analysis API failed: ${res.status} - ${detail}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error instanceof Error ? error : new Error("Analysis failed");
  }
}

// Context Management Functions
export async function storeContext(sessionId: string, messages: ChatMessage[]): Promise<boolean> {
  try {
    const res = await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "store",
        sessionId,
        messages,
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to store context:", error);
    return false;
  }
}

export async function retrieveContext(sessionId: string, limit: number = 10): Promise<any> {
  try {
    const res = await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "retrieve",
        sessionId,
        limit,
      }),
    });

    if (!res.ok) throw new Error("Failed to retrieve context");
    return await res.json();
  } catch (error) {
    console.error("Failed to retrieve context:", error);
    return null;
  }
}

export async function searchContext(query: string, userId?: string): Promise<any> {
  try {
    const res = await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "search",
        query,
        userId,
      }),
    });

    if (!res.ok) throw new Error("Failed to search context");
    return await res.json();
  } catch (error) {
    console.error("Failed to search context:", error);
    return null;
  }
}

export async function summarizeConversation(sessionId: string): Promise<string> {
  try {
    const res = await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "summarize",
        sessionId,
      }),
    });

    if (!res.ok) throw new Error("Failed to summarize conversation");
    const data = await res.json();
    return data.summary || "";
  } catch (error) {
    console.error("Failed to summarize conversation:", error);
    return "";
  }
}

// Handle streaming responses from GPT-5
async function handleStreamingResponse(response: Response): Promise<ChatResponse> {
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
          } catch (e) {
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
