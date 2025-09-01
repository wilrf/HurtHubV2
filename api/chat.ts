import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI with GPT-5
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const config = {
  maxDuration: 60,
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  sessionId?: string;
  module?: 'business-intelligence' | 'community-pulse';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      messages,
      model = 'gpt-4o-mini', // Default to gpt-4o-mini
      temperature = 0.7,
      stream = false,
      sessionId,
      module = 'business-intelligence'
    } = req.body as ChatRequest;

    // Add system context based on module
    const systemMessage = getSystemMessage(module);
    const contextualMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages
    ];

    // Use smart AI completion that includes database context
    const smartRequest = {
      messages: contextualMessages,
      model,
      temperature,
      stream,
      sessionId: sessionId || generateSessionId(),
      module
    };

    if (stream) {
      // For streaming, we'll use the regular OpenAI call but with enhanced context
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await openai.chat.completions.create({
        model,
        messages: contextualMessages,
        temperature,
        stream: true,
        max_tokens: 8000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } else {
      // Use smart completion for regular responses
      const completion = await openai.chat.completions.create({
        model,
        messages: contextualMessages,
        temperature,
        max_tokens: 8000,
      });

      const responseContent = completion.choices[0]?.message?.content || '';

      // Store conversation in memory (will be enhanced with Supabase later)
      if (sessionId) {
        await storeConversation(sessionId, messages, responseContent);
      }

      return res.status(200).json({
        content: responseContent,
        usage: completion.usage,
        model: completion.model,
        sessionId: sessionId || generateSessionId(),
      });
    }
  } catch (error: any) {
    console.error('GPT-5 API Error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key. Please check your configuration.',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
      });
    }

    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message,
    });
  }
}

function getSystemMessage(module: string): string {
  const baseContext = `You are an advanced AI assistant powered by GPT-4, specialized in business intelligence and economic analysis for Charlotte, NC. 
  You have access to comprehensive business data including company information, revenue analytics, employment statistics, and market trends.
  Provide deep, cutting-edge analysis with actionable insights.`;

  if (module === 'business-intelligence') {
    return `${baseContext}
    
    Focus on:
    - Market trend analysis and predictions
    - Competitive intelligence and benchmarking
    - Revenue and growth opportunity identification
    - Industry performance metrics and KPIs
    - Strategic business recommendations
    
    Use your enhanced GPT-4 reasoning capabilities to provide comprehensive analysis that goes beyond surface-level insights.`;
  } else {
    return `${baseContext}
    
    Focus on:
    - Community economic dynamics and sentiment
    - Local business ecosystem relationships
    - Neighborhood development patterns
    - Social and economic impact analysis
    - Community engagement strategies
    
    Leverage GPT-4's advanced understanding to identify complex patterns and provide nuanced community insights.`;
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Placeholder for conversation storage (will be replaced with Supabase)
async function storeConversation(
  sessionId: string,
  messages: ChatMessage[],
  response: string
): Promise<void> {
  // This will be implemented with Supabase in the next step
  console.log('Storing conversation:', { sessionId, messageCount: messages.length });
}