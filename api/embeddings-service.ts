import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const openaiApiKey = process.env.OPENAI_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Enhanced semantic search using OpenAI embeddings
async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// Semantic business search with embeddings
async function semanticBusinessSearch(query: string, limit: number = 5): Promise<any[]> {
  try {
    // Create embedding for the query
    const queryEmbedding = await createEmbedding(query)
    
    // Search for businesses with semantic similarity
    // Note: This requires pgvector extension in Supabase
    const { data: businesses } = await supabase.rpc('semantic_business_search', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.7,
      match_count: limit
    })

    return businesses || []
  } catch (error) {
    console.error('Semantic search failed, falling back to keyword search:', error)
    
    // Fallback to keyword search
    const { data: businesses } = await supabase
      .from('businesses')
      .select('name, industry, naics, employees, revenue, neighborhood, cluster, business_type, year_established')
      .or(`name.ilike.%${query}%,industry.ilike.%${query}%,naics.ilike.%${query}%,neighborhood.ilike.%${query}%,cluster.ilike.%${query}%`)
      .limit(limit)
    
    return businesses || []
  }
}

// Enhanced context generation with business intelligence
export async function getEnhancedDatabaseContext(query: string) {
  const context: string[] = []
  
  try {
    // Get semantically relevant businesses
    const businesses = await semanticBusinessSearch(query, 8)
    
    if (businesses.length > 0) {
      context.push('Relevant Charlotte Businesses:')
      
      // Group by industry for better context
      const industriesMapped = new Map()
      businesses.forEach(business => {
        const industry = business.industry || 'Other'
        if (!industriesMapped.has(industry)) {
          industriesMapped.set(industry, [])
        }
        industriesMapped.get(industry).push(business)
      })
      
      // Add businesses grouped by industry
      for (const [industry, businessList] of industriesMapped) {
        context.push(`\n${industry} Sector:`)
        businessList.forEach((business: any) => {
          const revenue = business.revenue ? `$${(business.revenue / 1000000).toFixed(1)}M` : 'N/A'
          const employees = business.employees || 'N/A'
          const established = business.year_established || 'N/A'
          
          context.push(`  • ${business.name} (${business.neighborhood || 'Charlotte'})`)
          context.push(`    Revenue: ${revenue} | Employees: ${employees} | Est: ${established}`)
          context.push(`    Cluster: ${business.cluster || 'General'} | Type: ${business.business_type || 'Local'}`)
        })
      }
      
      // Add business analytics summary
      const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0)
      const avgEmployees = businesses.reduce((sum, b) => sum + (b.employees || 0), 0) / businesses.length
      const industries = [...new Set(businesses.map(b => b.industry).filter(Boolean))]
      
      context.push(`\nBusiness Analytics Summary:`)
      context.push(`• Total Combined Revenue: $${(totalRevenue / 1000000).toFixed(1)}M`)
      context.push(`• Average Employees: ${Math.round(avgEmployees)} per business`)
      context.push(`• Industries Represented: ${industries.join(', ')}`)
      context.push(`• Geographic Spread: ${[...new Set(businesses.map(b => b.neighborhood).filter(Boolean))].join(', ')}`)
    }

    // Get neighborhood insights
    if (query.toLowerCase().includes('neighborhood') || query.toLowerCase().includes('area')) {
      const { data: neighborhoodStats } = await supabase
        .from('businesses')
        .select('neighborhood, revenue, employees')
        .not('neighborhood', 'is', null)
      
      if (neighborhoodStats && neighborhoodStats.length > 0) {
        const neighborhoodMap = new Map()
        neighborhoodStats.forEach(business => {
          const neighborhood = business.neighborhood
          if (!neighborhoodMap.has(neighborhood)) {
            neighborhoodMap.set(neighborhood, { businesses: 0, totalRevenue: 0, totalEmployees: 0 })
          }
          const stats = neighborhoodMap.get(neighborhood)
          stats.businesses++
          stats.totalRevenue += business.revenue || 0
          stats.totalEmployees += business.employees || 0
        })
        
        const topNeighborhoods = Array.from(neighborhoodMap.entries())
          .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
          .slice(0, 5)
        
        context.push(`\nTop Charlotte Neighborhoods by Business Activity:`)
        topNeighborhoods.forEach(([name, stats]) => {
          context.push(`• ${name}: ${stats.businesses} businesses, $${(stats.totalRevenue / 1000000).toFixed(1)}M revenue, ${stats.totalEmployees} employees`)
        })
      }
    }

    // Add recent developments with better context
    const { data: developments } = await supabase
      .from('developments')
      .select('title, content, source, published_at, category, sentiment')
      .order('published_at', { ascending: false })
      .limit(3)
    
    if (developments && developments.length > 0) {
      context.push(`\nRecent Charlotte Business Developments:`)
      developments.forEach(dev => {
        const sentiment = dev.sentiment ? ` [${dev.sentiment.toUpperCase()}]` : ''
        context.push(`• ${dev.title}${sentiment}`)
        context.push(`  ${dev.content.substring(0, 150)}...`)
        context.push(`  Source: ${dev.source} (${new Date(dev.published_at).toLocaleDateString()})`)
      })
    }

    // Get economic indicators with context
    const { data: indicators } = await supabase
      .from('economic_indicators')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()
    
    if (indicators) {
      context.push(`\nCharlotte Economic Climate (${new Date(indicators.date).toLocaleDateString()}):`)
      context.push(`• Unemployment: ${indicators.unemployment_rate}% | GDP Growth: ${indicators.gdp_growth}%`)
      context.push(`• Job Growth: ${indicators.job_growth} new jobs | Median Income: $${indicators.median_income?.toLocaleString()}`)
      context.push(`• Housing Starts: ${indicators.housing_starts} | Retail Growth: ${indicators.retail_sales_growth}%`)
    }

  } catch (error) {
    console.error('Error generating enhanced context:', error)
    context.push('Note: Some advanced analytics temporarily unavailable.')
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

  try {
    const { action, query, text } = req.body

    switch (action) {
      case 'search':
        const results = await semanticBusinessSearch(query || '', 10)
        return res.status(200).json({ results })
      
      case 'embed':
        const embedding = await createEmbedding(text || '')
        return res.status(200).json({ embedding })
      
      case 'context':
        const context = await getEnhancedDatabaseContext(query || '')
        return res.status(200).json({ context })
      
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Embeddings service error:', error)
    return res.status(500).json({ 
      error: 'Service error', 
      message: error.message 
    })
  }
}
