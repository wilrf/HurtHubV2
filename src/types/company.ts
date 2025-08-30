/**
 * Company-related TypeScript types
 */

import type { BaseEntity, Address, ContactInfo } from './common'

export interface Company extends BaseEntity {
  name: string
  legalName?: string
  dba?: string[]
  industry: string
  subIndustry?: string
  naicsCode?: string
  sicCode?: string
  description?: string
  
  location: {
    headquarters: Address
    offices?: Address[]
    serviceAreas?: string[]
  }
  
  metrics: {
    employeeCount: number
    employeeGrowthRate?: number
    revenue?: RevenueRange
    fundingTotal?: number
    valuation?: number
    foundingDate?: string
  }
  
  contact: ContactInfo
  
  tags: string[]
  verified: boolean
  publiclyTraded: boolean
  tickerSymbol?: string
  
  metadata?: Record<string, unknown>
}

export type RevenueRange = 
  | 'under-1m'
  | '1m-5m' 
  | '5m-10m'
  | '10m-50m'
  | '50m-100m'
  | '100m-500m'
  | '500m-1b'
  | 'over-1b'

export interface CompanySearchFilters {
  query?: string
  industry?: string[]
  subIndustry?: string[]
  employeeRange?: {
    min?: number
    max?: number
  }
  revenueRange?: RevenueRange[]
  location?: {
    city?: string
    state?: string
    radius?: number
    coordinates?: {
      lat: number
      lng: number
    }
  }
  tags?: string[]
  verified?: boolean
  publiclyTraded?: boolean
  foundingYear?: {
    min?: number
    max?: number
  }
}

export interface Investment extends BaseEntity {
  companyId: string
  company?: Company
  amount: number
  roundType: InvestmentRoundType
  investors: string[]
  leadInvestor?: string
  announcedDate: string
  description?: string
  metadata?: Record<string, unknown>
}

export type InvestmentRoundType = 
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b' 
  | 'series-c'
  | 'series-d'
  | 'bridge'
  | 'ipo'
  | 'acquisition'
  | 'other'

export interface CompanyAnalytics {
  companyId: string
  metrics: {
    growth: {
      employeeGrowth: number
      revenueGrowth: number
      fundingGrowth: number
    }
    market: {
      marketShare: number
      competitorCount: number
      industryRank: number
    }
    social: {
      linkedinFollowers: number
      glassdoorRating: number
      newsmentions: number
    }
  }
  trends: {
    date: string
    employees: number
    revenue: number
    valuation: number
  }[]
  competitors: {
    companyId: string
    similarityScore: number
    competitionLevel: 'low' | 'medium' | 'high'
  }[]
}

export interface Industry {
  id: string
  name: string
  description: string
  naicsCode: string
  parentIndustryId?: string
  subIndustries?: Industry[]
  companyCount: number
  averageEmployees: number
  totalRevenue: number
}

export interface EconomicIndicator extends BaseEntity {
  indicatorType: string
  value: number
  unit: string
  periodStart: string
  periodEnd: string
  source: string
  region?: string
  metadata?: Record<string, unknown>
}

export interface Development extends BaseEntity {
  type: DevelopmentType
  title: string
  description: string
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
  impactLevel: 'low' | 'medium' | 'high'
  status: DevelopmentStatus
  source: string
  sourceUrl?: string
  publishedAt: string
  relatedCompanies?: string[]
  estimatedJobs?: number
  estimatedInvestment?: number
  metadata?: Record<string, unknown>
}

export type DevelopmentType = 
  | 'new-business'
  | 'expansion' 
  | 'relocation'
  | 'investment'
  | 'partnership'
  | 'acquisition'
  | 'closure'
  | 'infrastructure'
  | 'policy'
  | 'other'

export type DevelopmentStatus = 
  | 'announced'
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'delayed'