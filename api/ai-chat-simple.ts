import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Initialize Supabase - Use correct Vercel environment variable names
const supabaseUrl = process.env.SUPABASE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Log environment variable status (for debugging)
console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

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
      model = 'gpt-4o-mini', // Use real OpenAI model
      temperature = 0.7,
      module = 'business-intelligence',
      sessionId = generateSessionId()
    } = req.body as ChatRequest;

    // Get the user's latest message
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Analyze what data the user might need
    const businessData = await fetchRelevantBusinessData(userMessage);
    
    // Build smart context with real data
    const systemMessage = buildSmartSystemMessage(module, businessData);
    
    // Create messages with context
    const contextualMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages
    ];

    // Call OpenAI with real data context
    const completion = await openai.chat.completions.create({
      model,
      messages: contextualMessages,
      temperature,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Store conversation in database
    await storeConversation(sessionId, messages, responseContent);

    return res.status(200).json({
      content: responseContent,
      usage: completion.usage,
      model: completion.model,
      sessionId,
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key. Please check your configuration.',
      });
    }

    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message,
    });
  }
}

// Fetch relevant business data based on user query
async function fetchRelevantBusinessData(query: string) {
  const lowerQuery = query.toLowerCase();
  const data: any = {
    companies: [],
    developments: [],
    economicIndicators: [],
    summary: {}
  };

  try {
    // Determine what data to fetch based on query content
    const needsCompanies = lowerQuery.includes('compan') || 
                          lowerQuery.includes('business') || 
                          lowerQuery.includes('revenue') ||
                          lowerQuery.includes('employee') ||
                          lowerQuery.includes('industry') ||
                          lowerQuery.includes('restaurant') ||
                          lowerQuery.includes('food') ||
                          lowerQuery.includes('how many') ||
                          lowerQuery.includes('total') ||
                          lowerQuery.includes('database');
    
    const needsDevelopments = lowerQuery.includes('news') || 
                             lowerQuery.includes('development') ||
                             lowerQuery.includes('recent') ||
                             lowerQuery.includes('update');
    
    const needsEconomic = lowerQuery.includes('economic') || 
                         lowerQuery.includes('gdp') ||
                         lowerQuery.includes('unemployment') ||
                         lowerQuery.includes('growth');

    // Fetch companies if needed
    if (needsCompanies) {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .order('revenue', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Supabase error fetching companies:', error);
      }
      
      if (!error && companies) {
        data.companies = companies;
        
        // Calculate summary statistics
        data.summary.totalCompanies = companies.length;
        data.summary.totalRevenue = companies.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
        data.summary.totalEmployees = companies.reduce((sum: number, c: any) => sum + (c.employees_count || 0), 0);
        
        // Get top industries
        const industries = companies.reduce((acc: any, c: any) => {
          acc[c.industry] = (acc[c.industry] || 0) + 1;
          return acc;
        }, {});
        data.summary.topIndustries = Object.entries(industries)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([industry, count]) => ({ industry, count }));
      }
    }

    // Fetch developments if needed
    if (needsDevelopments) {
      const { data: developments, error } = await supabase
        .from('developments')
        .select(`
          *,
          companies:company_id (
            name,
            industry
          )
        `)
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (!error && developments) {
        data.developments = developments;
      }
    }

    // Fetch economic indicators if needed
    if (needsEconomic) {
      const { data: indicators, error } = await supabase
        .from('economic_indicators')
        .select('*')
        .order('date', { ascending: false })
        .limit(3);
      
      if (!error && indicators && indicators.length > 0) {
        data.economicIndicators = indicators;
        const latest = indicators[0];
        data.summary.latestEconomic = {
          unemploymentRate: latest.unemployment_rate,
          gdpGrowth: latest.gdp_growth,
          jobGrowth: latest.job_growth,
          date: latest.date
        };
      }
    }

    // If no specific data was requested, get a general overview
    if (!needsCompanies && !needsDevelopments && !needsEconomic) {
      // Get count and top companies
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const { data: companies } = await supabase
        .from('companies')
        .select('name, industry, revenue, employees_count')
        .eq('status', 'active')
        .order('revenue', { ascending: false })
        .limit(10);
      
      if (companies) {
        data.companies = companies;
        data.summary.overview = `${count || companies.length} total companies in database`;
      }
    }

  } catch (error) {
    console.error('Error fetching business data:', error);
  }

  return data;
}

