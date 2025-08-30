import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Users, 
  DollarSign, 
  MapPin,
  Star,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BusinessSearch } from '@/components/search/BusinessSearch'
import { businessDataService } from '@/services/businessDataService'
import type { BusinessAnalytics, Business, BusinessSearchResult } from '@/types/business'
import { useTheme } from '@/contexts/ThemeContext'

export function Dashboard() {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null)
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([])
  const [searchResults, setSearchResults] = useState<BusinessSearchResult | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [analyticsData, allBusinesses] = await Promise.all([
        businessDataService.getAnalytics(),
        businessDataService.getAllBusinesses()
      ])
      
      setAnalytics(analyticsData)
      setRecentBusinesses(allBusinesses.slice(0, 8))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null || isNaN(amount)) return '$0'
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num == null || isNaN(num)) return '0'
    return num.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Business Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Charlotte Economic Development Platform Overview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant={isDarkMode ? 'glass' : 'default'}>
            <Filter className="h-4 w-4 mr-2" />
            Advanced Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(analytics.totalBusinesses)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-blue-50'
                }`}>
                  <Building2 className={`h-6 w-6 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+12% from last quarter</span>
              </div>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.totalRevenue)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-green-50'
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+8.5% year over year</span>
              </div>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(analytics.totalEmployees)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-purple-50'
                }`}>
                  <Users className={`h-6 w-6 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+15% job growth</span>
              </div>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Revenue/Business</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.averageRevenue)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-orange-50'
                }`}>
                  <BarChart3 className={`h-6 w-6 ${
                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+3.2% efficiency</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Search */}
      <Card variant={isDarkMode ? 'glass' : 'elevated'}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Business Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessSearch 
            onResults={setSearchResults}
            onBusinessSelect={setSelectedBusiness}
          />
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Industries */}
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Top Industries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topIndustries?.slice(0, 6).map((industry, index) => (
                  <div key={industry.industry} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-orange-500' :
                        index === 4 ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{industry.industry}</p>
                        <p className="text-xs text-muted-foreground">
                          {industry.count} businesses • {formatNumber(industry.totalEmployees)} employees
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(industry.totalRevenue)}</p>
                      <div className={`w-20 h-2 rounded-full mt-1 ${
                        isDarkMode ? 'bg-midnight-800' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-purple-500' :
                            index === 3 ? 'bg-orange-500' :
                            index === 4 ? 'bg-red-500' : 'bg-gray-500'
                          }`}
                          style={{ 
                            width: `${(industry.totalRevenue / (analytics.topIndustries?.[0]?.totalRevenue || 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Neighborhoods */}
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Top Neighborhoods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topNeighborhoods?.slice(0, 6).map((neighborhood, index) => (
                  <div key={neighborhood.neighborhood} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        index === 0 ? 'bg-cyan-500' :
                        index === 1 ? 'bg-teal-500' :
                        index === 2 ? 'bg-indigo-500' :
                        index === 3 ? 'bg-pink-500' :
                        index === 4 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{neighborhood.neighborhood}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          {neighborhood.count} businesses • 
                          <Star className="h-3 w-3 text-yellow-400 ml-1 mr-1" />
                          {neighborhood.avgRating?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(neighborhood.totalRevenue)}</p>
                      <div className={`w-20 h-2 rounded-full mt-1 ${
                        isDarkMode ? 'bg-midnight-800' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-cyan-500' :
                            index === 1 ? 'bg-teal-500' :
                            index === 2 ? 'bg-indigo-500' :
                            index === 3 ? 'bg-pink-500' :
                            index === 4 ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                          style={{ 
                            width: `${(neighborhood.totalRevenue / (analytics.topNeighborhoods?.[0]?.totalRevenue || 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue and Age Distribution */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Distribution */}
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Revenue Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.revenueDistribution?.map((range, index) => (
                  <div key={range.range} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium min-w-[120px]">{range.range}</span>
                    </div>
                    <div className="flex items-center flex-1 mx-4">
                      <div className={`w-full h-3 rounded-full ${
                        isDarkMode ? 'bg-midnight-800' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                          style={{ 
                            width: `${(range.count / Math.max(...(analytics.revenueDistribution?.map(r => r.count) || [1]))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground min-w-[50px] text-right">
                      {range.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Age Distribution */}
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Business Age Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.businessAgeDistribution?.map((age, index) => (
                  <div key={age.ageRange} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium min-w-[100px]">{age.ageRange}</span>
                    </div>
                    <div className="flex items-center flex-1 mx-4">
                      <div className={`w-full h-3 rounded-full ${
                        isDarkMode ? 'bg-midnight-800' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                          style={{ 
                            width: `${(age.count / Math.max(...(analytics.businessAgeDistribution?.map(a => a.count) || [1]))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground min-w-[50px] text-right">
                      {age.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Businesses */}
      <Card variant={isDarkMode ? 'glass' : 'elevated'}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Featured Businesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentBusinesses.map(business => (
              <Card 
                key={business.id} 
                variant="outline" 
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate(`/business/${business.id}`)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1">{business.name}</h3>
                      <p className="text-xs text-muted-foreground">{business.industry}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="text-xs px-2">
                        {business.employees} emp
                      </Badge>
                      {business.rating && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          <span>{business.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium">{formatCurrency(business.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{business.neighborhood}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Business Modal/Details would go here */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card variant={isDarkMode ? 'glass' : 'elevated'} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedBusiness.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBusiness(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-sm">{selectedBusiness.industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                  <p className="text-sm">{selectedBusiness.businessType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-sm">{formatCurrency(selectedBusiness.revenue)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employees</p>
                  <p className="text-sm">{selectedBusiness.employees}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                <p className="text-sm">
                  {selectedBusiness.address.line1}<br />
                  {selectedBusiness.address.city}, {selectedBusiness.address.state} {selectedBusiness.address.zipCode}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedBusiness.features)
                  .filter(([_, value]) => value)
                  .map(([feature, _]) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Dashboard