import type { Business } from '../domain/entities/Business.js';
import type { IBusinessRepository, BusinessFilters } from '../repositories/IBusinessRepository.js';
import type { BusinessAnalytics } from '../../types/business.js';

export class BusinessService {
  constructor(private repository: IBusinessRepository) {}

  // Core business operations
  async getBusinessById(id: string): Promise<Business> {
    const business = await this.repository.findById(id);
    if (!business) {
      throw new Error(`Business not found: ${id}`);
    }
    return business;
  }

  async getAllBusinesses(limit?: number): Promise<Business[]> {
    return this.repository.findAll(limit);
  }

  async searchBusinesses(query: string, filters?: BusinessFilters): Promise<{
    businesses: Business[];
    totalCount: number;
    analytics: BusinessAnalytics;
  }> {
    // Business logic for search
    const businesses = await this.repository.search(query, filters);
    const totalCount = await this.repository.getTotalCount();
    
    // Calculate analytics
    const analytics = await this.calculateAnalytics(businesses);
    
    return {
      businesses,
      totalCount,
      analytics
    };
  }

  async getBusinessesByIndustry(industry: string): Promise<Business[]> {
    // Business rule: normalize industry name
    const normalizedIndustry = industry.trim().toLowerCase();
    return this.repository.findByIndustry(normalizedIndustry);
  }

  async getBusinessesByLocation(
    city?: string,
    state?: string,
    neighborhood?: string
  ): Promise<Business[]> {
    // Business rule: default to Charlotte, NC if not specified
    const actualCity = city || 'Charlotte';
    const actualState = state || 'NC';
    
    return this.repository.findByLocation(actualCity, actualState, neighborhood);
  }

  async getBusinessesBySize(sizeCategory: 'micro' | 'small' | 'medium' | 'large'): Promise<Business[]> {
    // Business logic: map size categories to employee ranges
    const ranges = {
      micro: { min: 1, max: 9 },
      small: { min: 10, max: 49 },
      medium: { min: 50, max: 249 },
      large: { min: 250, max: 99999 }
    };
    
    const range = ranges[sizeCategory];
    return this.repository.findByEmployeeRange(range.min, range.max);
  }

  async getTopPerformers(metric: 'revenue' | 'employees' | 'growth', limit: number = 10): Promise<Business[]> {
    // Business logic for identifying top performers
    const allBusinesses = await this.repository.findAll(1000);
    
    // Sort by metric
    const sorted = allBusinesses.sort((a, b) => {
      switch (metric) {
        case 'revenue':
          return (b.revenue || 0) - (a.revenue || 0);
        case 'employees':
          return (b.employeeCount || 0) - (a.employeeCount || 0);
        case 'growth':
          // Calculate year-over-year growth if data available
          // For now, use revenue as proxy
          return (b.revenue || 0) - (a.revenue || 0);
        default:
          return 0;
      }
    });
    
    return sorted.slice(0, limit);
  }

  async getBusinessRecommendations(businessId: string): Promise<Business[]> {
    // Business logic for recommendations
    const business = await this.getBusinessById(businessId);
    
    // Find similar businesses
    const sameIndustry = await this.repository.findByIndustry(business.industry || '');
    
    // Filter out the original business and return top 5
    return sameIndustry
      .filter(b => b.id !== businessId)
      .slice(0, 5);
  }

  private async calculateAnalytics(businesses: Business[]): Promise<BusinessAnalytics> {
    // Business logic for analytics calculation
    const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);
    const totalEmployees = businesses.reduce((sum, b) => sum + (b.employeeCount || 0), 0);
    
    // Group by industry
    const industryGroups = new Map<string, Business[]>();
    businesses.forEach(b => {
      const industry = b.industry || 'Unknown';
      if (!industryGroups.has(industry)) {
        industryGroups.set(industry, []);
      }
      industryGroups.get(industry)!.push(b);
    });
    
