import type { Business } from '../domain/entities/Business';
import type { IBusinessRepository } from '../repositories/IBusinessRepository';

export class BusinessIntelligenceService {
  constructor(private repository: IBusinessRepository) {}

  async generateMarketAnalysis(): Promise<MarketAnalysis> {
    // Use repository instead of direct Supabase queries
    const businesses = await this.repository.findAll(1000);
    const industryStats = await this.repository.getIndustryStats();
    const locationStats = await this.repository.getLocationStats();
    
    // Business logic for market analysis
    const totalMarketSize = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);
    const totalEmployment = businesses.reduce((sum, b) => sum + (b.employeeCount || 0), 0);
    
    // Industry concentration
    const industryConcentration = this.calculateHerfindahlIndex(industryStats);
    
    // Geographic distribution
    const geographicDiversity = this.calculateGeographicDiversity(locationStats);
    
    // Growth indicators
    const youngBusinesses = businesses.filter(b => {
      const age = b.getAgeInYears();
      return age !== null && age <= 5;
    });
    const growthRate = youngBusinesses.length / businesses.length;
    
    return {
      totalMarketSize,
      totalEmployment,
      businessCount: businesses.length,
      industryConcentration,
      geographicDiversity,
      growthRate,
      topIndustries: industryStats.slice(0, 5),
      topLocations: locationStats.slice(0, 5),
      marketMaturity: this.assessMarketMaturity(businesses),
    };
  }

  async generateCompetitiveLandscape(businessId: string): Promise<CompetitiveLandscape> {
    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }
    
    // Find competitors
    const competitors = await this.repository.findByIndustry(business.industry || '');
    
    // Filter to actual competitors (similar size/location)
    const relevantCompetitors = competitors.filter(c => {
      if (c.id === businessId) return false;
      
      // Similar size (within 2x range)
      const sizeRatio = (c.employeeCount || 1) / (business.employeeCount || 1);
      if (sizeRatio < 0.5 || sizeRatio > 2) return false;
      
      // Same city
      if (c.city !== business.city) return false;
      
      return true;
    });
    
    // Calculate market position
    const marketPosition = this.calculateMarketPosition(business, relevantCompetitors);
    
    // Identify threats and opportunities
    const threats = this.identifyThreats(business, relevantCompetitors);
    const opportunities = this.identifyOpportunities(business, relevantCompetitors);
    
    return {
      business: business.toJSON(),
      competitors: relevantCompetitors.map(c => c.toJSON()),
      marketPosition,
      threats,
      opportunities,
      competitionIntensity: this.assessCompetitionIntensity(relevantCompetitors),
    };
  }

  private calculateHerfindahlIndex(industryStats: any[]): number {
    const total = industryStats.reduce((sum, stat) => sum + stat.totalRevenue, 0);
    if (total === 0) return 0;
    
    const shares = industryStats.map(stat => stat.totalRevenue / total);
    return shares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
  }

  private calculateGeographicDiversity(locationStats: any[]): number {
    // Shannon diversity index
    const total = locationStats.reduce((sum, stat) => sum + stat.count, 0);
    if (total === 0) return 0;
    
    let diversity = 0;
    for (const stat of locationStats) {
      const proportion = stat.count / total;
      if (proportion > 0) {
        diversity -= proportion * Math.log(proportion);
      }
    }
    
    return diversity;
  }

  private assessMarketMaturity(businesses: Business[]): 'emerging' | 'growing' | 'mature' | 'declining' {
    const avgAge = businesses.reduce((sum, b) => {
      const age = b.getAgeInYears();
      return sum + (age || 0);
    }, 0) / businesses.length;
    
    if (avgAge < 5) return 'emerging';
    if (avgAge < 10) return 'growing';
    if (avgAge < 20) return 'mature';
    return 'declining';
  }

  private calculateMarketPosition(business: Business, competitors: Business[]): string {
    const allBusinesses = [business, ...competitors];
    const revenueRank = allBusinesses
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .findIndex(b => b.id === business.id) + 1;
    
    const percentile = ((allBusinesses.length - revenueRank) / allBusinesses.length) * 100;
    
    if (percentile >= 75) return 'Market Leader';
    if (percentile >= 50) return 'Strong Competitor';
    if (percentile >= 25) return 'Emerging Player';
    return 'Niche Player';
  }

  private identifyThreats(business: Business, competitors: Business[]): string[] {
    const threats: string[] = [];
    
    // Larger competitors
    const largerCompetitors = competitors.filter(c => (c.revenue || 0) > (business.revenue || 0) * 1.5);
    if (largerCompetitors.length > 0) {
      threats.push(`${largerCompetitors.length} larger competitors in the same market`);
    }
    
    // Newer, fast-growing competitors
    const newCompetitors = competitors.filter(c => {
      const age = c.getAgeInYears();
      return age !== null && age < 3;
    });
    if (newCompetitors.length > 0) {
      threats.push(`${newCompetitors.length} new entrants in the last 3 years`);
    }
    
    return threats;
  }

  private identifyOpportunities(business: Business, competitors: Business[]): string[] {
    const opportunities: string[] = [];
    
    // Underserved segments
    const avgCustomerRating = competitors.reduce((sum, c) => 
      sum + (c.customerMetrics?.rating || 0), 0) / competitors.length;
    
    if (business.customerMetrics?.rating && business.customerMetrics.rating > avgCustomerRating) {
      opportunities.push('Above-average customer satisfaction provides competitive advantage');
    }
    
    // Geographic expansion
    const uniqueNeighborhoods = new Set(competitors.map(c => c.neighborhood));
    if (uniqueNeighborhoods.size > 1) {
      opportunities.push(`Potential expansion into ${uniqueNeighborhoods.size - 1} additional neighborhoods`);
    }
    
    return opportunities;
  }

  private assessCompetitionIntensity(competitors: Business[]): 'low' | 'medium' | 'high' | 'very high' {
    if (competitors.length < 3) return 'low';
    if (competitors.length < 10) return 'medium';
    if (competitors.length < 20) return 'high';
    return 'very high';
  }
}

interface MarketAnalysis {
  totalMarketSize: number;
  totalEmployment: number;
  businessCount: number;
  industryConcentration: number;
  geographicDiversity: number;
  growthRate: number;
  topIndustries: any[];
  topLocations: any[];
  marketMaturity: string;
}

interface CompetitiveLandscape {
  business: any;
  competitors: any[];
  marketPosition: string;
  threats: string[];
  opportunities: string[];
  competitionIntensity: string;
}