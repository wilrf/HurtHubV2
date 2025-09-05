import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        return await storeContext(res, sessionId!, userId, messages!);

      case "retrieve":
        return await retrieveContext(res, sessionId!, limit);

      case "search":
        return await searchContext(res, query!, userId, limit);

      case "summarize":
        return await summarizeContext(res, sessionId!);

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
  sessionId: string,
  userId?: string,
  messages?: any[],
): Promise<VercelResponse> {
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "No messages to store" });
  }

  try {
    // Generate embeddings for semantic search
    const embeddings = await generateEmbeddings(messages);

    // Store conversation in Supabase
    const { data: _data, error } = await supabase
      .from("ai_conversations")
      .insert({
        session_id: sessionId,
        user_id: userId,
        messages: messages,
        embeddings: embeddings,
        created_at: new Date().toISOString(),
        metadata: {
          message_count: messages.length,
          model: "gpt-5",
          last_interaction: new Date().toISOString(),
        },
      });

    if (error) throw error;

    // Update session summary
    await updateSessionSummary(sessionId, messages);

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
  sessionId: string,
  limit: number,
): Promise<VercelResponse> {
  try {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Reconstruct conversation history
    const conversationHistory = data?.flatMap((item) => item.messages) || [];

    // Get session summary
    const { data: summaryData } = await supabase
      .from("ai_session_summaries")
      .select("summary, key_topics, sentiment")
      .eq("session_id", sessionId)
      .single();

    return res.status(200).json({
      sessionId,
      messages: conversationHistory,
      summary: summaryData?.summary,
      keyTopics: summaryData?.key_topics,
      sentiment: summaryData?.sentiment,
      messageCount: conversationHistory.length,
    });
  } catch (error: any) {
    throw new Error(`Failed to retrieve context: ${error.message}`);
  }
}

