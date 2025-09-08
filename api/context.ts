import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createConversationServices } from '../lib/api-bootstrap.js';
import { AIConversationService } from '../src/core/services/AIConversationService.js';

export const config = {
  maxDuration: 30,
};

interface ContextRequest {
  action: "store" | "retrieve" | "search" | "summarize";
  sessionId?: string;
  userId?: string;
  messages?: any[];
  query?: string;
  limit?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Initialize services using bootstrap utility
    const { conversationService } = createConversationServices();
    
    const body = req.method === "GET" ? req.query : req.body;
    const {
      action,
      sessionId,
      userId,
      messages,
      query,
      limit = 10,
    } = body as ContextRequest;

    switch (action) {
      case "store":
        return await storeContext(res, conversationService, sessionId!, userId, messages!);

      case "retrieve":
        return await retrieveContext(res, conversationService, sessionId!, limit);

      case "search":
        return await searchContext(res, conversationService, query!, userId, limit);

      case "summarize":
        return await summarizeContext(res, conversationService, sessionId!);

      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error: any) {
    console.error("Context API Error:", error);
    return res.status(500).json({
      error: "Failed to process context request",
      details: error.message,
    });
  }
}

async function storeContext(
  res: VercelResponse,
  service: AIConversationService,
  sessionId: string,
  userId?: string,
  messages?: any[],
): Promise<VercelResponse> {
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "No messages to store" });
  }

  try {
    // Use service to store conversation
    await service.storeConversation(
      sessionId,
      messages,
      {
        message_count: messages.length,
        model: "gpt-4o-mini",
        last_interaction: new Date().toISOString(),
      },
      userId
    );

    return res.status(200).json({
      success: true,
      sessionId,
      messageCount: messages.length,
      stored: true,
    });
  } catch (error: any) {
    throw new Error(`Failed to store context: ${error.message}`);
  }
}

async function retrieveContext(
  res: VercelResponse,
  service: AIConversationService,
  sessionId: string,
  limit: number,
): Promise<VercelResponse> {
  try {
    // Use service to retrieve conversation
    const { messages } = await service.retrieveConversation(sessionId, limit);

    return res.status(200).json({
      sessionId,
      messages,
      messageCount: messages.length,
    });
  } catch (error: any) {
    throw new Error(`Failed to retrieve context: ${error.message}`);
  }
}

async function searchContext(
  res: VercelResponse,
  service: AIConversationService,
  query: string,
  userId?: string,
  limit: number = 10,
): Promise<VercelResponse> {
  try {
    // Use service to search conversations
    const { results, metadata } = await service.searchConversations(query, userId, limit);

    return res.status(200).json({
      query,
      results: results.map((r: any) => ({
        sessionId: r.conversation.sessionId,
        messages: r.conversation.messages,
        similarity: r.similarity,
        relevance: r.relevance,
        timestamp: r.conversation.createdAt,
        context: r.context,
      })),
      metadata,
    });
  } catch (error: any) {
    throw new Error(`Failed to search context: ${error.message}`);
  }
}

async function summarizeContext(
  res: VercelResponse,
  service: AIConversationService,
  sessionId: string,
): Promise<VercelResponse> {
  try {
    // Use service to summarize conversation
    const summaryResult = await service.summarizeConversation(sessionId);

    return res.status(200).json({
      sessionId,
      summary: summaryResult.summary,
      keyTopics: summaryResult.keyTopics,
      sentiment: summaryResult.sentiment,
      messageCount: summaryResult.messageCount,
      generated: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message.includes('No messages found')) {
      return res.status(404).json({ error: "No messages found for session" });
    }
    throw new Error(`Failed to summarize context: ${error.message}`);
  }
}
