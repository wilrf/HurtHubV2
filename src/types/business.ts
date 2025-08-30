/**
 * Business types based on the demo data structure
 */

export interface BusinessAddress {
  line1: string
  line2?: string
  city: string
  state: string
  zipCode?: string
}

export interface NAICSLevels {
  naics2: string
  naics3: string
  naics4: string
}

export interface OperatingCosts {
  rent: number
  payroll: number
  marketing: number
  utilities: number
  other: number
}

export interface BusinessHours {
  monday: { open: string; close: string } | 'Closed'
  tuesday: { open: string; close: string } | 'Closed'
  wednesday: { open: string; close: string } | 'Closed'
  thursday: { open: string; close: string } | 'Closed'
  friday: { open: string; close: string } | 'Closed'
  saturday: { open: string; close: string } | 'Closed'
  sunday: { open: string; close: string } | 'Closed'
}

export interface BusinessFeatures {
  parking: boolean
  transitAccessible: boolean
  wheelchairAccessible: boolean
  wifi: boolean
  outdoorSeating: boolean
  delivery: boolean
  curbsidePickup: boolean
}

export interface BusinessReview {
  id: string
  rating: number
  text: string
  author: string
  date: string
  verified: boolean
}

export interface Business {
  id: string
  name: string
  naics: string
  industry: string
  employeeSizeCategory: string
  address: BusinessAddress
  naicsLevels: NAICSLevels
  businessType: 'Local' | 'Regional' | 'National' | 'Franchise'
  cluster: string
  yearEstablished: number
  owner: string
  phone: string
  email?: string
  website?: string
  
  // Financial Metrics
  employees: number
  revenue: number
  revenuePerEmployee: number
  grossMargin: number
  netMargin: number
  revenueGrowth: number
  
  // Location & Physical
  neighborhood: string
  squareFeet: number
  rentPerSqFt: number
  annualRent: number
  
  // Customer Metrics
  rating: number
  reviewCount: number
  reviews: BusinessReview[]
  
  // Operations
  operatingCosts: OperatingCosts
  industryMetrics: Record<string, string | number>
  businessAge: number
  hours: BusinessHours
  monthlyRevenue: number[] // 12 months
  features: BusinessFeatures
  
  // Metadata
  isDemo: boolean
  dataVersion: string
  lastUpdated: string
}

export interface DemoDataset {
  version: string
  generated: string
  totalBusinesses: number
  metadata: {
    description: string
    improvements: string[]
    dataQuality: {
      hasRealisticFinancials: boolean
      hasLocationContext: boolean
      hasOperatingCosts: boolean
      hasSeasonalData: boolean
      corruptedRecordsFixed: boolean
    }
  }
  businesses: Business[]
}

// Search and filter types
export interface BusinessSearchFilters {
  query?: string
  industry?: string[]
  neighborhood?: string[]
  employeeRange?: {
    min?: number
    max?: number
  }
  revenueRange?: {
    min?: number
    max?: number
  }
  businessType?: string[]
  features?: Partial<BusinessFeatures>
  naics?: string[]
  yearEstablished?: {
    min?: number
    max?: number
  }
  rating?: {
    min?: number
  }
  sortBy?: 'name' | 'revenue' | 'employees' | 'rating' | 'yearEstablished'
  sortOrder?: 'asc' | 'desc'
}

export interface BusinessSearchResult {
  businesses: Business[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  filters: BusinessSearchFilters
}

// Analytics types
export interface BusinessAnalytics {
  totalBusinesses: number
  totalRevenue: number
  totalEmployees: number
  averageRevenue: number
  averageEmployees: number
  topIndustries: Array<{
    industry: string
    count: number
    totalRevenue: number
    totalEmployees: number
  }>
  topNeighborhoods: Array<{
    neighborhood: string
    count: number
    totalRevenue: number
    avgRating: number
  }>
  businessAgeDistribution: Array<{
    ageRange: string
    count: number
  }>
  revenueDistribution: Array<{
    range: string
    count: number
  }>
  monthlyTrends: Array<{
    month: string
    totalRevenue: number
    avgRevenue: number
    businessCount: number
  }>
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  fields: (keyof Business)[]
  filters?: BusinessSearchFilters
  includeAnalytics?: boolean
}

export type BusinessSortField = keyof Pick<Business, 
  | 'name' 
  | 'revenue' 
  | 'employees' 
  | 'rating' 
  | 'yearEstablished'
  | 'revenueGrowth'
  | 'grossMargin'
>

export type BusinessGroupBy = 
  | 'industry'
  | 'neighborhood' 
  | 'businessType'
  | 'cluster'
  | 'employeeSizeCategory'