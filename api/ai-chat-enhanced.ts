import { createClient } from '@supabase/supabase-js'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const openaiApiKey = process.env.OPENAI_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Note: Importing from same file to avoid Vercel deployment issues
// import { getEnhancedDatabaseContext } from './embeddings-service'
// import { generateDomainAwarePrompt, getIndustryContext } from './ai-domain-knowledge'

// Function to fetch relevant context from database
async function getDatabaseContext(query: string) {
  const context: string[] = []
  
  try {
    // Search for relevant businesses
    const { data: companies } = await supabase
      .from('businesses')
      .select('name, industry, naics, employees, revenue, neighborhood, cluster, business_type, year_established')
      .or(`name.ilike.%${query}%,industry.ilike.%${query}%,naics.ilike.%${query}%,neighborhood.ilike.%${query}%,cluster.ilike.%${query}%`)
      .limit(8)
    
    if (companies && companies.length > 0) {
      context.push('Relevant Charlotte Businesses:')
      
      // Group by industry for better context
      const industriesMapped = new Map()
      companies.forEach(company => {
        const industry = company.industry || 'Other'
        if (!industriesMapped.has(industry)) {
          industriesMapped.set(industry, [])
        }
        industriesMapped.get(industry).push(company)
      })
      
      // Add businesses grouped by industry
      for (const [industry, businessList] of industriesMapped) {
        context.push(`\n${industry} Sector:`)
        businessList.forEach((business) => {
          const revenue = business.revenue ? `$${(business.revenue / 1000000).toFixed(1)}M` : 'N/A'
          const employees = business.employees || 'N/A'
          const established = business.year_established || 'N/A'
          
          context.push(`  • ${business.name} (${business.neighborhood || 'Charlotte'})`)
          context.push(`    Revenue: ${revenue} | Employees: ${employees} | Est: ${established}`)
          context.push(`    Cluster: ${business.cluster || 'General'} | Type: ${business.business_type || 'Local'}`)
        })
      }
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
    context.push('Note: Some data temporarily unavailable.')
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
    
    // Determine module context from messages
    const moduleContext = messages.find(m => m.role === 'system')?.content || ''
    const module = moduleContext.includes('Business Intelligence') ? 'business-intelligence' : 'community-pulse'
    
    // Create enhanced system message with Charlotte business knowledge
    const basePrompt = `You are an expert AI assistant specializing in Charlotte, North Carolina's business ecosystem and economic development.

CHARLOTTE BUSINESS ECOSYSTEM:
• Second-largest banking center in US (Bank of America HQ, Wells Fargo operations)
• Major sectors: Financial Services, Technology/Fintech, Healthcare, Manufacturing, Transportation
• Key areas: Uptown (corporate HQ), SouthEnd (mixed-use, tech), NoDa (arts/creative), University Research Park
• Growth patterns: 70%+ small businesses (<50 employees), strong public-private partnerships

CURRENT DATA CONTEXT:
${databaseContext}

RESPONSE GUIDELINES:
${module === 'business-intelligence' 
  ? '• Focus on market analysis, competitive insights, and data-driven business intelligence\n• Consider Charlotte\'s banking hub advantages and regional competition\n• Provide actionable insights for business growth and opportunities'
  : '• Focus on community engagement, local business relationships, and neighborhood economic patterns\n• Emphasize social impact and community development\n• Highlight collaboration opportunities and business networking'
}

Always ground responses in the provided data while leveraging Charlotte's unique economic position. Be specific and actionable.`

    const systemMessage = {
      role: 'system',
      content: basePrompt
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