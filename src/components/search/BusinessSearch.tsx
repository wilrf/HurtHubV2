import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { businessDataService } from '@/services/businessDataService'
import type { Business, BusinessSearchFilters, BusinessSearchResult } from '@/types/business'
import { useTheme } from '@/contexts/ThemeContext'

interface BusinessSearchProps {
  onResults?: (results: BusinessSearchResult) => void
  onBusinessSelect?: (business: Business) => void
  showFilters?: boolean
  placeholder?: string
  className?: string
}

export function BusinessSearch({ 
  onResults, 
  onBusinessSelect,
  showFilters = true, 
  placeholder = "Search businesses by name, industry, or location...",
  className = ""
}: BusinessSearchProps) {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<BusinessSearchFilters>({})
  const [results, setResults] = useState<BusinessSearchResult | null>(null)
  const [filterOptions, setFilterOptions] = useState<{
    industries: string[]
    neighborhoods: string[]
    businessTypes: string[]
    clusters: string[]
  } | null>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Load filter options on mount
  useEffect(() => {
    businessDataService.getFilterOptions().then(setFilterOptions)
  }, [])

  // Perform search
  const performSearch = async (searchFilters: BusinessSearchFilters, page: number = 1) => {
    setIsLoading(true)
    try {
      const searchResults = await businessDataService.searchBusinesses(searchFilters, page, 20)
      setResults(searchResults)
      onResults?.(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Search when query or filters change
  useEffect(() => {
    const searchFilters = { ...filters, query: query.trim() || undefined }
    if (query.trim() || Object.keys(filters).length > 0) {
      performSearch(searchFilters, 1)
      setCurrentPage(1)
    } else {
      setResults(null)
    }
  }, [query, filters])

  const handleFilterChange = (key: keyof BusinessSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilter = (key: keyof BusinessSearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setFilters({})
    setQuery('')
  }

  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof BusinessSearchFilters]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined)
      }
      return value !== undefined
    }).length
  }, [filters])

  return (
    <div className={`${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          leftIcon={Search}
          className="pr-24"
        />
        
        {showFilters && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-1 ${showFiltersPanel ? 'text-primary' : ''}`}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && showFiltersPanel && filterOptions && (
        <Card variant={isDarkMode ? 'glass' : 'elevated'} className="mt-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Advanced Filters</h3>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Industry Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <select
                  multiple
                  value={filters.industry || []}
                  onChange={(e) => handleFilterChange('industry', Array.from(e.target.selectedOptions, o => o.value))}
                  className={`w-full p-2 border rounded-md ${
                    isDarkMode 
                      ? 'bg-midnight-800 border-midnight-700 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  size={4}
                >
                  {filterOptions.industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* Neighborhood Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Neighborhood</label>
                <select
                  multiple
                  value={filters.neighborhood || []}
                  onChange={(e) => handleFilterChange('neighborhood', Array.from(e.target.selectedOptions, o => o.value))}
                  className={`w-full p-2 border rounded-md ${
                    isDarkMode 
                      ? 'bg-midnight-800 border-midnight-700 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  size={4}
                >
                  {filterOptions.neighborhoods.map(neighborhood => (
                    <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                  ))}
                </select>
              </div>

              {/* Business Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Business Type</label>
                <select
                  multiple
                  value={filters.businessType || []}
                  onChange={(e) => handleFilterChange('businessType', Array.from(e.target.selectedOptions, o => o.value))}
                  className={`w-full p-2 border rounded-md ${
                    isDarkMode 
                      ? 'bg-midnight-800 border-midnight-700 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  size={4}
                >
                  {filterOptions.businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Employee Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Employees</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.employeeRange?.min || ''}
                    onChange={(e) => handleFilterChange('employeeRange', {
                      ...filters.employeeRange,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.employeeRange?.max || ''}
                    onChange={(e) => handleFilterChange('employeeRange', {
                      ...filters.employeeRange,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>

              {/* Revenue Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Revenue</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min $"
                    value={filters.revenueRange?.min || ''}
                    onChange={(e) => handleFilterChange('revenueRange', {
                      ...filters.revenueRange,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max $"
                    value={filters.revenueRange?.max || ''}
                    onChange={(e) => handleFilterChange('revenueRange', {
                      ...filters.revenueRange,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>

              {/* Year Established */}
              <div>
                <label className="text-sm font-medium mb-2 block">Year Established</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="From"
                    value={filters.yearEstablished?.min || ''}
                    onChange={(e) => handleFilterChange('yearEstablished', {
                      ...filters.yearEstablished,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="To"
                    value={filters.yearEstablished?.max || ''}
                    onChange={(e) => handleFilterChange('yearEstablished', {
                      ...filters.yearEstablished,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.industry?.map(industry => (
                    <Badge key={industry} variant="secondary" className="text-xs">
                      Industry: {industry}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-0 h-auto"
                        onClick={() => {
                          const newIndustries = filters.industry?.filter(i => i !== industry) || []
                          handleFilterChange('industry', newIndustries.length > 0 ? newIndustries : undefined)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  
                  {filters.neighborhood?.map(neighborhood => (
                    <Badge key={neighborhood} variant="secondary" className="text-xs">
                      Location: {neighborhood}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-0 h-auto"
                        onClick={() => {
                          const newNeighborhoods = filters.neighborhood?.filter(n => n !== neighborhood) || []
                          handleFilterChange('neighborhood', newNeighborhoods.length > 0 ? newNeighborhoods : undefined)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}

                  {filters.employeeRange && (
                    <Badge variant="secondary" className="text-xs">
                      Employees: {filters.employeeRange.min || 0} - {filters.employeeRange.max || '∞'}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-0 h-auto"
                        onClick={() => clearFilter('employeeRange')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}

                  {filters.revenueRange && (
                    <Badge variant="secondary" className="text-xs">
                      Revenue: ${filters.revenueRange.min || 0} - ${filters.revenueRange.max || '∞'}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-0 h-auto"
                        onClick={() => clearFilter('revenueRange')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {results.total} businesses found {query && `for "${query}"`}
            </p>
            
            <div className="flex items-center gap-2">
              <select
                value={filters.sortBy || 'name'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className={`text-sm p-1 border rounded ${
                  isDarkMode 
                    ? 'bg-midnight-800 border-midnight-700 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="name">Name</option>
                <option value="revenue">Revenue</option>
                <option value="employees">Employees</option>
                <option value="rating">Rating</option>
                <option value="yearEstablished">Year Est.</option>
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  filters.sortOrder === 'asc' ? 'rotate-180' : ''
                }`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.businesses.map(business => (
                <Card
                  key={business.id}
                  variant={isDarkMode ? 'glass' : 'elevated'}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => {
                    onBusinessSelect?.(business)
                    navigate(`/business/${business.id}`)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {business.industry} • {business.neighborhood}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {business.businessType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {business.employees} employees
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ${(business.revenue / 1000000).toFixed(1)}M revenue
                          </Badge>
                          {business.rating && (
                            <Badge variant="outline" className="text-xs">
                              ⭐ {business.rating.toFixed(1)}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {business.address.line1}, {business.address.city}, {business.address.state}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {results.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const newPage = currentPage - 1
                      setCurrentPage(newPage)
                      performSearch(filters, newPage)
                    }}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-3">
                    Page {currentPage} of {results.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= results.totalPages}
                    onClick={() => {
                      const newPage = currentPage + 1
                      setCurrentPage(newPage)
                      performSearch(filters, newPage)
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}