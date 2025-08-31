import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Advanced business relationship analysis
export async function analyzeBusinessRelationships(businessId?: string) {
  try {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
    
    if (!businesses) return null

    // Analyze industry clusters
    const industryMap = new Map()
    const neighborhoodMap = new Map()
    const clusterMap = new Map()

    businesses.forEach(business => {
      // Industry analysis
      const industry = business.industry || 'Other'
      if (!industryMap.has(industry)) {
        industryMap.set(industry, {
          count: 0,
          totalRevenue: 0,
          totalEmployees: 0,
          businesses: [],
          avgRevenue: 0,
          avgEmployees: 0
        })
      }
      const industryData = industryMap.get(industry)
      industryData.count++
      industryData.totalRevenue += business.revenue || 0
      industryData.totalEmployees += business.employees || 0
      industryData.businesses.push(business)

      // Neighborhood analysis
      const neighborhood = business.neighborhood || 'Unknown'
      if (!neighborhoodMap.has(neighborhood)) {
        neighborhoodMap.set(neighborhood, {
          count: 0,
          industries: new Set(),
          totalRevenue: 0,
          businesses: []
        })
      }
      const neighborhoodData = neighborhoodMap.get(neighborhood)
      neighborhoodData.count++
      neighborhoodData.industries.add(industry)
      neighborhoodData.totalRevenue += business.revenue || 0
      neighborhoodData.businesses.push(business)

      // Cluster analysis
      const cluster = business.cluster || 'General'
      if (!clusterMap.has(cluster)) {
        clusterMap.set(cluster, {
          count: 0,
          totalRevenue: 0,
          neighborhoods: new Set(),
          businesses: []
        })
      }
      const clusterData = clusterMap.get(cluster)
      clusterData.count++
      clusterData.totalRevenue += business.revenue || 0
      clusterData.neighborhoods.add(neighborhood)
      clusterData.businesses.push(business)
    })

    // Calculate averages
    for (const [industry, data] of industryMap) {
      data.avgRevenue = data.totalRevenue / data.count
      data.avgEmployees = data.totalEmployees / data.count
    }

    // Find business relationships and opportunities
    const relationships = []
    
    // Same industry, different neighborhoods (expansion opportunities)
    for (const [industry, data] of industryMap) {
      if (data.count > 1) {
        const neighborhoods = [...new Set(data.businesses.map(b => b.neighborhood))]
        if (neighborhoods.length > 1) {
          relationships.push({
            type: 'expansion_opportunity',
            industry,
            description: `${industry} businesses span ${neighborhoods.length} neighborhoods`,
            neighborhoods,
            potential: 'Geographic expansion within industry'
          })
        }
      }
    }

    // Same neighborhood, different industries (collaboration opportunities)
    for (const [neighborhood, data] of neighborhoodMap) {
      if (data.industries.size > 3) {
        relationships.push({
          type: 'collaboration_hub',
          neighborhood,
          description: `${neighborhood} has ${data.industries.size} different industries`,
          industries: [...data.industries],
          potential: 'Cross-industry collaboration and networking'
        })
      }
    }

    // Identify market gaps
    const marketGaps = []
    const topIndustries = [...industryMap.entries()]
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 5)

    const establishedNeighborhoods = [...neighborhoodMap.entries()]
      .filter(([_, data]) => data.count > 5)
      .map(([name]) => name)

    topIndustries.forEach(([industry, industryData]) => {
      establishedNeighborhoods.forEach(neighborhood => {
        const hasPresence = industryData.businesses.some(b => b.neighborhood === neighborhood)
        if (!hasPresence) {
          marketGaps.push({
            industry,
            neighborhood,
            opportunity: `No ${industry} presence in ${neighborhood}`,
            potential_revenue: industryData.avgRevenue,
            market_size: neighborhoodMap.get(neighborhood)?.count || 0
          })
        }
      })
    })

    return {
      summary: {
        totalBusinesses: businesses.length,
        totalIndustries: industryMap.size,
        totalNeighborhoods: neighborhoodMap.size,
        totalClusters: clusterMap.size,
        totalRevenue: businesses.reduce((sum, b) => sum + (b.revenue || 0), 0),
        totalEmployees: businesses.reduce((sum, b) => sum + (b.employees || 0), 0)
      },
      industryAnalysis: Object.fromEntries(industryMap),
      neighborhoodAnalysis: Object.fromEntries(neighborhoodMap),
      clusterAnalysis: Object.fromEntries(clusterMap),
      relationships,
      marketGaps: marketGaps.slice(0, 10), // Top 10 opportunities
      insights: generateBusinessInsights(industryMap, neighborhoodMap, clusterMap)
    }
  } catch (error) {
    console.error('Business relationship analysis error:', error)
    return null
  }
}

// Generate intelligent business insights
function generateBusinessInsights(industryMap: Map<string, any>, neighborhoodMap: Map<string, any>, clusterMap: Map<string, any>) {
  const insights = []

  // Top performing industries
  const topIndustries = [...industryMap.entries()]
    .sort((a, b) => b[1].avgRevenue - a[1].avgRevenue)
    .slice(0, 3)

  insights.push({
    type: 'top_industries',
    title: 'Highest Revenue Industries',
    data: topIndustries.map(([industry, data]) => ({
      industry,
      avgRevenue: data.avgRevenue,
      businessCount: data.count,
      insight: `${industry} shows strong performance with average revenue of $${(data.avgRevenue / 1000000).toFixed(1)}M per business`
    }))
  })

  // Emerging neighborhoods
  const emergingNeighborhoods = [...neighborhoodMap.entries()]
    .filter(([_, data]) => data.count >= 3 && data.industries.size >= 3)
    .sort((a, b) => b[1].industries.size - a[1].industries.size)
    .slice(0, 3)

  insights.push({
    type: 'emerging_areas',
    title: 'Diverse Business Hubs',
    data: emergingNeighborhoods.map(([neighborhood, data]) => ({
      neighborhood,
      businessCount: data.count,
      industryDiversity: data.industries.size,
      insight: `${neighborhood} shows strong business diversity with ${data.industries.size} different industries`
    }))
  })

  // Business size distribution
  const sizeDistribution = { small: 0, medium: 0, large: 0 }
  for (const [_, data] of industryMap) {
    data.businesses.forEach(business => {
      const employees = business.employees || 0
      if (employees < 50) sizeDistribution.small++
      else if (employees < 250) sizeDistribution.medium++
      else sizeDistribution.large++
    })
  }

  insights.push({
    type: 'size_distribution',
    title: 'Business Size Analysis',
    data: sizeDistribution,
    insight: `Small businesses (${sizeDistribution.small}) dominate the ecosystem, with ${sizeDistribution.medium} medium and ${sizeDistribution.large} large businesses`
  })

  return insights
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { businessId } = req.query
    const analysis = await analyzeBusinessRelationships(businessId as string)
    
    if (!analysis) {
      return res.status(500).json({ error: 'Failed to generate business analysis' })
    }

    return res.status(200).json(analysis)
  } catch (error) {
    console.error('Business analytics API error:', error)
    return res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    })
  }
}
