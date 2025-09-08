/**
 * Application Service for orchestrating business preview data
 * Following Clean Architecture - orchestrates domain services and repositories
 */

import type { Business } from "@/types/business";

export interface BusinessPreview {
  id: string;
  name: string;
  industry: string;
  revenue: number;
  employeeCount: number;
  neighborhood: string;
  revenueGrowth?: number;
  rating?: number;
  isVerified: boolean;
}

export interface IBusinessRepository {
  findByName(name: string): Promise<Business | null>;
  findAll(): Promise<Business[]>;
}

export class BusinessPreviewService {
  // Cache for performance - cleared after 5 minutes
  private previewCache: Map<string, { data: BusinessPreview; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private businessRepository: IBusinessRepository
  ) {}

  /**
   * Get preview data for a business by name
   * Orchestrates data fetching and caching
   */
  async getPreviewByName(businessName: string): Promise<BusinessPreview | null> {
    // Clean the business name (remove any trailing spaces or special chars)
    const cleanName = this.cleanBusinessName(businessName);

    // Check cache first
    const cached = this.getCachedPreview(cleanName);
    if (cached) {
      return cached;
    }

    // Fetch from repository
    const business = await this.findBusinessByName(cleanName);
    if (!business) {
      return null;
    }

    // Create preview object with default values for optional fields
    const preview: BusinessPreview = {
      id: business.id || "",
      name: business.name || "Unknown Business",
      industry: business.industry || "Unknown",
      revenue: business.revenue || 0,
      employeeCount: business.employeeCount || 0,
      neighborhood: business.neighborhood || "Unknown",
      revenueGrowth: business.revenueGrowth,
      rating: business.rating,
      isVerified: true, // From our database means verified
    };

    // Cache the result
    this.cachePreview(cleanName, preview);

    return preview;
  }

  /**
   * Get multiple previews at once (for performance)
   */
  async getMultiplePreviews(businessNames: string[]): Promise<Map<string, BusinessPreview>> {
    const previews = new Map<string, BusinessPreview>();

    // Get all businesses in one call for efficiency
    const allBusinesses = await this.businessRepository.findAll();
    const businessMap = new Map(
      allBusinesses.map(b => [this.normalizeForComparison(b.name), b])
    );

    for (const name of businessNames) {
      const cleanName = this.cleanBusinessName(name);
      const normalizedName = this.normalizeForComparison(cleanName);
      const business = businessMap.get(normalizedName);

      if (business) {
        const preview: BusinessPreview = {
          id: business.id || "",
          name: business.name || "Unknown Business",
          industry: business.industry || "Unknown",
          revenue: business.revenue || 0,
          employeeCount: business.employeeCount || 0,
          neighborhood: business.neighborhood || "Unknown",
          revenueGrowth: business.revenueGrowth,
          rating: business.rating,
          isVerified: true,
        };
        previews.set(cleanName, preview);
        this.cachePreview(cleanName, preview);
      }
    }

    return previews;
  }

  /**
   * Clear cache (useful for testing or when data updates)
   */
  clearCache(): void {
    this.previewCache.clear();
  }

  /**
   * Find business by name with fuzzy matching
   */
  private async findBusinessByName(name: string): Promise<Business | null> {
    const allBusinesses = await this.businessRepository.findAll();
    const normalizedSearchName = this.normalizeForComparison(name);

    // Try exact match first
    const exactMatch = allBusinesses.find(
      b => this.normalizeForComparison(b.name) === normalizedSearchName
    );
    if (exactMatch) return exactMatch;

    // Try partial match (business name starts with search term)
    const partialMatch = allBusinesses.find(
      b => this.normalizeForComparison(b.name).startsWith(normalizedSearchName)
    );
    if (partialMatch) return partialMatch;

    // Try contains match as last resort
    const containsMatch = allBusinesses.find(
      b => this.normalizeForComparison(b.name).includes(normalizedSearchName)
    );
    return containsMatch || null;
  }

  /**
   * Clean business name for searching
   */
  private cleanBusinessName(name: string): string {
    return name
      .replace(/\(from our database\)/gi, "")
      .replace(/\*\*/g, "") // Remove markdown bold
      .replace(/__/g, "")   // Remove markdown bold alt
      .replace(/[*_]/g, "") // Remove markdown italic
      .trim();
  }

  /**
   * Normalize name for comparison (case-insensitive, remove special chars)
   */
  private normalizeForComparison(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ")         // Normalize whitespace
      .trim();
  }

  /**
   * Get cached preview if still valid
   */
  private getCachedPreview(name: string): BusinessPreview | null {
    const cached = this.previewCache.get(name.toLowerCase());
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.previewCache.delete(name.toLowerCase());
      return null;
    }

    return cached.data;
  }

  /**
   * Cache a preview
   */
  private cachePreview(name: string, preview: BusinessPreview): void {
    this.previewCache.set(name.toLowerCase(), {
      data: preview,
      timestamp: Date.now(),
    });

    // Clean up old entries if cache gets too large
    if (this.previewCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of this.previewCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.previewCache.delete(key);
        }
      }
    }
  }
}