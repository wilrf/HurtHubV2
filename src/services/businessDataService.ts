/**
 * Business Data Service - Loads and manages demo business data
 */

import type { 
  Business, 
  DemoDataset, 
  BusinessSearchFilters, 
  BusinessSearchResult,
  BusinessAnalytics,
  BusinessSortField
} from '@/types/business'

class BusinessDataService {
  private data: DemoDataset | null = null
  private businesses: Business[] = []
  private isLoaded = false
  private cache = new Map<string, any>()
  private searchIndex = new Map<string, Set<number>>()

  constructor() {
    this.loadData()
  }

  /**
   * Load demo data from JSON file
   */
  private async loadData(): Promise<void> {
    if (this.isLoaded) return

    try {
      const response = await fetch('/improvedDemoData.json')
      if (!response.ok) {
        throw new Error(`Failed to load demo data: ${response.statusText}`)
      }

      this.data = await response.json() as DemoDataset
      this.businesses = this.data.businesses
      this.isLoaded = true
      
      // Build search index
      this.buildSearchIndex()
    } catch (error) {
      console.error('❌ Failed to load demo data:', error)
      throw error
    }
  }

  /**
   * Build search index for fast text search (optimized with chunking)
   */
  private buildSearchIndex(): void {
    // Process in chunks to avoid blocking the main thread
    const chunkSize = 50
    let currentIndex = 0
    
    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, this.businesses.length)
      
      for (let i = currentIndex; i < endIndex; i++) {
        const business = this.businesses[i]
        const searchTerms = [
          business.name.toLowerCase(),
          business.industry.toLowerCase(),
          business.cluster.toLowerCase(),
          business.neighborhood.toLowerCase(),
          business.businessType.toLowerCase(),
          business.owner.toLowerCase(),
          business.naics,
          ...business.name.toLowerCase().split(' '),
          ...business.industry.toLowerCase().split(' '),
        ]

        searchTerms.forEach(term => {
          if (!term.trim()) return
          
          if (!this.searchIndex.has(term)) {
            this.searchIndex.set(term, new Set())
          }
          this.searchIndex.get(term)!.add(i)
        })
      }
      
      currentIndex = endIndex
      
