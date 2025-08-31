import { createClient } from '@supabase/supabase-js'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const openaiApiKey = process.env.OPENAI_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to fetch relevant context from database
async function getDatabaseContext(query: string) {
  const context: string[] = []
  
  try {
    // Search for relevant companies
    const { data: companies } = await supabase
      .from('companies')
      .select('name, industry, description, employees_count, revenue')
      .or(`name.ilike.%${query}%,industry.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5)
    
    if (companies && companies.length > 0) {
      context.push('Relevant Companies in Charlotte:')
      companies.forEach(company => {
        context.push(`- ${company.name} (${company.industry}): ${company.description || 'No description'}. Employees: ${company.employees_count || 'N/A'}, Revenue: $${company.revenue ? `${(company.revenue / 1000000).toFixed(1)}M` : 'N/A'}`)
      })
    }
    
    // Get recent developments
    const { data: developments } = await supabase
      .from('developments')
      .select('title, content, source, published_at')
      .order('published_at', { ascending: false })
      .limit(3)
    
    if (developments && developments.length > 0) {
      context.push('\nRecent Developments:')
      developments.forEach(dev => {
        context.push(`- ${dev.title} (${new Date(dev.published_at).toLocaleDateString()}): ${dev.content.substring(0, 200)}...`)
      })
    }
    
    // Get current economic indicators
    const { data: indicators } = await supabase
      .from('economic_indicators')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()
    
    if (indicators) {
      context.push('\nCurrent Economic Indicators for Charlotte:')
      context.push(`- Unemployment Rate: ${indicators.unemployment_rate}%`)
      context.push(`- GDP Growth: ${indicators.gdp_growth}%`)
      context.push(`- Job Growth: ${indicators.job_growth} jobs`)
      context.push(`- Median Income: $${indicators.median_income}`)
    }
  } catch (error) {
    console.error('Error fetching database context:', error)
  }
  
  return context.join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  try {
    const { messages, sessionId, saveToDatabase = true } = req.body
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array required' })
    }
    
    // Get the user's latest message for context search
    const userMessage = messages[messages.length - 1]?.content || ''
    
    // Fetch relevant context from database
    const databaseContext = await getDatabaseContext(userMessage)
    
    // Create enhanced system message with database context
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant for the Charlotte Economic Development Platform. You have access to real-time data about Charlotte's business ecosystem, economic indicators, and recent developments.

${databaseContext}

Please provide helpful, accurate information based on the data available. If specific data is not available, provide general insights about Charlotte's economic landscape. Always be professional and informative.`
    }
    
    // Prepare messages for OpenAI
    const enhancedMessages = [systemMessage, ...messages]
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: enhancedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }
    
    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    
    // Save to database if requested
    if (saveToDatabase && sessionId) {
      // Save user message
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: userMessage,
        })
      
      // Save AI response
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: aiResponse,
          metadata: { context_used: databaseContext.substring(0, 500) }
        })
    }
    
    return res.status(200).json({ 
      content: aiResponse,
      contextUsed: databaseContext.length > 0
    })
    
  } catch (error) {
    console.error('AI Chat Error:', error)
    return res.status(500).json({ 
      error: 'Failed to process chat request', 
      message: error.message 
    })
  }
}