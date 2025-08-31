// Charlotte Business Domain Knowledge Base
// Enhanced prompts and business intelligence for AI training

export const CHARLOTTE_BUSINESS_KNOWLEDGE = {
  // Core business ecosystem understanding
  ECOSYSTEM_CONTEXT: `
Charlotte Business Ecosystem Context:

MAJOR ECONOMIC SECTORS:
• Financial Services Hub: Second-largest banking center in US (Bank of America HQ, Wells Fargo operations)
• Technology & Innovation: Growing fintech, healthtech, and enterprise software sectors
• Transportation & Logistics: Major distribution hub with Charlotte Douglas International Airport
• Energy Sector: Duke Energy headquarters, renewable energy initiatives
• Healthcare & Life Sciences: Atrium Health, major medical research institutions
• Manufacturing: Aerospace, automotive, and advanced manufacturing

NEIGHBORHOOD BUSINESS DISTRICTS:
• Uptown/Center City: Corporate headquarters, financial services, high-end dining
• SouthEnd: Mixed-use development, breweries, tech startups, young professionals
• NoDa (North Davidson): Arts district, creative businesses, craft breweries, music venues
• Plaza Midwood: Local restaurants, vintage shops, creative services
• Ballantyne: Corporate offices, retail, professional services
• University Research Park: Biotech, research institutions, UNC Charlotte partnerships

BUSINESS ECOSYSTEM PATTERNS:
• Small Business Concentration: 70%+ of businesses have <50 employees
• Industry Clusters: Financial services downtown, tech in University area, manufacturing in outer counties
• Growth Patterns: Rapid expansion in fintech, healthcare technology, and advanced manufacturing
• Collaboration Networks: Strong public-private partnerships, Chamber of Commerce leadership
`,

  // Industry-specific knowledge
  INDUSTRY_INSIGHTS: {
    'Financial Services': `
Banking & Finance in Charlotte:
• Global significance: 2nd largest banking center in US
• Major players: Bank of America (HQ), Wells Fargo East Coast operations, Truist
• Fintech ecosystem: Growing startup scene, accelerators, venture capital
• Regulatory environment: Federal Reserve Bank of Richmond branch
• Employment: 60,000+ direct financial services jobs
• Innovation focus: Digital banking, blockchain, payment processing
`,

    'Technology': `
Charlotte Tech Ecosystem:
• Emerging fintech hub: Payment processing, digital banking, insurtech
• Enterprise software: B2B SaaS, cloud services, cybersecurity
• Research institutions: UNC Charlotte, partnerships with major corporations
• Startup support: Queen City Forward, Packard Place, various accelerators
• Talent pipeline: Growing developer community, coding bootcamps, university programs
• Investment: Increasing VC activity, corporate venture arms
`,

    'Healthcare': `
Charlotte Healthcare Sector:
• Atrium Health: Major regional health system, research hospital
• Medical research: Clinical trials, biotech startups, medical device companies
• Healthcare IT: Growing healthtech startup ecosystem
• Specialty services: Cardiology, oncology, pediatrics excellence
• Innovation: Telemedicine, digital health platforms, medical AI
`,

    'Manufacturing': `
Charlotte Manufacturing Base:
• Aerospace: Parts manufacturing, maintenance, repair, overhaul (MRO)
• Automotive: Supplier network, electric vehicle components
• Advanced manufacturing: 3D printing, automation, smart factory technology
• Logistics integration: Strategic location for distribution and manufacturing
• Workforce development: Community college partnerships, apprenticeship programs
`
  },

  // Business relationship patterns
  RELATIONSHIP_PATTERNS: `
Charlotte Business Relationship Dynamics:

SUPPLY CHAIN NETWORKS:
• Banking technology vendors serving financial institutions
• Manufacturing suppliers supporting aerospace and automotive
• Healthcare technology serving Atrium Health and regional providers
• Logistics and distribution supporting regional manufacturing

COLLABORATION ECOSYSTEMS:
• Corporate-startup partnerships (Bank of America + fintech startups)
• University-industry research collaborations (UNC Charlotte)
• Public-private economic development initiatives
• Chamber of Commerce business networking and advocacy

COMPETITIVE LANDSCAPES:
• Financial services: Competition for fintech talent and innovation
• Real estate: Competition for prime uptown and SouthEnd locations
• Healthcare: Regional competition for specialized services and talent
• Technology: Talent acquisition competition with Atlanta and Research Triangle
`,

  // Economic indicators interpretation
  ECONOMIC_INDICATORS_GUIDE: `
Charlotte Economic Indicators Context:

UNEMPLOYMENT RATE:
• Typical range: 3-5% (lower than national average)
• Seasonal patterns: Lower in spring/summer (construction, hospitality)
• Industry impact: Financial services stability buffers economic downturns

GDP GROWTH:
• Historical average: 2-4% annually
• Drivers: Population growth, business relocations, financial services expansion
• Volatility: Banking sector ties to national economic cycles

JOB GROWTH:
• Strong sectors: Technology, healthcare, professional services
• Challenges: Manufacturing automation, retail consolidation
• Trends: Shift toward knowledge work, service economy growth

MEDIAN INCOME:
• Above national average due to financial services concentration
• Income inequality: Significant disparity between banking executives and service workers
• Growth trajectory: Steady increase with cost of living adjustments
`,

  // Response guidelines for different query types
  RESPONSE_GUIDELINES: {
    MARKET_ANALYSIS: `
When analyzing markets:
• Consider Charlotte's unique position as banking hub
• Account for regional competition (Atlanta, Raleigh-Durham)
• Assess impact of major employers (Bank of America, Atrium Health, Duke Energy)
• Evaluate transportation advantages (airport, highway access)
• Consider regulatory environment and tax incentives
`,

    BUSINESS_RECOMMENDATIONS: `
When making business recommendations:
• Leverage Charlotte's financial services ecosystem for fintech opportunities
• Consider university partnerships for research and talent
• Evaluate neighborhood characteristics for location decisions
• Assess supply chain advantages for manufacturing and logistics
• Consider quality of life factors for talent attraction
`,

    COMPETITIVE_ANALYSIS: `
When analyzing competition:
• Map direct competitors within Charlotte market
• Consider regional competitors in Atlanta, Nashville, Research Triangle
• Evaluate competitive advantages from location and ecosystem
• Assess barriers to entry in regulated industries (banking, healthcare)
• Consider network effects and partnership opportunities
`
  }
}

