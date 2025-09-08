import {
  BarChart3,
  TrendingUp,
  Target,
  PieChart,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  Award,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";

import { BusinessAIChat } from "@/components/ai/BusinessAIChat";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { businessDataService } from "@/services/businessDataService";
import { useBusinessAIChat } from "@/hooks/useBusinessAIChat";

import type { BusinessAnalytics, Business } from "@/types/business";
// Dark mode only - no theme switching

export function BusinessIntelligence() {
  // Dark mode only
  const isDarkMode = true;
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<
    "revenue" | "employees" | "growth" | "age"
  >("revenue");
  const [isWelcomeState, setIsWelcomeState] = useState(true);
  
  // Get messages from the chat hook - starts with no messages
  const { messages, setInput, handleSendMessage: originalHandleSendMessage } = useBusinessAIChat("business-intelligence");

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Watch for when messages appear to exit welcome state
  useEffect(() => {
    if (messages.length > 0) {
      setIsWelcomeState(false);
    }
  }, [messages]);

  // Wrapper to handle send message and exit welcome state
  const handleSendMessage = () => {
    setIsWelcomeState(false);
    originalHandleSendMessage();
  };

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, businessData] = await Promise.all([
        businessDataService.getAnalytics(),
        businessDataService.getAllBusinesses(),
      ]);

      setAnalytics(analyticsData);
      setBusinesses(businessData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null || isNaN(amount)) return "$0";
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num == null || isNaN(num)) return "0";
    return num.toLocaleString();
  };

  const handlePromptSelect = async (prompt: string) => {
    setInput(prompt);
    setIsWelcomeState(false);
    // Small delay to ensure state updates before sending
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleNewChat = () => {
    // Clear messages by reloading the page or resetting state
    window.location.reload();
  };

  const getPerformanceIndicator = (current: number, benchmark: number) => {
    const diff = ((current - benchmark) / benchmark) * 100;
    if (diff > 5)
      return {
        icon: ArrowUpRight,
        color: "text-sapphire-400",
        text: `+${diff.toFixed(1)}%`,
      };
    if (diff < -5)
      return {
        icon: ArrowDownRight,
        color: "text-gray-500",
        text: `${diff.toFixed(1)}%`,
      };
    return { icon: Minus, color: "text-gray-400", text: `${diff.toFixed(1)}%` };
  };

  const getTopPerformers = (
    metric: "revenue" | "employees" | "revenueGrowth" | "grossMargin",
  ) => {
    return businesses.sort((a, b) => (b[metric] || 0) - (a[metric] || 0)).slice(0, 10);
  };

  const getIndustryInsights = () => {
    const industryMap = new Map();
    businesses.forEach((business) => {
      const industry = business.industry;
      if (!industryMap.has(industry)) {
        industryMap.set(industry, {
          count: 0,
          totalRevenue: 0,
          totalEmployees: 0,
          avgRating: 0,
          totalRatings: 0,
          avgAge: 0,
          growthRates: [],
        });
      }

      const data = industryMap.get(industry);
      data.count++;
      data.totalRevenue += business.revenue;
      data.totalEmployees += business.employeeCount;
      if (business.rating) {
        data.totalRatings += business.rating;
      }
      data.avgAge += business.businessAge;
      data.growthRates.push(business.revenueGrowth);
    });

    return Array.from(industryMap.entries())
      .map(([industry, data]) => ({
        industry,
        count: data.count,
        avgRevenue: data.totalRevenue / data.count,
        avgEmployees: data.totalEmployees / data.count,
        avgRating: data.totalRatings / data.count,
        avgAge: data.avgAge / data.count,
        avgGrowth:
          data.growthRates.reduce(
            (sum: number, rate: number) => sum + rate,
            0,
          ) / data.growthRates.length,
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue);
  };

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
    );
  }

  const industryInsights = getIndustryInsights();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Activity className="h-7 w-7 text-sapphire-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              AI Business Intelligence Assistant
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ask questions about market trends, company performance, or get strategic insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNewChat}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button variant={isDarkMode ? "glass" : "default"}>
            Schedule Updates
          </Button>
        </div>
      </div>

      {/* Main Chat Section */}
      <div className="space-y-6">
        {/* Welcome State */}
        {isWelcomeState ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8">
            <div className="text-center max-w-2xl">
              <h2 className="text-3xl font-semibold text-foreground mb-3">
                Welcome to Business Intelligence
              </h2>
              <p className="text-lg text-muted-foreground">
                I can help you analyze market trends, compare businesses, identify opportunities,
                and answer strategic questions about Charlotte's business landscape.
              </p>
            </div>
            
            {/* Chat Input - Centered */}
            <div className="w-full max-w-2xl">
              <BusinessAIChat
                module="business-intelligence"
                className="min-h-0"
                isWelcomeState={true}
                onFirstMessage={() => setIsWelcomeState(false)}
              />
            </div>
            
            {/* Suggested Prompts */}
            <div className="w-full max-w-2xl">
              <SuggestedPrompts onPromptSelect={handlePromptSelect} />
            </div>
          </div>
        ) : (
          /* Active Chat State */
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardContent className="p-0">
              <BusinessAIChat
                module="business-intelligence"
                className="min-h-[600px]"
                isWelcomeState={false}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Performance Indicators */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Market Size</p>
                <DollarSign className="h-5 w-5 text-sapphire-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <p className="text-sm text-sapphire-400 mt-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12.3% YoY growth
              </p>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Employment Impact
                </p>
                <Users className="h-5 w-5 text-sapphire-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(analytics.totalEmployees)}
              </p>
              <p className="text-sm text-sapphire-400 mt-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +8.7% job growth
              </p>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Market Diversity
                </p>
                <Target className="h-5 w-5 text-sapphire-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.topIndustries.length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Active industries
              </p>
            </CardContent>
          </Card>

          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Avg Revenue/Business
                </p>
                <BarChart3 className="h-5 w-5 text-sapphire-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(analytics.averageRevenue)}
              </p>
              <p className="text-sm text-sapphire-400 mt-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Above national avg
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card variant={isDarkMode ? "glass" : "elevated"}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Top Performers
              </div>
              <div className="flex gap-2">
                {[
                  { key: "revenue", label: "Revenue" },
                  { key: "employees", label: "Jobs" },
                  { key: "revenueGrowth", label: "Growth" },
                  { key: "grossMargin", label: "Margin" },
                ].map((metric) => (
                  <Button
                    key={metric.key}
                    variant={
                      selectedMetric === metric.key ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => setSelectedMetric(metric.key as any)}
                    className="text-xs"
                  >
                    {metric.label}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTopPerformers(
                selectedMetric === "revenue"
                  ? "revenue"
                  : selectedMetric === "employees"
                    ? "employees"
                    : selectedMetric === "growth"
                      ? "revenueGrowth"
                      : "grossMargin",
              )
                .slice(0, 8)
                .map((business, index) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0
                            ? "bg-sapphire-400 text-white"
                            : index === 1
                              ? "bg-gray-400 text-gray-900"
                              : index === 2
                                ? "bg-sapphire-600 text-white"
                                : isDarkMode
                                  ? "bg-sapphire-900/20 text-midnight-400"
                                  : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{business.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {business.industry}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {selectedMetric === "revenue"
                          ? formatCurrency(business.revenue)
                          : selectedMetric === "employees"
                            ? formatNumber(business.employeeCount)
                            : selectedMetric === "growth"
                              ? `${((business.revenueGrowth || 0) * 100).toFixed(1)}%`
                              : `${((business.grossMargin || 0) * 100).toFixed(1)}%`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {business.neighborhood}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Analysis */}
        <Card variant={isDarkMode ? "glass" : "elevated"}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Industry Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {industryInsights.slice(0, 8).map((industry) => (
                <div
                  key={industry.industry}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{industry.industry}</p>
                    <p className="text-xs text-muted-foreground">
                      {industry.count} businesses •{" "}
                      {formatNumber(Math.round(industry.avgEmployees))} avg
                      employees
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(industry.avgRevenue)}
                    </p>
                    <div className="flex items-center text-xs">
                      {(() => {
                        const indicator = getPerformanceIndicator(
                          industry.avgGrowth,
                          0.05,
                        );
                        const Icon = indicator.icon;
                        return (
                          <>
                            <Icon
                              className={`h-3 w-3 mr-1 ${indicator.color}`}
                            />
                            <span className={indicator.color}>
                              {indicator.text}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trends */}
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Monthly Revenue Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.monthlyTrends?.slice(0, 6).map((trend, _index) => (
                  <div
                    key={trend.month}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{trend.month}</span>
                    <div className="flex items-center">
                      <div
                        className={`w-16 h-2 rounded-full mr-3 ${
                          isDarkMode ? "bg-sapphire-900/20" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          style={{
                            width: `${(trend.totalRevenue / Math.max(...(analytics.monthlyTrends?.map((t) => t.totalRevenue) || [1]))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatCurrency(trend.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Geographic Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topNeighborhoods?.slice(0, 6).map((neighborhood) => (
                  <div
                    key={neighborhood.neighborhood}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {neighborhood.neighborhood}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {neighborhood.count} businesses
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(neighborhood.totalRevenue)}
                      </p>
                      <div className="flex items-center text-xs">
                        <span className="text-sapphire-300 mr-1">⭐</span>
                        <span>
                          {neighborhood.avgRating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Maturity */}
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Business Maturity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.businessAgeDistribution?.map((age) => (
                  <div
                    key={age.ageRange}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{age.ageRange}</span>
                    <div className="flex items-center">
                      <div
                        className={`w-16 h-2 rounded-full mr-3 ${
                          isDarkMode ? "bg-sapphire-900/20" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className="h-2 bg-gradient-to-r from-sapphire-400 to-sapphire-600 rounded-full"
                          style={{
                            width: `${(age.count / Math.max(...(analytics.businessAgeDistribution?.map((a) => a.count) || [1]))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground min-w-[30px] text-right">
                        {age.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitive Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Competitive Landscape Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <h4 className="font-semibold mb-2">Market Leaders</h4>
                  <p className="text-2xl font-bold text-sapphire-500">
                    {businesses.filter((b) => (b.revenue || 0) > 5000000).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Companies with $5M+ revenue
                  </p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <h4 className="font-semibold mb-2">Growth Champions</h4>
                  <p className="text-2xl font-bold text-sapphire-400">
                    {businesses.filter((b) => (b.revenueGrowth || 0) > 0.2).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    20%+ revenue growth
                  </p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <h4 className="font-semibold mb-2">High Efficiency</h4>
                  <p className="text-2xl font-bold text-sapphire-500">
                    {
                      businesses.filter((b) => (b.revenuePerEmployee || 0) > 100000)
                        .length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    $100K+ revenue per employee
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default BusinessIntelligence;