      // Continue processing if more chunks remain
      if (currentIndex < this.businesses.length) {
        // Use setTimeout to yield control back to the browser
        setTimeout(processChunk, 0)
      }
    }
    
    // Start processing
    processChunk()
  }

  /**
   * Ensure data is loaded
   */
  async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadData()
    }
  }

  /**
   * Get all businesses (cached copy)
   */
  async getAllBusinesses(): Promise<Business[]> {
    await this.ensureLoaded()
    
    const cacheKey = 'allBusinesses'
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    // Cache the businesses array to avoid repeated copying
    const businessesCopy = [...this.businesses]
    this.cache.set(cacheKey, businessesCopy)
    return businessesCopy
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string): Promise<Business | null> {
    await this.ensureLoaded()
    return this.businesses.find(b => b.id === id) || null
  }

  /**
   * Search businesses with filters
   */
  async searchBusinesses(
    filters: BusinessSearchFilters = {},
    page: number = 1,
    pageSize: number = 25
  ): Promise<BusinessSearchResult> {
    await this.ensureLoaded()

    const cacheKey = JSON.stringify({ filters, page, pageSize })
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    let filteredBusinesses = [...this.businesses]

    // Text search
    if (filters.query) {
      const queryLower = filters.query.toLowerCase()
      const matchingIndices = new Set<number>()

      // Search in index
      for (const [term, indices] of this.searchIndex.entries()) {
        if (term.includes(queryLower)) {
          indices.forEach(idx => matchingIndices.add(idx))
        }
      }

      filteredBusinesses = Array.from(matchingIndices)
        .map(idx => this.businesses[idx])
        .filter(Boolean)
    }

    // Industry filter
    if (filters.industry?.length) {
      filteredBusinesses = filteredBusinesses.filter(b => 
        filters.industry!.includes(b.industry)
      )
    }

    // Neighborhood filter
    if (filters.neighborhood?.length) {
      filteredBusinesses = filteredBusinesses.filter(b => 
        filters.neighborhood!.includes(b.neighborhood)
      )
    }

    // Employee range filter
    if (filters.employeeRange) {
      const { min, max } = filters.employeeRange
      filteredBusinesses = filteredBusinesses.filter(b => {
        if (min !== undefined && b.employees < min) return false
        if (max !== undefined && b.employees > max) return false
        return true
      })
    }

    // Revenue range filter
    if (filters.revenueRange) {
      const { min, max } = filters.revenueRange
      filteredBusinesses = filteredBusinesses.filter(b => {
        if (min !== undefined && b.revenue < min) return false
        if (max !== undefined && b.revenue > max) return false
        return true
      })
    }

    // Business type filter
    if (filters.businessType?.length) {
      filteredBusinesses = filteredBusinesses.filter(b => 
        filters.businessType!.includes(b.businessType)
      )
    }

    // NAICS filter
    if (filters.naics?.length) {
      filteredBusinesses = filteredBusinesses.filter(b => 
        filters.naics!.some(naics => 
          b.naics.startsWith(naics) || 
          b.naicsLevels.naics2 === naics ||
          b.naicsLevels.naics3 === naics ||
          b.naicsLevels.naics4 === naics
        )
      )
    }

    // Year established filter
    if (filters.yearEstablished) {
      const { min, max } = filters.yearEstablished
      filteredBusinesses = filteredBusinesses.filter(b => {
        if (min !== undefined && b.yearEstablished < min) return false
        if (max !== undefined && b.yearEstablished > max) return false
        return true
      })
    }

    // Rating filter
    if (filters.rating?.min) {
      filteredBusinesses = filteredBusinesses.filter(b => 
        b.rating >= filters.rating!.min!
      )
    }

    // Features filter
    if (filters.features) {
      filteredBusinesses = filteredBusinesses.filter(b => {
        for (const [feature, required] of Object.entries(filters.features!)) {
          if (required && !b.features[feature as keyof typeof b.features]) {
            return false
          }
        }
        return true
      })
    }

    // Sorting
    if (filters.sortBy) {
      filteredBusinesses.sort((a, b) => {
        const field = filters.sortBy as BusinessSortField
        let aVal = a[field]
        let bVal = b[field]

        // Handle string sorting
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return filters.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    // Pagination
    const total = filteredBusinesses.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedBusinesses = filteredBusinesses.slice(startIndex, startIndex + pageSize)

    const result: BusinessSearchResult = {
      businesses: paginatedBusinesses,
      total,
      page,
      pageSize,
      totalPages,
      filters,
    }

    // Cache result
    this.cache.set(cacheKey, result)
    return result
  }

  /**
   * Get business analytics
   */
  async getAnalytics(): Promise<BusinessAnalytics> {
    await this.ensureLoaded()

    const cacheKey = 'analytics'
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const totalBusinesses = this.businesses.length
    const totalRevenue = this.businesses.reduce((sum, b) => sum + b.revenue, 0)
    const totalEmployees = this.businesses.reduce((sum, b) => sum + b.employees, 0)

    // Industry analysis
    const industryMap = new Map<string, { count: number; revenue: number; employees: number }>()
    this.businesses.forEach(b => {
      if (!industryMap.has(b.industry)) {
        industryMap.set(b.industry, { count: 0, revenue: 0, employees: 0 })
      }
      const industry = industryMap.get(b.industry)!
      industry.count++
      industry.revenue += b.revenue
      industry.employees += b.employees
    })

    const topIndustries = Array.from(industryMap.entries())
      .map(([industry, data]) => ({ 
        industry, 
        count: data.count,
        totalRevenue: data.revenue,
        totalEmployees: data.employees
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Neighborhood analysis
    const neighborhoodMap = new Map<string, { count: number; revenue: number; ratings: number[] }>()
    this.businesses.forEach(b => {
      if (!neighborhoodMap.has(b.neighborhood)) {
        neighborhoodMap.set(b.neighborhood, { count: 0, revenue: 0, ratings: [] })
      }
      const neighborhood = neighborhoodMap.get(b.neighborhood)!
      neighborhood.count++
      neighborhood.revenue += b.revenue
      neighborhood.ratings.push(b.rating)
    })

    const topNeighborhoods = Array.from(neighborhoodMap.entries())
      .map(([neighborhood, data]) => ({
        neighborhood,
        count: data.count,
        totalRevenue: data.revenue,
        avgRating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Business age distribution
    const currentYear = new Date().getFullYear()
    const ageRanges = [
      { label: '0-1 years', min: 0, max: 1 },
      { label: '2-5 years', min: 2, max: 5 },
      { label: '6-10 years', min: 6, max: 10 },
      { label: '11-20 years', min: 11, max: 20 },
      { label: '20+ years', min: 21, max: Infinity }
    ]

    const businessAgeDistribution = ageRanges.map(range => ({
      ageRange: range.label,
      count: this.businesses.filter(b => {
        const age = currentYear - b.yearEstablished
        return age >= range.min && age <= range.max
      }).length
    }))

    // Revenue distribution
    const revenueRanges = [
      { label: 'Under $100K', min: 0, max: 100000 },
      { label: '$100K - $500K', min: 100000, max: 500000 },
      { label: '$500K - $1M', min: 500000, max: 1000000 },
      { label: '$1M - $5M', min: 1000000, max: 5000000 },
      { label: '$5M+', min: 5000000, max: Infinity }
    ]

    const revenueDistribution = revenueRanges.map(range => ({
      range: range.label,
      count: this.businesses.filter(b => 
        b.revenue >= range.min && b.revenue < range.max
      ).length
    }))

    // Monthly trends (aggregate all businesses)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const monthlyTrends = monthNames.map((month, index) => {
      const totalRevenue = this.businesses.reduce((sum, b) => 
        sum + (b.monthlyRevenue[index] || 0), 0
      )
      const avgRevenue = totalRevenue / totalBusinesses

      return {
        month,
        totalRevenue,
        avgRevenue,
        businessCount: totalBusinesses
      }
    })

    const analytics: BusinessAnalytics = {
      totalBusinesses,
      totalRevenue,
      totalEmployees,
      averageRevenue: totalRevenue / totalBusinesses,
      averageEmployees: totalEmployees / totalBusinesses,
      topIndustries,
      topNeighborhoods,
      businessAgeDistribution,
      revenueDistribution,
      monthlyTrends,
    }

    this.cache.set(cacheKey, analytics)
    return analytics
  }

  /**
   * Get unique values for filters
   */
  async getFilterOptions(): Promise<{
    industries: string[]
    neighborhoods: string[]
    businessTypes: string[]
    clusters: string[]
  }> {
    await this.ensureLoaded()

    return {
      industries: [...new Set(this.businesses.map(b => b.industry))].sort(),
      neighborhoods: [...new Set(this.businesses.map(b => b.neighborhood))].sort(),
      businessTypes: [...new Set(this.businesses.map(b => b.businessType))].sort(),
      clusters: [...new Set(this.businesses.map(b => b.cluster))].sort(),
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get data metadata
   */
  async getMetadata() {
    await this.ensureLoaded()
    return this.data?.metadata
  }
}

// Export singleton instance
export const businessDataService = new BusinessDataService()