async function searchContext(
  res: VercelResponse,
  query: string,
  userId?: string,
  limit: number = 10,
): Promise<VercelResponse> {
  try {
    // Enhanced search with multiple strategies
    const searchResults = await performEnhancedSearch(query, userId, limit);

    return res.status(200).json({
      query,
      results: searchResults.map((r) => ({
        sessionId: r.sessionId,
        messages: r.messages,
        similarity: r.similarity,
        relevance: r.relevance,
        timestamp: r.timestamp,
        context: r.context,
      })),
      metadata: {
        searchStrategy: searchResults.length > 0 ? "enhanced" : "fallback",
        totalResults: searchResults.length,
        queryTerms: extractSearchTerms(query),
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to search context: ${error.message}`);
  }
}

async function performEnhancedSearch(
  query: string,
  userId?: string,
  limit: number = 10,
) {
  const results: any[] = [];

  try {
    // Strategy 1: Semantic search using embeddings
    const semanticResults = await performSemanticSearch(
      query,
      userId,
      Math.ceil(limit / 2),
    );
    results.push(...semanticResults);

    // Strategy 2: Keyword-based search
    const keywordResults = await performKeywordSearch(
      query,
      userId,
      Math.ceil(limit / 2),
    );
    results.push(...keywordResults);

    // Strategy 3: Recent conversation search
    const recentResults = await performRecentSearch(
      query,
      userId,
      Math.ceil(limit / 3),
    );
    results.push(...recentResults);

    // Remove duplicates and sort by relevance
    const uniqueResults = removeDuplicates(results);
    return uniqueResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  } catch (error) {
    console.error("Enhanced search failed, using fallback:", error);
    // Fallback to simple text search
    return await performKeywordSearch(query, userId, limit);
  }
}

async function performSemanticSearch(
  query: string,
  userId?: string,
  limit: number = 5,
) {
  try {
    const queryEmbedding = await generateEmbedding(query);

    let searchQuery = supabase.from("ai_conversations").select("*");

    if (userId) {
      searchQuery = searchQuery.eq("user_id", userId);
    }

    const { data, error } = await searchQuery.limit(100); // Get more for better filtering

    if (error || !data) return [];

    const results = data
      .filter((item) => item.embeddings && item.embeddings.length > 0)
      .map((item) => {
        // Calculate similarity with the first message embedding
        const similarity = cosineSimilarity(
          queryEmbedding,
          item.embeddings[0] || [],
        );
        const relevance = similarity * 0.8; // Weight semantic similarity

        return {
          sessionId: item.session_id,
          messages: item.messages,
          similarity,
          relevance,
          timestamp: item.created_at,
          context: "semantic",
          type: "semantic",
        };
      })
      .filter((item) => item.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
}

async function performKeywordSearch(
  query: string,
  userId?: string,
  limit: number = 5,
) {
  try {
    const searchTerms = extractSearchTerms(query);

    let searchQuery = supabase.from("ai_conversations").select("*");

    if (userId) {
      searchQuery = searchQuery.eq("user_id", userId);
    }

    const { data, error } = await searchQuery.limit(50);

    if (error || !data) return [];

    const results = data
      .map((item) => {
        const messagesText = item.messages
          .map((m: any) => m.content)
          .join(" ")
          .toLowerCase();
        let relevance = 0;

        // Calculate keyword relevance
        searchTerms.forEach((term) => {
          const count = (messagesText.match(new RegExp(term, "gi")) || [])
            .length;
          relevance += count * 0.1;
        });

        // Boost recent conversations
        const daysSince =
          (Date.now() - new Date(item.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        relevance += Math.max(0, 0.2 - daysSince * 0.01);

        return {
          sessionId: item.session_id,
          messages: item.messages,
          similarity: relevance,
          relevance,
          timestamp: item.created_at,
          context: "keyword",
          type: "keyword",
        };
      })
      .filter((item) => item.relevance > 0.05) // Minimum relevance threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("Keyword search failed:", error);
    return [];
  }
}

async function performRecentSearch(
  query: string,
  userId?: string,
  limit: number = 3,
) {
  try {
    let searchQuery = supabase
      .from("ai_conversations")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      searchQuery = searchQuery.eq("user_id", userId);
    }

    const { data, error } = await searchQuery.limit(limit * 2);

    if (error || !data) return [];

    return data.map((item) => ({
      sessionId: item.session_id,
      messages: item.messages,
      similarity: 0.5, // Base relevance for recent items
      relevance: 0.5,
      timestamp: item.created_at,
      context: "recent",
      type: "recent",
    }));
  } catch (error) {
    console.error("Recent search failed:", error);
    return [];
  }
}

function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .map((term) => term.replace(/[^\w]/g, ""));
}

function removeDuplicates(results: any[]): any[] {
  const seen = new Set();
  return results.filter((item) => {
    const key = `${item.sessionId}-${item.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function summarizeContext(
  res: VercelResponse,
  sessionId: string,
): Promise<VercelResponse> {
  try {
    // Retrieve all messages for the session
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("messages")
      .eq("session_id", sessionId);

    if (error) throw error;

    const allMessages = data?.flatMap((item) => item.messages) || [];

    if (allMessages.length === 0) {
      return res.status(404).json({ error: "No messages found for session" });
    }

    // Use GPT-5 to generate a comprehensive summary
    const summaryPrompt = `Analyze and summarize the following conversation. Provide:
    1. A concise summary of key points discussed
    2. Main topics and themes
    3. Action items or decisions made
    4. Overall sentiment and tone
    5. Unresolved questions or topics
    
    Conversation:
    ${JSON.stringify(allMessages, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing and summarizing conversations, extracting key insights and patterns.",
        },
        { role: "user", content: summaryPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const summary = completion.choices[0]?.message?.content || "";

    // Store the summary
    await supabase.from("ai_session_summaries").upsert({
      session_id: sessionId,
      summary: summary,
      key_topics: extractKeyTopics(summary),
      sentiment: analyzeSentiment(allMessages),
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({
      sessionId,
      summary,
      messageCount: allMessages.length,
      generated: new Date().toISOString(),
    });
  } catch (error: any) {
    throw new Error(`Failed to summarize context: ${error.message}`);
  }
}

async function generateEmbeddings(messages: any[]): Promise<number[][]> {
  const embeddings = await Promise.all(
    messages.map((msg) => generateEmbedding(msg.content)),
  );
  return embeddings;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return [];
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function updateSessionSummary(
  sessionId: string,
  messages: any[],
): Promise<void> {
  // This runs in the background to update session summaries
  try {
    const lastMessages = messages.slice(-5); // Last 5 messages for context
    const summary = await generateQuickSummary(lastMessages);

    await supabase.from("ai_session_summaries").upsert({
      session_id: sessionId,
      last_summary: summary,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update session summary:", error);
  }
}

async function generateQuickSummary(messages: any[]): Promise<string> {
  const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  return text.substring(0, 200) + "..."; // Simple truncation for now
}

function extractKeyTopics(summary: string): string[] {
  // Extract key topics from summary using simple pattern matching
  const topics: string[] = [];
  const patterns = [
    /discussed ([\w\s]+)/gi,
    /topics?: ([\w\s,]+)/gi,
    /about ([\w\s]+)/gi,
  ];

  patterns.forEach((pattern) => {
    const matches = summary.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        topics.push(match[1].trim());
      }
    }
  });

  return [...new Set(topics)].slice(0, 5);
}

function analyzeSentiment(messages: any[]): string {
  // Simple sentiment analysis based on keywords
  const positiveWords = [
    "great",
    "excellent",
    "good",
    "happy",
    "success",
    "positive",
  ];
  const negativeWords = [
    "bad",
    "poor",
    "unhappy",
    "fail",
    "negative",
    "problem",
  ];

  const text = messages
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    positiveCount += (text.match(new RegExp(word, "g")) || []).length;
  });

  negativeWords.forEach((word) => {
    negativeCount += (text.match(new RegExp(word, "g")) || []).length;
  });

  if (positiveCount > negativeCount * 1.5) return "positive";
  if (negativeCount > positiveCount * 1.5) return "negative";
  return "neutral";
}
