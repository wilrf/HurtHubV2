import type { Business } from '../domain/entities/Business.js';
import type { IBusinessRepository } from '../repositories/IBusinessRepository.js';
import type OpenAI from 'openai';

export class AIBusinessService {
  constructor(
    private repository: IBusinessRepository,
    private openai: OpenAI
  ) {}

  async performSemanticSearch(query: string, limit: number = 10): Promise<Business[]> {
    // Generate embedding for the query - NUCLEAR approach, no preprocessing
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