import { describe, it, expect, beforeEach } from 'vitest';
import { BusinessService } from './BusinessService';
import type { Business } from '../domain/entities/Business';
import type { IBusinessRepository } from '../repositories/IBusinessRepository';

// Mock repository for testing
class MockBusinessRepository implements IBusinessRepository {
  private businesses: Business[] = [];

  setBusinesses(businesses: Business[]) {
    this.businesses = businesses;
  }

  async findById(id: string): Promise<Business | null> {
    return this.businesses.find(b => b.id === id) || null;
  }

  async findAll(limit?: number): Promise<Business[]> {
    return limit ? this.businesses.slice(0, limit) : this.businesses;
  }

  async search(query: string, filters?: any): Promise<Business[]> {
    return this.businesses;
  }

  async findByIndustry(industry: string): Promise<Business[]> {
    return this.businesses.filter(b => b.industry?.toLowerCase() === industry.toLowerCase());
  }

  async findByLocation(city: string, state: string, neighborhood?: string): Promise<Business[]> {
    return this.businesses.filter(b => 
      b.city === city && 
      b.state === state && 
      (!neighborhood || b.neighborhood === neighborhood)
    );
  }

  async findByEmployeeRange(min: number, max: number): Promise<Business[]> {
    return this.businesses.filter(b => 
      b.employeeCount !== null && 
      b.employeeCount >= min && 
      b.employeeCount <= max
    );
  }

  async findByRevenueRange(min: number, max: number): Promise<Business[]> {
    return this.businesses.filter(b => 
      b.revenue !== null && 
      b.revenue >= min && 
      b.revenue <= max
    );
  }

  async searchSemantic(embedding: number[], limit?: number): Promise<Business[]> {
    // Mock semantic search - just return first N businesses for testing
    return this.businesses.slice(0, limit || 10);
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    // Mock implementation - does nothing in tests
  }

  async getIndustryStats(): Promise<Array<{ industry: string; count: number; totalRevenue: number; totalEmployees: number; averageRevenue: number }>> {
    // Mock implementation
    return [];
  }

  async getLocationStats(): Promise<Array<{ location: string; count: number; totalRevenue: number; averageRating: number }>> {
    // Mock implementation
    return [];
  }

  async getTotalCount(): Promise<number> {
    return this.businesses.length;
  }

  async save(business: Business): Promise<void> {
    const index = this.businesses.findIndex(b => b.id === business.id);
    if (index >= 0) {
      this.businesses[index] = business;
    } else {
      this.businesses.push(business);
    }
  }

  async delete(id: string): Promise<void> {
    this.businesses = this.businesses.filter(b => b.id !== id);
  }
}

// Helper to create test businesses
function createTestBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 'test-id',
    name: 'Test Business',
    industry: 'Technology',
    employeeCount: 50,
    yearFounded: 2020,
    revenue: 1000000,
    city: 'Charlotte',
    state: 'NC',
    neighborhood: 'Uptown',
    operatingHours: null,
    customerMetrics: {
      averageSpend: null,
      monthlyCustomers: null,
      rating: 4.5,
      reviewCount: 100
    },
    financialMetrics: null,
    isOpenOn: () => false,
    getAgeInYears: () => new Date().getFullYear() - 2020,
    getEmployeeSizeCategory: () => 'Medium',
    getGrossMargin: () => null,
    getNetMargin: () => null,
    getRevenueGrowth: () => null,
    toJSON: () => ({}),
    ...overrides
  } as Business;
}

