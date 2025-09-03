import { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import {
  createChatCompletion,
  retrieveContext,
  storeContext,
  summarizeConversation,
  performDeepAnalysis,
  type AnalysisResponse,
} from "@/services/aiService";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  analysis?: AnalysisResponse;
  streaming?: boolean;
}

interface UseGPT5ChatOptions {
  module?: "business-intelligence" | "community-pulse";
  enableStreaming?: boolean;
  enableMemory?: boolean;
  model?: string;
  temperature?: number;
}

export function useGPT5Chat(options: UseGPT5ChatOptions = {}) {
  const {
    module = "business-intelligence",
    enableStreaming = true,
    enableMemory = true,
    model = "gpt-5",
    temperature = 0.7,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [conversationSummary, setConversationSummary] = useState<string>("");
  const [streamingContent, setStreamingContent] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize session and load context
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    // Load previous context if memory is enabled
    if (enableMemory) {
      const context = await retrieveContext(newSessionId, 20);
      if (context && context.messages) {
        setMessages(
          context.messages.map((msg: any) => ({
            ...msg,
            id: msg.id || Date.now().toString(),
            timestamp: new Date(msg.timestamp || Date.now()),
          })),
        );
        setConversationSummary(context.summary || "");
      }
    }

    // Add welcome message with GPT-5 capabilities
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: getWelcomeMessage(module, model),
      timestamp: new Date(),
      suggestions: getSuggestedQuestions(module),
    };
    setMessages((prev) => [...prev, welcomeMessage]);
  };

  const getWelcomeMessage = (module: string, model: string) => {
    const gpt5Features = model.includes("gpt-5")
      ? "I'm powered by GPT-5 with advanced reasoning, extended context memory, and deep analytical capabilities. "
      : "";

    if (module === "business-intelligence") {
      return `👋 Welcome to Business Intelligence AI!\n\n${gpt5Features}I can provide cutting-edge analysis including:
      
• **Deep Market Analysis** - Comprehensive industry trends and predictions
• **Competitive Intelligence** - Advanced competitor analysis and positioning
• **Revenue Optimization** - Data-driven growth strategies
• **Risk Assessment** - Proactive risk identification and mitigation
• **Strategic Planning** - Long-term business roadmaps with GPT-5's reasoning

What business challenge would you like to explore today?`;
    } else {
      return `👋 Welcome to Community Pulse AI!\n\n${gpt5Features}I can analyze:
      
• **Community Dynamics** - Complex social and economic patterns
• **Economic Impact** - Multi-factor impact analysis
• **Network Effects** - Business ecosystem relationships
• **Sentiment Analysis** - Deep understanding of community needs
• **Trend Prediction** - Future community development patterns

How can I help you understand Charlotte's business community?`;
    }
  };

  const getSuggestedQuestions = (module: string) => {
    if (module === "business-intelligence") {
      return [
        "Perform a deep analysis of Charlotte's tech industry growth potential",
        "What are the hidden opportunities in our market data?",
        "Compare our business model with top competitors using advanced metrics",
        "Predict revenue trends for the next 12 months with confidence intervals",
        "Identify strategic partnerships that could accelerate growth",
      ];
    } else {
      return [
        "Analyze the economic ripple effects of new business development",
        "What are the emerging community needs not being addressed?",
        "Map the business network connections in Charlotte",
        "Predict community response to proposed economic changes",
        "Identify underserved market segments in local communities",
      ];
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check if this needs deep analysis
    const needsAnalysis = checkIfNeedsAnalysis(input.trim());

    try {
      if (needsAnalysis) {
        // Perform deep analysis first
        const analysisResult = await performDeepAnalysis({
          type: determineAnalysisType(input.trim()),
          data: input.trim(),
          depth: "deep",
          context: conversationSummary,
        });

        const analysisMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: formatAnalysisResponse(analysisResult),
          timestamp: new Date(),
          analysis: analysisResult,
          suggestions: generateFollowUpQuestions(analysisResult),
        };

        setMessages((prev) => [...prev, analysisMessage]);
      } else {
        // Regular chat with GPT-5
        if (enableStreaming) {
          await handleStreamingChat(userMessage);
        } else {
          await handleRegularChat(userMessage);
        }
      }

      // Store context if memory is enabled
      if (enableMemory && sessionId) {
        await storeContext(sessionId, messages.slice(-10));
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const handleStreamingChat = async (userMessage: Message) => {
    const streamMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, streamMessage]);

    try {
      // For streaming, we need to use the raw fetch through the API service URL helper
      const response = await fetch(api.getUrl("/ai-chat-simple"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.slice(-5), userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model,
          temperature,
          stream: true,
          sessionId,
          module,
        }),
      });

      if (!response.ok) throw new Error("Streaming failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
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
                fullContent += parsed.content || "";

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === streamMessage.id
                      ? { ...msg, content: fullContent, streaming: false }
                      : msg,
                  ),
                );
              } catch (_e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    }
  };

  const handleRegularChat = async (userMessage: Message) => {
    const response = await createChatCompletion({
      messages: [...messages.slice(-5), userMessage].map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      model,
      temperature,
      sessionId,
      module,
    });

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
      timestamp: new Date(),
      suggestions:
        Math.random() > 0.5
          ? getSuggestedQuestions(module).slice(0, 3)
          : undefined,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    if (response.sessionId) {
      setSessionId(response.sessionId);
    }
  };

  const checkIfNeedsAnalysis = (input: string): boolean => {
    const analysisKeywords = [
      "analyze",
      "analysis",
      "deep dive",
      "investigate",
      "examine",
      "assess",
      "evaluate",
      "compare",
      "predict",
    ];
    return analysisKeywords.some((keyword) =>
      input.toLowerCase().includes(keyword),
    );
  };

  const determineAnalysisType = (
    input: string,
  ): "code" | "business" | "market" | "competitive" => {
    if (input.includes("code") || input.includes("technical")) return "code";
    if (input.includes("market")) return "market";
    if (input.includes("compet")) return "competitive";
    return "business";
  };

  const formatAnalysisResponse = (analysis: AnalysisResponse): string => {
    let formatted = `## 📊 Deep Analysis Results\n\n${analysis.analysis}\n\n`;

    if (analysis.insights.keyFindings.length > 0) {
      formatted += `### 🔍 Key Findings\n`;
      analysis.insights.keyFindings.forEach((finding) => {
        formatted += `• ${finding}\n`;
      });
    }

    if (analysis.insights.recommendations.length > 0) {
      formatted += `\n### 💡 Recommendations\n`;
      analysis.insights.recommendations.forEach((rec) => {
        formatted += `• ${rec}\n`;
      });
    }

    if (analysis.insights.priority === "high") {
      formatted += `\n⚠️ **Priority: HIGH** - Immediate action recommended`;
    }

    return formatted;
  };

  const generateFollowUpQuestions = (analysis: AnalysisResponse): string[] => {
    const questions: string[] = [];

    if (analysis.insights.opportunities.length > 0) {
      questions.push(
        `Tell me more about the opportunity: ${analysis.insights.opportunities[0]}`,
      );
    }

    if (analysis.insights.risks.length > 0) {
      questions.push(
        `How can we mitigate the risk: ${analysis.insights.risks[0]}`,
      );
    }

    questions.push("Can you provide a more detailed implementation plan?");
    questions.push("What are the success metrics for this strategy?");

    return questions.slice(0, 3);
  };

  const handleError = (error: any) => {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `❌ I encountered an error: ${error.message || "Unknown error occurred"}. Please try again or rephrase your question.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  };

  const summarizeCurrentConversation = async () => {
    if (!sessionId || messages.length < 3) return;

    setIsLoading(true);
    try {
      const summary = await summarizeConversation(sessionId);
      setConversationSummary(summary);

      const summaryMessage: Message = {
        id: "summary",
        role: "system",
        content: `📝 **Conversation Summary:**\n\n${summary}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, summaryMessage]);
    } catch (error) {
      console.error("Failed to summarize:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationSummary("");
    initializeSession();
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return {
    messages,
    input,
    isLoading,
    sessionId,
    conversationSummary,
    streamingContent,
    messagesEndRef,
    setInput,
    handleSendMessage,
    summarizeCurrentConversation,
    clearConversation,
    stopStreaming,
  };
}
