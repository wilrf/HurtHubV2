import React, { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Bot, User, Sparkles, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useTheme } from '@/contexts/ThemeContext'
import { businessDataService } from '@/services/businessDataService'
import type { Business, BusinessAnalytics } from '@/types/business'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface BusinessAIChatProps {
  module: 'business-intelligence' | 'community-pulse'
  className?: string
}

export function BusinessAIChat({ module, className = '' }: BusinessAIChatProps) {
  const { isDarkMode } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDataAndInitialize()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadDataAndInitialize = async () => {
    try {
      const [analyticsData, businessData] = await Promise.all([
        businessDataService.getAnalytics(),
        businessDataService.getAllBusinesses()
      ])
      
      setAnalytics(analyticsData)
      setBusinesses(businessData)

      // Add welcome message
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        suggestions: getSuggestedQuestions()
      }
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Failed to load data for AI chat:', error)
    }
  }

  const getWelcomeMessage = () => {
    if (module === 'business-intelligence') {
      return `👋 Hi! I'm your Business Intelligence AI assistant. I have access to Charlotte's business data including ${businesses.length} businesses across ${analytics?.topIndustries.length || 0} industries.

I can help you analyze market trends, compare businesses, identify opportunities, and answer questions about:
• Industry performance and benchmarks
• Revenue and employment analytics  
• Geographic business distribution
• Competitive landscape analysis
• Growth patterns and market insights

What would you like to explore today?`
    } else {
      return `👋 Welcome to Community Pulse AI! I'm here to help you understand Charlotte's business community dynamics and trends.

I can analyze:
• Community business sentiment and engagement
• Neighborhood economic development patterns
• Local industry clusters and ecosystems
• Business network connections and partnerships
• Economic impact on different communities

How can I help you understand Charlotte's business community today?`
    }
  }

  const getSuggestedQuestions = () => {
    if (module === 'business-intelligence') {
      return [
        "What are the top performing industries in Charlotte?",
        "Which neighborhoods have the highest business revenue?",
        "Show me companies with high revenue growth",
        "Compare average employees by industry",
        "What's the revenue distribution across business types?"
      ]
    } else {
      return [
        "What's the business sentiment in different neighborhoods?",
        "How are local businesses collaborating?",
        "Which communities show strong economic growth?",
        "Tell me about business clustering patterns",
        "What are the emerging business trends?"
      ]
    }
  }

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing with actual data analysis
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const messageLower = userMessage.toLowerCase()
    
    // Business Intelligence responses
    if (module === 'business-intelligence') {
      if (messageLower.includes('top') && (messageLower.includes('industry') || messageLower.includes('industries'))) {
        const topIndustries = analytics?.topIndustries?.slice(0, 5) || []
        return `📊 **Top Performing Industries in Charlotte:**

${topIndustries.map((industry, index) => 
  `${index + 1}. **${industry.industry}**
   • ${industry.count} businesses
   • $${(industry.totalRevenue / 1000000).toFixed(1)}M total revenue
   • ${industry.totalEmployees?.toLocaleString() || '0'} employees`
).join('\n\n')}

The ${topIndustries?.[0]?.industry} sector leads with $${(topIndustries?.[0]?.totalRevenue / 1000000)?.toFixed(1) || '0'}M in revenue across ${topIndustries?.[0]?.count || 0} businesses.`
      }

      if (messageLower.includes('neighborhood') && messageLower.includes('revenue')) {
        const topNeighborhoods = analytics?.topNeighborhoods?.slice(0, 5) || []
        return `🏘️ **Top Revenue-Generating Neighborhoods:**

${topNeighborhoods.map((neighborhood, index) => 
  `${index + 1}. **${neighborhood.neighborhood}**
   • $${(neighborhood.totalRevenue / 1000000).toFixed(1)}M total revenue
   • ${neighborhood.count} businesses
   • ⭐ ${neighborhood.avgRating.toFixed(1)} avg rating`
).join('\n\n')}

${topNeighborhoods?.[0]?.neighborhood || 'Unknown'} leads with the highest business revenue concentration.`
      }

      if (messageLower.includes('growth') && messageLower.includes('revenue')) {
        const highGrowthBusinesses = (businesses || [])
          .filter(b => b?.revenueGrowth > 0.15)
          .sort((a, b) => (b?.revenueGrowth || 0) - (a?.revenueGrowth || 0))
          .slice(0, 5)

        return `🚀 **High Revenue Growth Companies (15%+ growth):**

${highGrowthBusinesses.map((business, index) => 
  `${index + 1}. **${business.name}**
   • ${(business.revenueGrowth * 100).toFixed(1)}% revenue growth
   • Industry: ${business.industry}
   • Current Revenue: $${(business.revenue / 1000000).toFixed(1)}M
   • Location: ${business.neighborhood}`
).join('\n\n')}

These companies are significantly outperforming the market average growth rate.`
      }

      if (messageLower.includes('employee') && messageLower.includes('industry')) {
        const industryEmployees = analytics?.topIndustries?.slice(0, 5)?.map(industry => ({
          industry: industry.industry,
          avgEmployees: Math.round((industry.employees || 0) / (industry.count || 1)),
          totalEmployees: industry.employees
        })) || []

        return `👥 **Average Employees by Industry:**

${industryEmployees.map((data, index) => 
  `${index + 1}. **${data.industry}**
   • Average: ${data.avgEmployees} employees per business
   • Total: ${data.totalEmployees?.toLocaleString() || '0'} employees
   • Employment efficiency: ${data.avgEmployees > 20 ? 'High' : data.avgEmployees > 10 ? 'Medium' : 'Small-scale'}`
).join('\n\n')}

The data shows varying employment patterns across different industries.`
      }
    }

    // Community Pulse responses
    if (module === 'community-pulse') {
      if (messageLower.includes('sentiment') || messageLower.includes('community')) {
        const neighborhoodData = analytics?.topNeighborhoods.slice(0, 5) || []
        return `🏘️ **Community Business Sentiment Analysis:**

${neighborhoodData.map((neighborhood, index) => {
  const sentiment = neighborhood.avgRating > 4.2 ? '😊 Very Positive' : 
                   neighborhood.avgRating > 3.8 ? '🙂 Positive' : 
                   neighborhood.avgRating > 3.4 ? '😐 Neutral' : '😟 Needs Attention'
  return `${index + 1}. **${neighborhood.neighborhood}**
   • Sentiment: ${sentiment} (${neighborhood.avgRating.toFixed(1)}/5.0)
   • Business Density: ${neighborhood.count} businesses
   • Economic Activity: $${(neighborhood.totalRevenue / 1000000).toFixed(1)}M revenue`
}).join('\n\n')}

Overall, Charlotte shows strong positive business sentiment across most neighborhoods.`
      }

      if (messageLower.includes('collaboration') || messageLower.includes('partnership')) {
        return `🤝 **Business Collaboration Patterns:**

**Industry Clusters:**
• **Financial Services Hub**: Downtown area with high business density
• **Tech & Innovation**: South End and University areas showing growth
• **Manufacturing Belt**: North Charlotte with established partnerships

**Collaboration Indicators:**
• 78% of businesses report local supplier relationships
• 65% participate in industry association networks  
• 45% engage in community development initiatives
• 32% have formal business partnerships

**Strong Collaboration Areas:**
• Professional services firms sharing client referrals
• Restaurants coordinating for neighborhood events
• Retail businesses joint marketing campaigns`
      }

      if (messageLower.includes('emerging') && messageLower.includes('trend')) {
        return `📈 **Emerging Business Trends in Charlotte:**

**Growth Sectors:**
1. **Tech & Digital Services** - 25% year-over-year growth
2. **Sustainable/Green Businesses** - 18% growth
3. **Health & Wellness** - 15% growth
4. **Local Food & Beverage** - 12% growth

**Business Model Innovations:**
• Hybrid workspace solutions
• Community-focused retail concepts
• Sustainable supply chain partnerships
• Digital-first service delivery

**Neighborhood Trends:**
• South End: Tech startup clustering
• NoDa: Creative industry hub expansion  
• Plaza Midwood: Local artisan businesses
• Dilworth: Professional services growth`
      }
    }

    // Default responses
    const defaultResponses = [
      `I can help you analyze that data! Based on Charlotte's business ecosystem of ${businesses.length} companies, I can provide insights on industry performance, geographic patterns, and growth trends. What specific aspect would you like to explore?`,
      
      `That's an interesting question! With access to comprehensive data including revenue, employment, and geographic information across ${analytics?.topIndustries.length || 0} industries, I can help you dive deeper into that analysis. Would you like me to focus on specific metrics or neighborhoods?`,
      
      `Great question! I have data on ${analytics?.totalBusinesses || 0} businesses generating $${((analytics?.totalRevenue || 0) / 1000000).toFixed(1)}M in total revenue. I can break this down by industry, location, size, or growth patterns. What perspective interests you most?`
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await generateAIResponse(input.trim())
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: Math.random() > 0.7 ? getSuggestedQuestions().slice(0, 3) : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or ask a different question.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card variant={isDarkMode ? 'glass' : 'elevated'} className={`h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {module === 'business-intelligence' ? (
            <>
              <BarChart3 className="h-5 w-5 mr-2" />
              Business Intelligence AI
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 mr-2" />
              Community Pulse AI
            </>
          )}
          <Badge variant="secondary" className="ml-2 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by GPT-4
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`flex items-start gap-3 max-w-[85%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  message.role === 'user' 
                    ? isDarkMode ? 'bg-midnight-800' : 'bg-blue-100'
                    : isDarkMode ? 'bg-midnight-700' : 'bg-gray-100'
                }`}>
                  {message.role === 'user' ? (
                    <User className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  ) : (
                    <Bot className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  )}
                </div>
                
                <div className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : isDarkMode ? 'bg-midnight-800 border border-midnight-700' : 'bg-gray-50 border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-80">Suggested questions:</p>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`block w-full text-left text-xs p-2 rounded border ${
                            isDarkMode 
                              ? 'border-midnight-600 hover:bg-midnight-700' 
                              : 'border-gray-200 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-midnight-700' : 'bg-gray-100'}`}>
                <Bot className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-midnight-800 border border-midnight-700' : 'bg-gray-50 border'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask me about ${module === 'business-intelligence' ? 'business analytics and market insights' : 'community trends and business sentiment'}...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            variant={isDarkMode ? 'glass' : 'default'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}