// Build system message with real business data
function buildSmartSystemMessage(module: string, businessData: any): string {
  let systemMessage = `You are an AI assistant specialized in business intelligence for Charlotte, NC. 
You have access to real business data and should provide specific, data-driven insights.`;

  // Add actual data context
  if (businessData.companies && businessData.companies.length > 0) {
    systemMessage += `\n\nCOMPANIES IN DATABASE (${businessData.companies.length} shown):`;
    businessData.companies.slice(0, 5).forEach((company: any) => {
      systemMessage += `\n- ${company.name} (${company.industry}): $${(company.revenue || 0).toLocaleString()} revenue, ${company.employees_count || 'N/A'} employees`;
    });
  }

  if (businessData.developments && businessData.developments.length > 0) {
    systemMessage += `\n\nRECENT DEVELOPMENTS:`;
    businessData.developments.slice(0, 3).forEach((dev: any) => {
      systemMessage += `\n- ${dev.title} (${dev.companies?.name || 'Unknown'})`;
    });
  }

  if (businessData.summary.latestEconomic) {
    const eco = businessData.summary.latestEconomic;
    systemMessage += `\n\nLATEST ECONOMIC INDICATORS (${eco.date}):`;
    systemMessage += `\n- Unemployment Rate: ${eco.unemploymentRate}%`;
    systemMessage += `\n- GDP Growth: ${eco.gdpGrowth}%`;
    systemMessage += `\n- Job Growth: ${eco.jobGrowth}`;
  }

  if (businessData.summary.totalCompanies) {
    systemMessage += `\n\nMARKET SUMMARY:`;
    systemMessage += `\n- Total Companies Analyzed: ${businessData.summary.totalCompanies}`;
    systemMessage += `\n- Combined Revenue: $${businessData.summary.totalRevenue?.toLocaleString() || 0}`;
    systemMessage += `\n- Total Employees: ${businessData.summary.totalEmployees?.toLocaleString() || 0}`;
    if (businessData.summary.topIndustries) {
      systemMessage += `\n- Top Industries: ${businessData.summary.topIndustries.map((i: any) => i.industry).join(', ')}`;
    }
  }

  // Module-specific instructions
  if (module === 'business-intelligence') {
    systemMessage += `\n\nFocus on market analysis, competitive intelligence, and business metrics. 
Provide specific company names, actual revenue figures, and real data from the database above.`;
  } else {
    systemMessage += `\n\nFocus on community dynamics, local business relationships, and economic impact. 
Reference specific businesses and real data from the database above.`;
  }

  systemMessage += `\n\nIMPORTANT: Use the real data provided above in your responses. Be specific with company names, numbers, and trends.`;

  return systemMessage;
}

// Store conversation in Supabase
async function storeConversation(
  sessionId: string,
  messages: ChatMessage[],
  response: string
): Promise<void> {
  try {
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Store in ai_conversations table
    const { error } = await supabase
      .from('ai_conversations')
      .insert({
        session_id: sessionId,
        user_message: userMessage,
        ai_response: response,
        model: 'gpt-4o-mini',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store conversation:', error);
    }

    // If this is a long conversation, create a summary
    if (messages.length > 5) {
      await createSessionSummary(sessionId, messages, response);
    }
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
}

// Create session summary for long conversations
async function createSessionSummary(
  sessionId: string,
  messages: ChatMessage[],
  latestResponse: string
): Promise<void> {
  try {
    // Create a brief summary of the conversation
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const { error } = await supabase
      .from('ai_session_summaries')
      .upsert({
        session_id: sessionId,
        summary: `Conversation with ${messages.length} messages about business intelligence in Charlotte`,
        key_topics: extractKeyTopics(conversationText),
        message_count: messages.length,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create session summary:', error);
    }
  } catch (error) {
    console.error('Error creating session summary:', error);
  }
}

// Extract key topics from conversation
function extractKeyTopics(text: string): string[] {
  const topics = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('revenue')) topics.push('revenue');
  if (lowerText.includes('company') || lowerText.includes('companies')) topics.push('companies');
  if (lowerText.includes('industry')) topics.push('industry');
  if (lowerText.includes('employee')) topics.push('employment');
  if (lowerText.includes('growth')) topics.push('growth');
  if (lowerText.includes('economic')) topics.push('economic');
  if (lowerText.includes('development')) topics.push('developments');
  
  return topics.slice(0, 5); // Return top 5 topics
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}