describe('BusinessService Analytics', () => {
  let service: BusinessService;
  let repository: MockBusinessRepository;

  beforeEach(() => {
    repository = new MockBusinessRepository();
    service = new BusinessService(repository);
  });

  describe('calculateAnalytics', () => {
    it('should return complete analytics object with empty data', async () => {
      repository.setBusinesses([]);
      const result = await service.searchBusinesses('', {});
      
      expect(result.analytics).toBeDefined();
      expect(result.analytics.totalBusinesses).toBe(0);
      expect(result.analytics.totalRevenue).toBe(0);
      expect(result.analytics.totalEmployees).toBe(0);
      expect(result.analytics.topNeighborhoods).toEqual([]);
      expect(result.analytics.businessAgeDistribution).toBeDefined();
      expect(result.analytics.revenueDistribution).toBeDefined();
    });

    describe('topNeighborhoods', () => {
      it('should calculate neighborhood metrics correctly', async () => {
        const businesses = [
          createTestBusiness({ id: '1', neighborhood: 'Uptown', revenue: 2000000, customerMetrics: { rating: 4.5, averageSpend: null, monthlyCustomers: null, reviewCount: 10 } }),
          createTestBusiness({ id: '2', neighborhood: 'Uptown', revenue: 1500000, customerMetrics: { rating: 4.0, averageSpend: null, monthlyCustomers: null, reviewCount: 20 } }),
          createTestBusiness({ id: '3', neighborhood: 'SouthEnd', revenue: 3000000, customerMetrics: { rating: 5.0, averageSpend: null, monthlyCustomers: null, reviewCount: 30 } }),
          createTestBusiness({ id: '4', neighborhood: null, revenue: 500000, customerMetrics: null }),
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        const neighborhoods = result.analytics.topNeighborhoods;
        
        expect(neighborhoods).toHaveLength(3);
        expect(neighborhoods[0].neighborhood).toBe('Uptown');
        expect(neighborhoods[0].count).toBe(2);
        expect(neighborhoods[0].totalRevenue).toBe(3500000);
        expect(neighborhoods[0].avgRating).toBeCloseTo(4.25, 2);
        
        expect(neighborhoods[1].neighborhood).toBe('SouthEnd');
        expect(neighborhoods[1].count).toBe(1);
        expect(neighborhoods[1].totalRevenue).toBe(3000000);
        
        expect(neighborhoods[2].neighborhood).toBe('Unknown');
        expect(neighborhoods[2].count).toBe(1);
      });

      it('should sort by count first, then revenue', async () => {
        const businesses = [
          createTestBusiness({ id: '1', neighborhood: 'A', revenue: 5000000 }),
          createTestBusiness({ id: '2', neighborhood: 'B', revenue: 1000000 }),
          createTestBusiness({ id: '3', neighborhood: 'B', revenue: 2000000 }),
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        const neighborhoods = result.analytics.topNeighborhoods;
        
        expect(neighborhoods[0].neighborhood).toBe('B'); // 2 businesses beats higher revenue
        expect(neighborhoods[0].count).toBe(2);
        expect(neighborhoods[1].neighborhood).toBe('A');
        expect(neighborhoods[1].count).toBe(1);
      });
    });

    describe('businessAgeDistribution', () => {
      it('should categorize businesses by age correctly', async () => {
        const currentYear = new Date().getFullYear();
        const businesses = [
          createTestBusiness({ id: '1', yearFounded: currentYear - 1 }),      // 1 year = 0-2 range
          createTestBusiness({ id: '2', yearFounded: currentYear - 4 }),      // 4 years = 3-5 range
          createTestBusiness({ id: '3', yearFounded: currentYear - 8 }),      // 8 years = 6-10 range
          createTestBusiness({ id: '4', yearFounded: currentYear - 15 }),     // 15 years = 11-20 range
          createTestBusiness({ id: '5', yearFounded: currentYear - 25 }),     // 25 years = 20+ range
          createTestBusiness({ id: '6', yearFounded: null }),                 // Unknown
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        const ageDistribution = result.analytics.businessAgeDistribution;
        
        expect(ageDistribution).toHaveLength(6);
        
        const dist = Object.fromEntries(ageDistribution.map(d => [d.ageRange, d.count]));
        expect(dist['0-2 years']).toBe(1);
        expect(dist['3-5 years']).toBe(1);
        expect(dist['6-10 years']).toBe(1);
        expect(dist['11-20 years']).toBe(1);
        expect(dist['20+ years']).toBe(1);
        expect(dist['Unknown']).toBe(1);
      });

      it('should handle boundary values correctly', async () => {
        const currentYear = new Date().getFullYear();
        const businesses = [
          createTestBusiness({ id: '1', yearFounded: currentYear }),      // 0 years = 0-2 range
          createTestBusiness({ id: '2', yearFounded: currentYear - 3 }),  // 3 years = 3-5 range (boundary)
          createTestBusiness({ id: '3', yearFounded: currentYear - 6 }),  // 6 years = 6-10 range (boundary)
          createTestBusiness({ id: '4', yearFounded: currentYear - 11 }), // 11 years = 11-20 range (boundary)
          createTestBusiness({ id: '5', yearFounded: currentYear - 21 }), // 21 years = 20+ range (boundary)
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        const ageDistribution = result.analytics.businessAgeDistribution;
        
        const dist = Object.fromEntries(ageDistribution.map(d => [d.ageRange, d.count]));
        expect(dist['0-2 years']).toBe(1);
        expect(dist['3-5 years']).toBe(1);
        expect(dist['6-10 years']).toBe(1);
        expect(dist['11-20 years']).toBe(1);
        expect(dist['20+ years']).toBe(1);
        expect(dist['Unknown']).toBe(0);
      });
    });

    describe('revenueDistribution', () => {
      it('should categorize businesses by revenue correctly', async () => {
        const businesses = [
          createTestBusiness({ id: '1', revenue: 50000 }),       // <$100K
          createTestBusiness({ id: '2', revenue: 250000 }),      // $100K-$500K
          createTestBusiness({ id: '3', revenue: 750000 }),      // $500K-$1M
          createTestBusiness({ id: '4', revenue: 2500000 }),     // $1M-$5M
          createTestBusiness({ id: '5', revenue: 10000000 }),    // $5M+
          createTestBusiness({ id: '6', revenue: null }),        // Unknown
          createTestBusiness({ id: '7', revenue: 0 }),           // <$100K (zero revenue is valid, not unknown)
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        const revDistribution = result.analytics.revenueDistribution;
        
        expect(revDistribution).toHaveLength(6);
        
        const dist = Object.fromEntries(revDistribution.map(d => [d.range, d.count]));
        expect(dist['<$100K']).toBe(2);  // includes 50000 and 0
        expect(dist['$100K-$500K']).toBe(1);
        expect(dist['$500K-$1M']).toBe(1);
        expect(dist['$1M-$5M']).toBe(1);
        expect(dist['$5M+']).toBe(1);
        expect(dist['Unknown']).toBe(1); // only null
      });

      it('should handle boundary values correctly (lower-inclusive, upper-exclusive)', async () => {
        const businesses = [
          createTestBusiness({ id: '1', revenue: 100000 }),     // Exactly $100K = $100K-$500K range
          createTestBusiness({ id: '2', revenue: 500000 }),     // Exactly $500K = $500K-$1M range
          createTestBusiness({ id: '3', revenue: 1000000 }),    // Exactly $1M = $1M-$5M range
          createTestBusiness({ id: '4', revenue: 5000000 }),    // Exactly $5M = $5M+ range
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        const revDistribution = result.analytics.revenueDistribution;
        
        const dist = Object.fromEntries(revDistribution.map(d => [d.range, d.count]));
        expect(dist['<$100K']).toBe(0);
        expect(dist['$100K-$500K']).toBe(1);  // $100K goes here
        expect(dist['$500K-$1M']).toBe(1);    // $500K goes here
        expect(dist['$1M-$5M']).toBe(1);      // $1M goes here
        expect(dist['$5M+']).toBe(1);         // $5M goes here
        expect(dist['Unknown']).toBe(0);
      });
    });

    describe('totals calculation', () => {
      it('should sum all businesses in distribution buckets', async () => {
        const businesses = [
          createTestBusiness({ id: '1', revenue: 50000, yearFounded: 2020 }),
          createTestBusiness({ id: '2', revenue: 250000, yearFounded: 2018 }),
          createTestBusiness({ id: '3', revenue: null, yearFounded: 2015 }),
          createTestBusiness({ id: '4', revenue: 1000000, yearFounded: 2020 }),
          createTestBusiness({ id: '5', revenue: 0, yearFounded: null }),
        ];
        repository.setBusinesses(businesses);
        
        const result = await service.searchBusinesses('', {});
        
        // Total businesses should equal sum of all revenue distribution buckets
        const revTotal = result.analytics.revenueDistribution.reduce((sum, d) => sum + d.count, 0);
        expect(revTotal).toBe(5);
        expect(revTotal).toBe(result.analytics.totalBusinesses);
        
        // Total businesses should equal sum of all age distribution buckets
        const ageTotal = result.analytics.businessAgeDistribution.reduce((sum, d) => sum + d.count, 0);
        expect(ageTotal).toBe(5);
        expect(ageTotal).toBe(result.analytics.totalBusinesses);
      });
    });
  });
});