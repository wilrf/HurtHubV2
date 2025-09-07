import type { Business } from '../domain/entities/Business';
import type { IBusinessRepository, BusinessFilters } from '../repositories/IBusinessRepository';

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
    
    return {
      totalBusinesses: businesses.length,
      totalRevenue,
      totalEmployees,
      averageRevenue: businesses.length > 0 ? totalRevenue / businesses.length : 0,
      averageEmployees: businesses.length > 0 ? totalEmployees / businesses.length : 0,
      topIndustries,
    };
  }
}

interface BusinessAnalytics {
  totalBusinesses: number;
  totalRevenue: number;
  totalEmployees: number;
  averageRevenue: number;
  averageEmployees: number;
  topIndustries: Array<{
    industry: string;
    count: number;
    totalRevenue: number;
    totalEmployees: number;
  }>;
}