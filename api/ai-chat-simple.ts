import { VercelRequest, VercelResponse } from '@vercel/node';
import { createFullServices } from '../lib/api-bootstrap.js';

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
    
    // NUCLEAR-NUCLEAR OPTION: ALWAYS perform semantic search for EVERY query
    // No regex needed - let AI decide what's relevant!
    console.log('🚀 NUCLEAR-NUCLEAR: Performing semantic search for ALL queries');
    
    let businessContext = '';
    let businessCount = 0;
    let totalRevenue = 0;
    let totalEmployees = 0;
    let searchLatency = 0;
    let databaseBusinessNames: string[] = [];
    
    // ALWAYS search - it's only 294 records, performance is fine!
    const searchStart = Date.now();
    
    // NO TRY-CATCH - Let exceptions bubble up per architectural principles
    // If semantic search fails, the entire request should fail - the business database IS the soul of this app
    const semanticResults = await aiBusinessService.performSemanticSearch(lastUserMessage, 15);
    
    searchLatency = Date.now() - searchStart;
    
    console.log('🔍 NUCLEAR-NUCLEAR SEARCH EXECUTED:', {
      query: lastUserMessage.substring(0, 50),
      resultsFound: semanticResults.length,
      latency: `${searchLatency}ms`,
      method: 'semantic-vector-similarity',
      approach: 'ALWAYS-ON'
    });
    
    // Build context for AI to use IF relevant
    if (semanticResults.length > 0) {
      businessCount = semanticResults.length;
      
      // Take top 10 for context - AI will decide what's relevant
      const contextBusinesses = semanticResults.slice(0, 10);
      
      // Store business names for chain of custody
      databaseBusinessNames = contextBusinesses.map(b => b.name);
      
      businessContext = `SEMANTIC SEARCH RESULTS from Charlotte business database:
(AI: You MUST add "(from our database)" after each of these business names when you mention them)

`;
      businessContext += contextBusinesses.map((b, i) => 
        `${i + 1}. ${b.name}: ${b.industry || 'Industry not specified'}, ${b.neighborhood || b.city || 'Charlotte'}, ${b.employeeCount || 0} employees, $${(b.revenue || 0).toLocaleString()} revenue`
      ).join('\n');
      
      // Calculate totals from all results
      totalRevenue = semanticResults.reduce((sum, b) => sum + (b.revenue || 0), 0);
      totalEmployees = semanticResults.reduce((sum, b) => sum + (b.employeeCount || 0), 0);
      
      businessContext += `\n\nAGGREGATE DATA:
- Total matching businesses: ${businessCount}
- Combined revenue: $${totalRevenue.toLocaleString()}
- Total employees: ${totalEmployees.toLocaleString()}`;
      
    } else {
      businessContext = 'SEMANTIC SEARCH: No businesses found matching this query in our Charlotte database.';
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
      max_completion_tokens: 2000,
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
        dataSource: businessCount > 0 ? 'nuclear-nuclear-semantic' : 'semantic-no-results',
        businessesProvided: businessCount,
        databaseBusinessNames, // Chain of custody: which businesses came from our database
        searchMethod: 'always-on-vector-similarity',
        searchLatency: searchLatency > 0 ? `${Math.round(searchLatency)}ms` : null,
        totalRevenue,
        totalEmployees,
        timestamp: new Date().toISOString(),
        approach: 'AI-decides-relevance',
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

IMPORTANT: A semantic search has been performed on our business database using the user's exact query. The results are provided below.

CRITICAL REQUIREMENT - DATABASE ATTRIBUTION:

**MANDATORY**: Every time you mention a business name from the database list below, you MUST add "(from our database)" immediately after the business name.

EXAMPLES OF CORRECT FORMAT:
✅ "Safe Harbor Kings Point (from our database) has shown strong growth with 15 employees..."
✅ "The top performers include Safe Harbor Kings Point - SouthEnd (from our database) with $2.6M revenue..."
✅ "Companies like Safe Harbor Kings Point - Matthews (from our database) demonstrate the trend..."

EXAMPLES OF INCORRECT FORMAT:
❌ "Safe Harbor Kings Point has shown strong growth..." [MISSING MARKER]
❌ "The top performers include Safe Harbor Kings Point..." [MISSING MARKER]

RESPONSE GUIDELINES:

1. DATABASE BUSINESSES - MANDATORY MARKING:
   - ALWAYS add "(from our database)" after any business name from the list below
   - This applies EVERY TIME you mention the business, not just the first time
   - Include the marker even in numbered lists: "1. Safe Harbor Kings Point (from our database): 15 employees"

2. NON-DATABASE BUSINESSES:
   - For businesses NOT in the database below, add "(not in our database)" if relevant
   - For general industry knowledge, add "(general market knowledge)"

3. DATA ACCURACY:
   - Specific numbers (revenue, employees) MUST only come from the database below
   - Never guess or estimate numbers for database businesses
   - Use exact figures provided in the database list

4. NATURAL LANGUAGE:
   - Write naturally and conversationally
   - The markers are for data tracking, they'll be processed by the frontend
   - Focus on providing helpful, accurate information`;

  // Add business context (always present now with nuclear-nuclear approach)
  if (businessContext) {
    systemMessage += '\n\n' + businessContext;
  } else {
    systemMessage += '\n\nNo business data available for this query.';
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
- Lead with database businesses when available, clearly marked "(from our database)"
- You CAN discuss external businesses if relevant, marked "(general knowledge)" or "(not in our database)"
- Specific numbers (revenue, employees) must ONLY come from the database above
- Help users understand both our local market data AND broader context when useful`;

  return systemMessage;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}