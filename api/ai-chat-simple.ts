import { VercelRequest, VercelResponse } from '@vercel/node';
import { createFullServices } from '../lib/api-bootstrap';

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
  module?: 'business-intelligence' | 'community-pulse';
  sessionId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      messages,
      model = 'gpt-4o-mini',
      module = 'business-intelligence',
      sessionId = generateSessionId(),
    } = req.body as ChatRequest;
    
    // Initialize all services using bootstrap utility
    const { aiBusinessService, conversationService, openai } = createFullServices();
    
    // Get last user message
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    console.log('🎯 AI Chat Request:', {
      sessionId,
      module,
      userMessage: lastUserMessage.substring(0, 100),
      timestamp: new Date().toISOString(),
    });
    
    // Determine if we need business data
    const needsBusinessData = lastUserMessage.toLowerCase().includes('business') ||
                             lastUserMessage.toLowerCase().includes('company') ||
                             lastUserMessage.toLowerCase().includes('restaurant') ||
                             lastUserMessage.toLowerCase().includes('shop') ||
                             lastUserMessage.toLowerCase().includes('store') ||
                             lastUserMessage.toLowerCase().includes('find') ||
                             lastUserMessage.toLowerCase().includes('show') ||
                             lastUserMessage.toLowerCase().includes('list');
    
    let businessContext = '';
    let businessCount = 0;
    let totalRevenue = 0;
    let totalEmployees = 0;
    
    if (needsBusinessData) {
      // Use service for business logic
      const { businesses, context } = await aiBusinessService.enhanceBusinessQuery(lastUserMessage);
      businessContext = context;
      businessCount = businesses.length;
      
      // Calculate summary statistics
      if (businesses.length > 0) {
        totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);
        totalEmployees = businesses.reduce((sum, b) => sum + (b.employeeCount || 0), 0);
      }
      
      console.log('📊 Business Data Fetched:', {
        companiesFound: businessCount,
        searchIntent: 'semantic',
      });
    }
    
    // Build system message
    const systemMessage = buildSystemMessage(module, businessContext, {
      totalCompanies: businessCount,
      totalRevenue,
      totalEmployees,
    });
    
    // Create messages with context
    const contextualMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];
    
    // Call OpenAI
    console.log('🤖 Calling OpenAI:', {
      model,
      temperature: 0.3, // Lower to reduce hallucination
      contextMessages: contextualMessages.length,
    });
    
    const completion = await openai.chat.completions.create({
      model,
      messages: contextualMessages,
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const responseContent = completion.choices[0]?.message?.content || '';
    
    console.log('✅ OpenAI Response:', {
      model: completion.model,
      totalTokens: completion.usage?.total_tokens,
      responseLength: responseContent.length,
    });
    
    // Store conversation using service
    if (sessionId) {
      await conversationService.storeConversation(
        sessionId,
        [...messages, { role: 'assistant', content: responseContent }],
        {
          module,
          model: completion.model,
          token_usage: completion.usage,
          created_via: 'ai-chat-simple',
        }
      );
    }
    
    return res.status(200).json({
      content: responseContent,
      usage: completion.usage,
      model: completion.model,
      sessionId,
      metadata: {
        dataSource: 'repository',
        companiesProvided: businessCount,
        searchIntent: 'semantic',
        totalRevenue,
        totalEmployees,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    if ((error as any)?.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key. Please check your configuration.',
      });
    }
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

function buildSystemMessage(module: string, businessContext: string, summary: any): string {
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
   
4. DATA ACCURACY:
   - All specific numbers, revenue figures, and employee counts MUST come from the database below
   - Industry insights and comparisons can use general knowledge but must be labeled as such`;

  // Add business context
  if (businessContext) {
    systemMessage += '\n\n' + businessContext;
  }

  if (summary.totalCompanies) {
    systemMessage += `\n\nMARKET SUMMARY:`;
    systemMessage += `\n- Total Companies Analyzed: ${summary.totalCompanies}`;
    systemMessage += `\n- Combined Revenue: $${summary.totalRevenue?.toLocaleString() || 0}`;
    systemMessage += `\n- Total Employees: ${summary.totalEmployees?.toLocaleString() || 0}`;
  }

  // Module-specific instructions
  if (module === 'business-intelligence') {
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

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}