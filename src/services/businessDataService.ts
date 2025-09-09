/**
 * Business Data Service - API-based business data management
 */

import { api } from "@/services/api";
import { aiBusinessService } from "@/core/services/AIBusinessService";
import type {
  Business,
  BusinessSearchFilters,
  BusinessSearchResult,
  BusinessAnalytics,
} from "@/types/business";

interface ApiResponse {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    industries: string[];
    locations: string[];
    neighborhoods: string[];
    businessTypes: string[];
    clusters: string[];
  };
  analytics: BusinessAnalytics;
  source: string;
}

class BusinessDataService {
  private cache = new Map<string, any>();
  private filterOptionsCache: any = null;
  private analyticsCache: BusinessAnalytics | null = null;
  private allBusinessesCache: Business[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // No longer loading static data
  }

  /**
   * Ensure data is available (for backward compatibility)
   */
  async ensureLoaded(): Promise<void> {
    // Check if cache is still valid
    if (
      this.cacheTimestamp &&
      Date.now() - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return;
    }

    // Refresh cache by fetching some data
    try {
      await this.getAllBusinesses();
    } catch (error) {
      console.error("❌ Failed to ensure data is loaded:", error);
      throw error;
    }
  }

  /**
   * Get all businesses from API
   */
  async getAllBusinesses(): Promise<Business[]> {
    const cacheKey = "allBusinesses";

    // Return cached data if available and fresh
    if (this.allBusinessesCache.length > 0 && this.isCacheValid()) {
      return this.allBusinessesCache;
    }

    try {
      const data: ApiResponse = await api.getWithParams("/businesses", {
        limit: 1000,
      });

      this.allBusinessesCache = data.businesses;
      this.filterOptionsCache = data.filters;
      this.analyticsCache = data.analytics;
      this.cacheTimestamp = Date.now();
      this.cache.set(cacheKey, data.businesses);

      console.log(
        `✅ Loaded ${data.businesses.length} businesses from database`,
      );
      return data.businesses;
    } catch (error) {
      console.error("❌ Failed to fetch all businesses:", error);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Search businesses with filters
   */
  async searchBusinesses(
    filters: BusinessSearchFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<BusinessSearchResult> {
    const cacheKey = `search_${JSON.stringify(filters)}_${page}_${limit}`;

    if (this.cache.has(cacheKey) && this.isCacheValid()) {
      return this.cache.get(cacheKey);
    }

    try {
      // Build query parameters object
      const queryParams: Record<string, string | number | boolean | undefined> =
        {
          page,
          limit,
        };

      // Add filters to query params
      if (filters.query) queryParams.query = filters.query;
      if (filters.revenueRange?.min !== undefined)
        queryParams.minRevenue = filters.revenueRange.min;
      if (filters.revenueRange?.max !== undefined)
        queryParams.maxRevenue = filters.revenueRange.max;
      if (filters.employeeRange?.min !== undefined)
        queryParams.minEmployees = filters.employeeRange.min;
      if (filters.employeeRange?.max !== undefined)
        queryParams.maxEmployees = filters.employeeRange.max;

      // Handle array parameters (industry, location, neighborhood)
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });

      if (filters.industry?.length) {
        filters.industry.forEach((ind) => searchParams.append("industry", ind));
      }
      if (filters.location?.length) {
        filters.location.forEach((loc) => searchParams.append("location", loc));
      }
      if (filters.neighborhood?.length) {
        filters.neighborhood.forEach((loc) =>
          searchParams.append("location", loc),
        );
      }

      const data: ApiResponse = await api.get(
        `/businesses?${searchParams.toString()}`,
      );

      const result: BusinessSearchResult = {
        businesses: data.businesses,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        hasNextPage: data.page < data.totalPages,
        hasPreviousPage: data.page > 1,
        filters: {
          query: filters.query,
          industry: filters.industry,
          location: filters.location,
          neighborhood: filters.neighborhood,
          revenueRange: filters.revenueRange,
          employeeRange: filters.employeeRange,
        },
        analytics: data.analytics,
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("❌ Failed to search businesses:", error);
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Search businesses using semantic search - simple and effective
   */
  async searchBusinessesSemantic(
    query: string,
    limit: number = 20,
  ): Promise<BusinessSearchResult> {
    const cacheKey = `semantic_search_${query}_${limit}`;

    if (this.cache.has(cacheKey) && this.isCacheValid()) {
      return this.cache.get(cacheKey);
    }

    // Just use the existing AIBusinessService - no complications
    const businesses = await aiBusinessService.performSemanticSearch(query, limit);
    const analytics = await this.getAnalytics();

    const result: BusinessSearchResult = {
      businesses,
      total: businesses.length,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      filters: { query },
      searchType: 'semantic',
      analytics,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get business analytics
   */
  async getAnalytics(): Promise<BusinessAnalytics> {
    if (this.analyticsCache && this.isCacheValid()) {
      return this.analyticsCache;
    }

    try {
      // Analytics are included in the businesses API response
      const data: ApiResponse = await api.getWithParams("/businesses", {
        limit: 1,
      });
      this.analyticsCache = data.analytics;
      return data.analytics;
    } catch (error) {
      console.error("❌ Failed to fetch analytics:", error);
      // Return default analytics on error
      return {
        totalBusinesses: 0,
        totalCompanies: 0,
        totalRevenue: 0,
        totalEmployees: 0,
        averageRevenue: 0,
        averageEmployees: 0,
        topIndustries: [],
        revenueByIndustry: [],
        topNeighborhoods: [],
        businessAgeDistribution: [],
        revenueDistribution: [],
        monthlyTrends: [],
      };
    }
  }

  /**
   * Get filter options for search UI
   */
  async getFilterOptions() {
    if (this.filterOptionsCache && this.isCacheValid()) {
      return this.filterOptionsCache;
    }

    try {
      const data: ApiResponse = await api.getWithParams("/businesses", {
        limit: 1,
      });
      this.filterOptionsCache = data.filters;
      return data.filters;
    } catch (error) {
      console.error("❌ Failed to fetch filter options:", error);
      return {
        industries: [],
        neighborhoods: [],
        businessTypes: [],
        clusters: [],
      };
    }
  }

  /**
   * Get a specific business by ID
   */
  async getBusinessById(id: string): Promise<Business | null> {
    try {
      // First try to find in cache
      const allBusinesses = await this.getAllBusinesses();
      const business = allBusinesses.find((b) => b.id === id);

      if (business) {
        return business;
      }

      // If not in cache, make specific API call
      const data: ApiResponse = await api.getWithParams("/businesses", {
        companyIds: id,
        limit: 1,
      });
      return data.businesses.length > 0 ? data.businesses[0] : null;
    } catch (error) {
      console.error(`❌ Failed to fetch business ${id}:`, error);
      return null;
    }
  }

  /**
   * Get businesses by industry
   */
  async getBusinessesByIndustry(industry: string): Promise<Business[]> {
    try {
      return this.searchBusinesses({ industry: [industry] }, 1, 100).then(
        (result) => result.businesses,
      );
    } catch (error) {
      console.error(
        `❌ Failed to fetch businesses for industry ${industry}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get recent businesses (by creation date)
   */
  async getRecentBusinesses(limit: number = 10): Promise<Business[]> {
    try {
      const data: ApiResponse = await api.getWithParams("/businesses", {
        limit,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      return data.businesses;
    } catch (error) {
      console.error("❌ Failed to fetch recent businesses:", error);
      return [];
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return (
      this.cacheTimestamp > 0 &&
      Date.now() - this.cacheTimestamp < this.CACHE_DURATION
    );
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.filterOptionsCache = null;
    this.analyticsCache = null;
    this.allBusinessesCache = [];
    this.cacheTimestamp = 0;
  }

  /**
   * Generate embeddings for all businesses (utility method)
   */
  async generateEmbeddings(batchSize: number = 20): Promise<void> {
    try {
      const result = await api.post("/generate-embeddings", { batchSize });
      console.log("✅ Embeddings generated:", result);
    } catch (error) {
      console.error("❌ Failed to generate embeddings:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const businessDataService = new BusinessDataService();
