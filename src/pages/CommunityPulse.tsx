import React, { useState, useEffect } from 'react'
import { 
  Users, 
  TrendingUp, 
  MessageCircle, 
  MapPin, 
  Heart, 
  Star,
  Network,
  Calendar,
  Activity,
  Zap,
  Award,
  Globe,
  Building2,
  UserCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BusinessAIChat } from '@/components/ai/BusinessAIChat'
import { businessDataService } from '@/services/businessDataService'
import type { BusinessAnalytics, Business } from '@/types/business'
import { useTheme } from '@/contexts/ThemeContext'

export function CommunityPulse() {
  const { isDarkMode } = useTheme()
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    setIsLoading(true)
    try {
      const [analyticsData, businessData] = await Promise.all([
        businessDataService.getAnalytics(),
        businessDataService.getAllBusinesses()
      ])
      
      setAnalytics(analyticsData)
      setBusinesses(businessData)
    } catch (error) {
      console.error('Failed to load community data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num == null || isNaN(num)) return '0'
    return num.toLocaleString()
  }

  const getCommunityMetrics = () => {
    if (!businesses.length) return null

    // Community engagement metrics based on business data
    const highEngagementBusinesses = businesses.filter(b => b?.rating >= 4.0).length
    const communityParticipation = businesses.length > 0 ? Math.round((highEngagementBusinesses / businesses.length) * 100) : 0
    
    const localBusinesses = businesses.filter(b => b?.businessType === 'Local').length
    const neighborhoodDiversity = analytics?.topNeighborhoods.length || 0
    
    const averageBusinessAge = businesses.length > 0 ? businesses.reduce((sum, b) => sum + (b?.businessAge || 0), 0) / businesses.length : 0
    const establishmentStability = Math.round(averageBusinessAge * 10) / 10

    return {
      communityParticipation,
      localBusinessRatio: businesses.length > 0 ? Math.round((localBusinesses / businesses.length) * 100) : 0,
      neighborhoodDiversity,
      establishmentStability,
      totalEngagement: highEngagementBusinesses,
      networkConnections: Math.round(businesses.length * 0.65), // Simulated network connections
      eventsThisMonth: Math.round(businesses.length * 0.12), // Simulated events
      socialSentiment: 78 // Simulated sentiment score
    }
  }

  const getNeighborhoodPulse = () => {
    return analytics?.topNeighborhoods.map(neighborhood => ({
      ...neighborhood,
      pulseScore: Math.round(((neighborhood.avgRating || 0) * 20) + Math.random() * 10),
      trendDirection: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      communityEvents: Math.floor(Math.random() * 8) + 2,
      businessGrowth: Math.random() > 0.4
    })) || []
  }

  const getCommunityHighlights = () => {
    const highlights = [
      {
        type: 'partnership',
        icon: Network,
        title: 'New Business Partnership Network',
        description: '15 local businesses formed collaborative partnerships this month',
        impact: 'High',
        neighborhood: 'South End'
      },
      {
        type: 'growth',
        icon: TrendingUp,
        title: 'Community Business Growth',
        description: '23% increase in new business registrations in NoDa area',
        impact: 'Very High',
        neighborhood: 'NoDa'
      },
      {
        type: 'engagement',
        icon: Heart,
        title: 'Community Engagement Surge',
        description: 'Local businesses report 40% increase in community event participation',
        impact: 'High',
        neighborhood: 'Plaza Midwood'
      },
      {
        type: 'innovation',
        icon: Zap,
        title: 'Innovation Hub Expansion',
        description: 'Tech startups and creative businesses cluster forming downtown',
        impact: 'High',
        neighborhood: 'Downtown'
      }
    ]

    return highlights
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
        </div>
      </div>
    )
  }

  const communityMetrics = getCommunityMetrics()
  const neighborhoodPulse = getNeighborhoodPulse()
  const communityHighlights = getCommunityHighlights()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Pulse</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights into Charlotte's business community dynamics and engagement
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Community Report
          </Button>
          <Button variant={isDarkMode ? 'glass' : 'default'}>
            Engagement Dashboard
          </Button>
        </div>
      </div>

      {/* Community Health Metrics */}
      {communityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Community Engagement</p>
                  <p className="text-2xl font-bold text-foreground">
                    {communityMetrics.communityParticipation}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-green-50'
                }`}>
                  <Heart className={`h-6 w-6 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+12% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Local Business Focus</p>
                  <p className="text-2xl font-bold text-foreground">
                    {communityMetrics.localBusinessRatio}%
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
                <span className="text-sm text-muted-foreground">Strong local presence</span>
              </div>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Network Connections</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(communityMetrics.networkConnections)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-purple-50'
                }`}>
                  <Network className={`h-6 w-6 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Activity className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">Growing network</span>
              </div>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Social Sentiment</p>
                  <p className="text-2xl font-bold text-foreground">
                    {communityMetrics.socialSentiment}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-midnight-800' : 'bg-orange-50'
                }`}>
                  <MessageCircle className={`h-6 w-6 ${
                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                  }`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm text-yellow-600">Very positive</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Community Highlights */}
      <Card variant={isDarkMode ? 'glass' : 'elevated'}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Community Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityHighlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      isDarkMode ? 'bg-midnight-800' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        highlight.impact === 'Very High' ? 'text-green-500' :
                        highlight.impact === 'High' ? 'text-blue-500' :
                        'text-orange-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{highlight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{highlight.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={
                          highlight.impact === 'Very High' ? 'default' :
                          highlight.impact === 'High' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {highlight.impact} Impact
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {highlight.neighborhood}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Neighborhood Pulse & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant={isDarkMode ? 'glass' : 'elevated'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Neighborhood Pulse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {neighborhoodPulse?.slice(0, 8).map((neighborhood, index) => {
                  const getTrendIcon = () => {
                    if (neighborhood.trendDirection === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
                    if (neighborhood.trendDirection === 'down') return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    return <Activity className="h-4 w-4 text-yellow-500" />
                  }

                  return (
                    <div key={neighborhood.neighborhood} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          neighborhood.pulseScore > 85 ? 'bg-green-500' :
                          neighborhood.pulseScore > 70 ? 'bg-blue-500' :
                          neighborhood.pulseScore > 55 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{neighborhood.neighborhood}</p>
                          <p className="text-xs text-muted-foreground">
                            {neighborhood.count} businesses • {neighborhood.communityEvents} events
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">Pulse Score: {neighborhood.pulseScore}</p>
                          <div className="flex items-center text-xs">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            <span>{neighborhood.avgRating?.toFixed(1) || '0.0'}</span>
                            {getTrendIcon()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant */}
        <div>
          <BusinessAIChat module="community-pulse" />
        </div>
      </div>

      {/* Community Events & Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant={isDarkMode ? 'glass' : 'elevated'}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Community Events Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 border rounded-lg">
                <p className="text-3xl font-bold text-primary">{communityMetrics?.eventsThisMonth || 0}</p>
                <p className="text-sm text-muted-foreground">Community Events This Month</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-xl font-bold">87%</p>
                  <p className="text-xs text-muted-foreground">Business Participation</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-xl font-bold">+24%</p>
                  <p className="text-xs text-muted-foreground">Community Engagement</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant={isDarkMode ? 'glass' : 'elevated'}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Business Community Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Establishment Stability</span>
                <span className="text-sm font-bold">{communityMetrics?.establishmentStability} years avg</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High-Rated Businesses</span>
                <span className="text-sm font-bold">{communityMetrics?.totalEngagement} (4.0+ rating)</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Neighborhood Diversity</span>
                <span className="text-sm font-bold">{communityMetrics?.neighborhoodDiversity} active areas</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Health Score</span>
                  <Badge variant="default" className="text-sm">
                    {Math.round(((communityMetrics?.socialSentiment || 0) + (communityMetrics?.communityParticipation || 0)) / 2)}% Excellent
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}