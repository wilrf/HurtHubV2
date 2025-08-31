// Simplified OpenAI proxy without database dependencies
// This serves as a reliable fallback when the enhanced API fails

import type { VercelRequest, VercelResponse } from '@vercel/node'

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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not configured')
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const { messages, module } = req.body
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' })
    }

    // Create system message based on module
    const systemMessage = {
      role: 'system',
      content: module === 'business-intelligence' 
        ? `You are a Business Intelligence AI assistant specializing in Charlotte, North Carolina's economic ecosystem. Charlotte is the second-largest banking center in the US, home to Bank of America's headquarters and major Wells Fargo operations. Key industries include Financial Services, Technology/Fintech, Healthcare, Energy, and Manufacturing. Provide data-driven insights about market trends, competitive analysis, and business opportunities in the Charlotte region.`
        : `You are a Community Pulse AI assistant focused on Charlotte's local business community and neighborhood dynamics. Charlotte has vibrant business districts including Uptown (corporate center), South End (tech and startups), NoDa (arts district), Plaza Midwood (local businesses), and University City (research park). Focus on community engagement, local business relationships, neighborhood economic patterns, and social impact initiatives.`
    }

    // Prepare messages for OpenAI
    const enhancedMessages = [systemMessage, ...messages]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: enhancedMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return res.status(response.status).json({ 
        error: 'OpenAI API error', 
        details: error.substring(0, 200) 
      })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return res.status(200).json({ content })
    
  } catch (error) {
    console.error('Simple Chat Error:', error)
    return res.status(500).json({ 
      error: 'Failed to process chat request', 
      message: error.message 
    })
  }
}