    const topIndustries = Array.from(industryGroups.entries())
      .map(([industry, businesses]) => ({
        industry,
        count: businesses.length,
        totalRevenue: businesses.reduce((sum, b) => sum + (b.revenue || 0), 0),
        totalEmployees: businesses.reduce((sum, b) => sum + (b.employeeCount || 0), 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Group by neighborhood with null-safe handling
    const neighborhoodGroups = new Map<string, Business[]>();
    businesses.forEach(b => {
      const neighborhood = b.neighborhood || 'Unknown';
      if (!neighborhoodGroups.has(neighborhood)) {
        neighborhoodGroups.set(neighborhood, []);
      }
      neighborhoodGroups.get(neighborhood)!.push(b);
    });

    // Calculate metrics for each neighborhood
    const topNeighborhoods = Array.from(neighborhoodGroups.entries())
      .map(([neighborhood, businesses]) => ({
        neighborhood,
        count: businesses.length,
        totalRevenue: businesses.reduce((sum, b) => sum + (b.revenue || 0), 0),
        avgRating: businesses.length > 0 
          ? businesses.reduce((sum, b) => sum + (b.customerMetrics?.rating || 0), 0) / businesses.length 
          : 0
      }))
      // Sort by count first (for stability), then revenue
      .sort((a, b) => b.count - a.count || b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
    
    // Calculate business age distribution
    const currentYear = new Date().getFullYear();
    // Define ranges with clear boundaries (lower-inclusive, upper-exclusive)
    const ageRanges = [
      { label: '0-2 years', min: 0, max: 3 },
      { label: '3-5 years', min: 3, max: 6 },
      { label: '6-10 years', min: 6, max: 11 },
      { label: '11-20 years', min: 11, max: 21 },
      { label: '20+ years', min: 21, max: Infinity },
      { label: 'Unknown', min: -1, max: 0 } // For missing data
    ];

    const businessAgeDistribution = ageRanges.map(range => {
      const count = businesses.filter(b => {
        if (!b.yearFounded && range.label === 'Unknown') return true;
        if (!b.yearFounded) return false;
        const age = currentYear - b.yearFounded;
        return age >= range.min && age < range.max;
      }).length;
      
      return { ageRange: range.label, count };
    });
    
    // Calculate revenue distribution
    // Revenue ranges (lower-inclusive, upper-exclusive in dollars)
    const revenueRanges = [
      { label: '<$100K', min: 0, max: 100000 },
      { label: '$100K-$500K', min: 100000, max: 500000 },
      { label: '$500K-$1M', min: 500000, max: 1000000 },
      { label: '$1M-$5M', min: 1000000, max: 5000000 },
      { label: '$5M+', min: 5000000, max: Infinity },
      { label: 'Unknown', min: -1, max: 0 } // For null/undefined revenue
    ];

    const revenueDistribution = revenueRanges.map(range => {
      const count = businesses.filter(b => {
        // Handle null/undefined revenue separately
        if (b.revenue === null || b.revenue === undefined) {
          return range.label === 'Unknown';
        }
        // Zero revenue goes to <$100K, not Unknown
        if (range.label === 'Unknown') return false;
        
        const revenue = b.revenue;
        return revenue >= range.min && revenue < range.max;
      }).length;
      
      return { range: range.label, count };
    });
    
    // Return complete analytics object with all required fields
    return {
      totalBusinesses: businesses.length,
      totalCompanies: businesses.length, // Same as totalBusinesses for compatibility
      totalRevenue: totalRevenue || 0,
      totalEmployees: totalEmployees || 0,
      averageRevenue: businesses.length > 0 ? totalRevenue / businesses.length : 0,
      averageEmployees: businesses.length > 0 ? totalEmployees / businesses.length : 0,
      topIndustries: topIndustries || [],
      revenueByIndustry: [], // Can be implemented later if needed
      topNeighborhoods: topNeighborhoods || [],
      businessAgeDistribution: businessAgeDistribution || [],
      revenueDistribution: revenueDistribution || [],
      monthlyTrends: [] // Can be implemented later if needed
    };
  }
}