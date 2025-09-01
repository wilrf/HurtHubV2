import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

interface ContextRequest {
  action: 'store' | 'retrieve' | 'search' | 'summarize';
  sessionId?: string;
  userId?: string;
  messages?: any[];
  query?: string;
  limit?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = req.method === 'GET' ? req.query : req.body;
    const { action, sessionId, userId, messages, query, limit = 10 } = body as ContextRequest;

    switch (action) {
      case 'store':
        return await storeContext(res, sessionId!, userId, messages!);
      
      case 'retrieve':
        return await retrieveContext(res, sessionId!, limit);
      
      case 'search':
        return await searchContext(res, query!, userId, limit);
      
      case 'summarize':
        return await summarizeContext(res, sessionId!);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Context API Error:', error);
    return res.status(500).json({
      error: 'Failed to process context request',
      details: error.message,
    });
  }
}

async function storeContext(
  res: VercelResponse,
  sessionId: string,
  userId?: string,
  messages?: any[]
): Promise<VercelResponse> {
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages to store' });
  }

  try {
    // Generate embeddings for semantic search
    const embeddings = await generateEmbeddings(messages);

    // Store conversation in Supabase
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        session_id: sessionId,
        user_id: userId,
        messages: messages,
        embeddings: embeddings,
        created_at: new Date().toISOString(),
        metadata: {
          message_count: messages.length,
          model: 'gpt-5',
          last_interaction: new Date().toISOString(),
        }
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
  limit: number
): Promise<VercelResponse> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Reconstruct conversation history
    const conversationHistory = data?.flatMap(item => item.messages) || [];
    
    // Get session summary
    const { data: summaryData } = await supabase
      .from('ai_session_summaries')
      .select('summary, key_topics, sentiment')
      .eq('session_id', sessionId)
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
  limit: number = 10
): Promise<VercelResponse> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Perform semantic search using vector similarity
    let searchQuery = supabase
      .from('ai_conversations')
      .select('*');

    if (userId) {
      searchQuery = searchQuery.eq('user_id', userId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;

    // Calculate similarity scores and sort
    const results = data?.map(item => {
      const similarity = cosineSimilarity(queryEmbedding, item.embeddings);
      return { ...item, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    return res.status(200).json({
      query,
      results: results?.map(r => ({
        sessionId: r.session_id,
        messages: r.messages,
        similarity: r.similarity,
        timestamp: r.created_at,
      })),
      count: results?.length || 0,
    });
  } catch (error: any) {
    throw new Error(`Failed to search context: ${error.message}`);
  }
}

async function summarizeContext(
  res: VercelResponse,
  sessionId: string
): Promise<VercelResponse> {
  try {
    // Retrieve all messages for the session
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('session_id', sessionId);

    if (error) throw error;

    const allMessages = data?.flatMap(item => item.messages) || [];

    if (allMessages.length === 0) {
      return res.status(404).json({ error: 'No messages found for session' });
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
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing and summarizing conversations, extracting key insights and patterns.' },
        { role: 'user', content: summaryPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const summary = completion.choices[0]?.message?.content || '';

    // Store the summary
    await supabase
      .from('ai_session_summaries')
      .upsert({
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
    messages.map(msg => generateEmbedding(msg.content))
  );
  return embeddings;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
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

async function updateSessionSummary(sessionId: string, messages: any[]): Promise<void> {
  // This runs in the background to update session summaries
  try {
    const lastMessages = messages.slice(-5); // Last 5 messages for context
    const summary = await generateQuickSummary(lastMessages);
    
    await supabase
      .from('ai_session_summaries')
      .upsert({
        session_id: sessionId,
        last_summary: summary,
        last_updated: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to update session summary:', error);
  }
}

async function generateQuickSummary(messages: any[]): Promise<string> {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  return text.substring(0, 200) + '...'; // Simple truncation for now
}

function extractKeyTopics(summary: string): string[] {
  // Extract key topics from summary using simple pattern matching
  const topics: string[] = [];
  const patterns = [
    /discussed ([\w\s]+)/gi,
    /topics?: ([\w\s,]+)/gi,
    /about ([\w\s]+)/gi,
  ];
  
  patterns.forEach(pattern => {
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
  const positiveWords = ['great', 'excellent', 'good', 'happy', 'success', 'positive'];
  const negativeWords = ['bad', 'poor', 'unhappy', 'fail', 'negative', 'problem'];
  
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    positiveCount += (text.match(new RegExp(word, 'g')) || []).length;
  });
  
  negativeWords.forEach(word => {
    negativeCount += (text.match(new RegExp(word, 'g')) || []).length;
  });
  
  if (positiveCount > negativeCount * 1.5) return 'positive';
  if (negativeCount > positiveCount * 1.5) return 'negative';
  return 'neutral';
}