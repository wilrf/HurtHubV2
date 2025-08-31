import { createClient } from '@supabase/supabase-js'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const openaiApiKey = process.env.OPENAI_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Import enhanced embeddings service and domain knowledge
import { getEnhancedDatabaseContext } from './embeddings-service'
import { generateDomainAwarePrompt, getIndustryContext } from './ai-domain-knowledge'

// Function to fetch relevant context from database
async function getDatabaseContext(query: string) {
  try {
    // Try enhanced semantic search first
    return await getEnhancedDatabaseContext(query)
  } catch (error) {
    console.error('Enhanced context failed, using fallback:', error)
    
    // Fallback to basic search
    const context: string[] = []
    
    // Search for relevant businesses
    const { data: companies } = await supabase
      .from('businesses')
      .select('name, industry, naics, employees, revenue, neighborhood, cluster')
      .or(`name.ilike.%${query}%,industry.ilike.%${query}%,naics.ilike.%${query}%,neighborhood.ilike.%${query}%,cluster.ilike.%${query}%`)
      .limit(5)
    
    if (companies && companies.length > 0) {
      context.push('Relevant Businesses in Charlotte:')
      companies.forEach(company => {
        context.push(`- ${company.name} (${company.industry || company.naics}): Located in ${company.neighborhood || 'Charlotte'}. Employees: ${company.employees || 'N/A'}, Revenue: $${company.revenue ? `${(company.revenue / 1000000).toFixed(1)}M` : 'N/A'}. Business cluster: ${company.cluster || 'General'}`)
      })
    }
    
    return context.join('\n')
  }
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
    
    // Determine module context from messages
    const moduleContext = messages.find(m => m.role === 'system')?.content || ''
    const module = moduleContext.includes('Business Intelligence') ? 'business-intelligence' : 'community-pulse'
    
    // Create enhanced system message with domain knowledge
    const enhancedPrompt = generateDomainAwarePrompt(module, databaseContext)
    
    // Add industry-specific context if relevant
    const industryKeywords = ['financial', 'tech', 'healthcare', 'manufacturing', 'banking', 'fintech']
    const detectedIndustry = industryKeywords.find(keyword => 
      userMessage.toLowerCase().includes(keyword)
    )
    
    let finalPrompt = enhancedPrompt
    if (detectedIndustry) {
      const industryContext = getIndustryContext(detectedIndustry)
      if (industryContext) {
        finalPrompt += `\n\nINDUSTRY-SPECIFIC CONTEXT:\n${industryContext}`
      }
    }
    
    const systemMessage = {
      role: 'system',
      content: finalPrompt
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