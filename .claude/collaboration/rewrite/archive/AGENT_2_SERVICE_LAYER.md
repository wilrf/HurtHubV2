# Agent 2 - Service Layer Implementation

## 🎯 Your Mission
You are responsible for implementing the service layer that contains all business logic. Services orchestrate between the API layer and repositories, ensuring clean separation of concerns.

## 🏛️ Architecture Context
Your services will:
- Use repositories created by Agent 1 for data access
- Contain ALL business logic (none in APIs or repositories)
- Be used by Agent 3's cleaned-up API endpoints

Position in architecture: UI → API → **Services (YOU)** → Repositories → Domain → Database

## 📁 Files You Will Create/Update

### 1. **CREATE: `src/core/services/BusinessService.ts`**
Main business service with core business logic:

```typescript
import { Business } from '../domain/entities/Business';
import { IBusinessRepository, BusinessFilters } from '../repositories/IBusinessRepository';

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
```

### 2. **CREATE: `src/core/services/AIBusinessService.ts`**
AI-specific business logic:

```typescript
import { Business } from '../domain/entities/Business';
import { IBusinessRepository } from '../repositories/IBusinessRepository';
import OpenAI from 'openai';

export class AIBusinessService {
  constructor(
    private repository: IBusinessRepository,
    private openai: OpenAI
  ) {}

  async performSemanticSearch(query: string, limit: number = 10): Promise<Business[]> {
    // Generate embedding for the query
    const embedding = await this.generateEmbedding(query);
    
    // Perform semantic search
    return this.repository.searchSemantic(embedding, limit);
  }

  async enhanceBusinessQuery(
    userQuery: string
  ): Promise<{ businesses: Business[]; context: string }> {
    // Business logic: Analyze query intent
    const intent = await this.analyzeQueryIntent(userQuery);
    
    // Fetch relevant businesses based on intent
    let businesses: Business[] = [];
    
    if (intent.searchType === 'semantic') {
      businesses = await this.performSemanticSearch(userQuery);
    } else {
      businesses = await this.repository.search(intent.searchQuery || userQuery, intent.filters);
    }
    
    // Generate context for AI response
    const context = this.generateBusinessContext(businesses);
    
    return { businesses, context };
  }

  async generateBusinessInsights(businessId: string): Promise<string> {
    // Business logic for generating AI insights
    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }
    
    // Get industry context
    const industryPeers = await this.repository.findByIndustry(business.industry || '');
    
    // Calculate relative performance
    const avgRevenue = industryPeers.reduce((sum, b) => sum + (b.revenue || 0), 0) / industryPeers.length;
    const avgEmployees = industryPeers.reduce((sum, b) => sum + (b.employeeCount || 0), 0) / industryPeers.length;
    
    const prompt = `
      Analyze this business:
      - Name: ${business.name}
      - Industry: ${business.industry}
      - Revenue: $${business.revenue?.toLocaleString() || 'N/A'}
      - Employees: ${business.employeeCount || 'N/A'}
      - Age: ${business.getAgeInYears() || 'N/A'} years
      
      Industry averages:
      - Avg Revenue: $${avgRevenue.toLocaleString()}
      - Avg Employees: ${Math.round(avgEmployees)}
      
      Provide 3 key insights about this business's performance and position.
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || 'Unable to generate insights';
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  }

  private async analyzeQueryIntent(query: string): Promise<{
    searchType: 'semantic' | 'structured';
    searchQuery?: string;
    filters?: any;
  }> {
    // Simple heuristic for now - could use AI for better intent detection
    const lowerQuery = query.toLowerCase();
    
    // Check for structured query patterns
    if (lowerQuery.includes('industry:') || lowerQuery.includes('revenue:') || lowerQuery.includes('employees:')) {
      // Parse structured query
      return {
        searchType: 'structured',
        searchQuery: query,
        filters: this.parseStructuredQuery(query),
      };
    }
    
    // Default to semantic search for natural language queries
    return {
      searchType: 'semantic',
      searchQuery: query,
    };
  }

  private parseStructuredQuery(query: string): any {
    // Simple parser for structured queries
    const filters: any = {};
    
    const industryMatch = query.match(/industry:(\w+)/i);
    if (industryMatch) {
      filters.industry = [industryMatch[1]];
    }
    
    const revenueMatch = query.match(/revenue:([><]=?)(\d+)/i);
    if (revenueMatch) {
      const operator = revenueMatch[1];
      const value = parseInt(revenueMatch[2]);
      filters.revenueRange = operator.includes('>') 
        ? { min: value } 
        : { max: value };
    }
    
    return filters;
  }

  private generateBusinessContext(businesses: Business[]): string {
    if (businesses.length === 0) {
      return 'No businesses found matching the query.';
    }
    
    const context = businesses.slice(0, 5).map(b => 
      `- ${b.name}: ${b.industry || 'Unknown industry'}, ${b.employeeCount || 'Unknown'} employees, ` +
      `$${b.revenue?.toLocaleString() || 'Unknown'} revenue, located in ${b.neighborhood || b.city}`
    ).join('\n');
    
    return `Found ${businesses.length} businesses. Top results:\n${context}`;
  }
}
```

### 3. **UPDATE: `src/core/services/BusinessIntelligenceService.ts`**
Update to use repository pattern:

```typescript
import { Business } from '../domain/entities/Business';
import { IBusinessRepository } from '../repositories/IBusinessRepository';

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
```

## 📋 Implementation Checklist

- [ ] Create folder structure: `src/core/services/`
- [ ] Implement BusinessService with core business logic
- [ ] Implement AIBusinessService with AI-specific logic
- [ ] Update BusinessIntelligenceService to use repository
- [ ] Remove ALL direct Supabase queries from services
- [ ] Ensure all business logic is in services (not in repositories or APIs)
- [ ] Run `npm run type-check` - fix any type errors
- [ ] Update EXECUTION_LOG.md with your progress

## 🎯 Success Criteria

1. **Services use repositories** - No direct database access
2. **Business logic centralized** - All in service layer
3. **Dependency injection** - Services receive repositories in constructor
4. **Error propagation** - Let errors bubble (no unnecessary try-catch)
5. **Clean interfaces** - Services return domain entities or DTOs
6. **Type safety** - Full TypeScript typing

## 🚨 Critical Notes

- **Wait for Agent 1** - You need their repository interfaces and domain entities
- **No Supabase imports** - Services should not know about Supabase
- **Use domain entities** - Work with Business objects, not raw DB records
- **Business logic only** - Don't put UI concerns or data access in services
- **Let errors bubble** - Don't catch errors unless you're adding value

## 🔄 Dependencies

**From Agent 1:**
- `Business` domain entity
- `IBusinessRepository` interface
- Repository implementation (for understanding, not direct use)

**For Agent 3:**
- Your services will be used by all API endpoints
- Provide clear service methods for common operations
- Ensure services are easy to instantiate and use

Your services are the brain of the application - all business logic lives here!