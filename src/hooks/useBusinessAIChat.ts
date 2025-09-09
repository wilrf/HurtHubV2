import { useState, useEffect, useRef, useCallback } from "react";

import { businessDataService } from "@/services/businessDataService";
import { api } from "@/services/api";

// Business types removed - data is loaded but not stored in state

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function useBusinessAIChat(
  module: "business-intelligence" | "community-pulse",
  skipDataLoading = false,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Removed unused getWelcomeMessage function - messages start empty per design

  const getSuggestedQuestions = useCallback(() => {
    if (module === "business-intelligence") {
      return [
        "What are the top performing industries in Charlotte?",
        "Which neighborhoods have the highest business revenue?",
        "Show me companies with high revenue growth",
        "Compare average employees by industry",
        "What's the revenue distribution across business types?",
      ];
    } else {
      return [
        "What's the business sentiment in different neighborhoods?",
        "How are local businesses collaborating?",
        "Which communities show strong economic growth?",
        "Tell me about business clustering patterns",
        "What are the emerging business trends?",
      ];
    }
  }, [module]);

  const loadDataAndInitialize = useCallback(async () => {
    try {
      // Stagger the data loading to reduce blocking
      await businessDataService.ensureLoaded();

      // Use requestIdleCallback if available, otherwise setTimeout
      const scheduleWork = (callback: () => void) => {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(callback);
        } else {
          setTimeout(callback, 0);
        }
      };

      scheduleWork(async () => {
        // Preload data for performance but don't use directly
        await Promise.all([
          businessDataService.getAnalytics(),
          businessDataService.getAllBusinesses(),
        ]);
        
        // Don't add any initial messages - let the user start the conversation
      });
    } catch (err) {
      console.error("Failed to load data for AI chat:", err);
    }
  }, []);

  useEffect(() => {
    // Only load data if not skipping (i.e., when hook is actually being used)
    if (!skipDataLoading) {
      loadDataAndInitialize();
    }
  }, [loadDataAndInitialize, skipDataLoading]);

  useEffect(() => {
    // Only scroll if there are actual messages and not on initial load
    if (messages.length > 0 && messagesEndRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [messages.length]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Use the centralized API service
      const data = await api.post<{ content: string }>("/ai-chat-simple", {
        messages: [{ role: "user", content: userMessage }],
        module,
        model: "gpt-4o-mini",
        temperature: 0.7,
      });

      if (data.content) {
        return data.content;
      }
      throw new Error("No content in response");
    } catch (error) {
      console.error("Charlotte AI API failed:", error);

      // NO FALLBACK - Enforce database-only context per CLAUDE.md
      throw new Error(
        `AI chat service unavailable: ${error instanceof Error ? error.message : "Unknown error"}. All responses must use database context.`,
      );
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input.trim());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        suggestions:
          Math.random() > 0.7 ? getSuggestedQuestions().slice(0, 3) : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      let errorContent = "I apologize, but I encountered an error. ";
      if (error instanceof Error) {
        if (error.message.includes("authentication")) {
          errorContent +=
            "The API endpoint requires authentication. This is a deployment configuration issue.";
        } else if (error.message.includes("404")) {
          errorContent +=
            "The API endpoint was not found. Please check the deployment.";
        } else {
          errorContent += `Details: ${error.message.substring(0, 100)}`;
        }
      } else {
        errorContent += "Please try again or ask a different question.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    isLoading,
    messagesEndRef,
    setInput,
    handleSendMessage,
  };
}