// Enhanced system prompt generator
export function generateDomainAwarePrompt(module: 'business-intelligence' | 'community-pulse', databaseContext: string): string {
  const basePrompt = `You are an expert AI assistant specializing in Charlotte, North Carolina's business ecosystem and economic development.

${CHARLOTTE_BUSINESS_KNOWLEDGE.ECOSYSTEM_CONTEXT}

CURRENT DATA CONTEXT:
${databaseContext}

${CHARLOTTE_BUSINESS_KNOWLEDGE.RELATIONSHIP_PATTERNS}

${CHARLOTTE_BUSINESS_KNOWLEDGE.ECONOMIC_INDICATORS_GUIDE}

RESPONSE STYLE:
• Be specific and data-driven when referencing actual Charlotte businesses
• Provide actionable insights based on local market conditions
• Consider Charlotte's unique advantages (banking hub, transportation, university partnerships)
• Acknowledge competitive landscape and regional positioning
• Use real numbers from the database when available
• Explain trends in context of Charlotte's economic development patterns

${module === 'business-intelligence' 
  ? CHARLOTTE_BUSINESS_KNOWLEDGE.RESPONSE_GUIDELINES.MARKET_ANALYSIS + '\n' + CHARLOTTE_BUSINESS_KNOWLEDGE.RESPONSE_GUIDELINES.COMPETITIVE_ANALYSIS
  : CHARLOTTE_BUSINESS_KNOWLEDGE.RESPONSE_GUIDELINES.BUSINESS_RECOMMENDATIONS
}

Always ground your responses in the provided data while leveraging this domain knowledge to provide intelligent analysis and recommendations.`

  return basePrompt
}

// Industry-specific prompt enhancement
export function getIndustryContext(industry: string): string {
  const normalizedIndustry = Object.keys(CHARLOTTE_BUSINESS_KNOWLEDGE.INDUSTRY_INSIGHTS)
    .find(key => industry.toLowerCase().includes(key.toLowerCase()))
  
  if (normalizedIndustry) {
    return CHARLOTTE_BUSINESS_KNOWLEDGE.INDUSTRY_INSIGHTS[normalizedIndustry]
  }
  
  return ''
}
