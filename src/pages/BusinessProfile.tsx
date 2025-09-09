import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Wifi,
  Car,
  Accessibility,
  Utensils,
  Truck,
  Download,
  Share2,
  Edit,
  BarChart3,
  Target,
  Award,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { businessDataService } from "@/services/businessDataService";

import type { Business } from "@/types/business";
// Dark mode only - no theme switching

export function BusinessProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Dark mode only
  const isDarkMode = true;
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "financial" | "operations" | "reviews"
  >("overview");

  useEffect(() => {
    if (id) {
      loadBusinessData(id);
    }
  }, [id]);

  const loadBusinessData = async (businessId: string) => {
    setIsLoading(true);
    try {
      const businessData =
        await businessDataService.getBusinessById(businessId);
      setBusiness(businessData);
    } catch (error) {
      console.error("Failed to load business data:", error);
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
    if (num == null || isNaN(num)) return "N/A";
    return num.toLocaleString();
  };

  const formatPercentage = (num: number | undefined) => {
    if (num === undefined || num === null) return "N/A";
    return `${(num * 100).toFixed(1)}%`;
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "parking":
        return <Car className="h-4 w-4" />;
      case "wheelchairAccessible":
        return <Accessibility className="h-4 w-4" />;
      case "outdoorSeating":
        return <Utensils className="h-4 w-4" />;
      case "delivery":
        return <Truck className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-60 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <Building2 className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The business you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => navigate("/")}
            variant={isDarkMode ? "glass" : "default"}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {business.name}
            </h1>
            <p className="text-muted-foreground flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {business.neighborhood || business.address?.city || "Unknown"}, {business.address?.city || "Unknown"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant={isDarkMode ? "glass" : "default"}>
            <Edit className="h-4 w-4 mr-2" />
            Contact Business
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "financial", label: "Financial" },
          { id: "operations", label: "Operations" },
          { id: "reviews", label: "Reviews" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={
              selectedTab === tab.id
                ? isDarkMode
                  ? "glass"
                  : "default"
                : "ghost"
            }
            onClick={() => setSelectedTab(tab.id as any)}
            className="rounded-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTab === "overview" && (
            <>
              {/* Basic Info */}
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Business Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-sapphire-400" />
                      <p className="text-2xl font-bold">
                        {formatCurrency(business.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Annual Revenue
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-sapphire-500" />
                      <p className="text-2xl font-bold">
                        {formatNumber(business.employeeCount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Employees</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-sapphire-500" />
                      <p className="text-2xl font-bold">
                        {business.yearFounded ? new Date().getFullYear() - business.yearFounded : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">Years Old</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Star className="h-6 w-6 mx-auto mb-2 text-sapphire-300" />
                      <p className="text-2xl font-bold">
                        {business.rating?.toFixed(1) || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">Business Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Industry
                        </p>
                        <p className="text-sm">{business.industry}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Business Type
                        </p>
                        <p className="text-sm">{business.businessType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          NAICS Code
                        </p>
                        <p className="text-sm">{business.naics}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Owner
                        </p>
                        <p className="text-sm">{business.owner}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Cluster
                        </p>
                        <p className="text-sm">{business.cluster}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Square Feet
                        </p>
                        <p className="text-sm">
                          {formatNumber(business.squareFeet)} sq ft
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Features & Amenities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {business.features &&
                      Object.entries(business.features)
                        .filter(([_, value]) => value)
                        .map(([feature, _]) => (
                          <div
                            key={feature}
                            className="flex items-center p-3 border rounded-lg"
                          >
                            {getFeatureIcon(feature)}
                            <span className="ml-2 text-sm capitalize">
                              {feature
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </span>
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedTab === "financial" && (
            <>
              {/* Financial Metrics */}
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Financial Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatCurrency(business.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Annual Revenue
                      </p>
                      <div className="flex items-center justify-center mt-2">
                        <TrendingUp className="h-4 w-4 text-sapphire-400 mr-1" />
                        <span className="text-xs text-sapphire-400">
                          +{formatPercentage(business.revenueGrowth)}
                        </span>
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatPercentage(business.grossMargin)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gross Margin
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatPercentage(business.netMargin)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Net Margin
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Revenue per Employee</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-lg font-semibold">
                        {formatCurrency(business.revenuePerEmployee)}
                      </span>
                      <Badge variant="secondary">
                        Industry Average:{" "}
                        {formatCurrency((business.revenuePerEmployee || 0) * 0.85)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Operating Costs Breakdown
                    </h4>
                    <div className="space-y-3">
                      {business.operatingCosts &&
                        Object.entries(business.operatingCosts).map(
                          ([category, amount]) => (
                            <div
                              key={category}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm font-medium capitalize">
                                {category}
                              </span>
                              <div className="flex items-center">
                                <div
                                  className={`w-32 h-2 rounded-full mr-3 ${
                                    isDarkMode
                                      ? "bg-midnight-800"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <div
                                    className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                    style={{
                                      width: `${(amount / Math.max(...(Object.values(business.operatingCosts || {}) || [1]))) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-semibold min-w-[80px] text-right">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Monthly Revenue Trend
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                      {business.monthlyRevenue?.map((revenue, index) => (
                        <div
                          key={index}
                          className="text-center p-2 border rounded"
                        >
                          <p className="text-xs text-muted-foreground">
                            {monthNames[index]}
                          </p>
                          <p className="text-xs font-semibold">
                            {formatCurrency(revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedTab === "operations" && (
            <>
              {/* Operating Hours */}
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {business.hours &&
                      Object.entries(business.hours).map(([day, hours]) => (
                        <div
                          key={day}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="font-medium capitalize">{day}</span>
                          {hours === "Closed" ? (
                            <Badge variant="secondary">Closed</Badge>
                          ) : (
                            <span className="text-sm">
                              {hours.open} - {hours.close}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location & Space
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Full Address
                    </p>
                    <p className="text-sm">
                      {business.address?.line1 || "Address not available"}
                      <br />
                      {business.address?.line2 && `${business.address.line2}\n`}
                      {business.address?.city}, {business.address?.state}{" "}
                      {business.address?.zipCode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Square Footage
                      </p>
                      <p className="text-sm">
                        {formatNumber(business.squareFeet)} sq ft
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Rent per Sq Ft
                      </p>
                      <p className="text-sm">${business.rentPerSqFt}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Annual Rent
                      </p>
                      <p className="text-sm">
                        {formatCurrency(business.annualRent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Neighborhood
                      </p>
                      <p className="text-sm">{business.neighborhood}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedTab === "reviews" && (
            <>
              {/* Reviews Overview */}
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Customer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {business.rating?.toFixed(1) || "N/A"}
                      </p>
                      <div className="flex items-center justify-center my-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(business.rating || 0)
                                ? "text-sapphire-300 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {business.reviewCount} reviews
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {business.reviews?.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="flex items-center mr-3">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(review.rating)
                                      ? "text-sapphire-300 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {review.author}
                            </span>
                            {review.verified && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.text}
                        </p>
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-8">
                        No reviews available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                <span className="text-sm">{business.phone}</span>
              </div>
              {business.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm">{business.email}</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-3 text-muted-foreground" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card variant={isDarkMode ? "glass" : "elevated"}>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Employee Category
                </span>
                <span className="text-sm font-medium">
                  {business.employeeSizeCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Founded</span>
                <span className="text-sm font-medium">
                  {business.yearFounded}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Business Age
                </span>
                <span className="text-sm font-medium">
                  {business.businessAge} years
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Revenue Growth
                </span>
                <span className="text-sm font-medium text-sapphire-400">
                  +{formatPercentage(business.revenueGrowth)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Industry Metrics */}
          {business.industryMetrics &&
            Object.keys(business.industryMetrics || {}).length > 0 && (
              <Card variant={isDarkMode ? "glass" : "elevated"}>
                <CardHeader>
                  <CardTitle>Industry Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(business.industryMetrics || {}).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
export default BusinessProfile;
