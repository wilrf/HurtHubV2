import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  revenue?: number;
  employees_count?: number;
  employees?: number; // From semantic search
  headquarters?: string;
  neighborhood?: string;
  year_established?: number;
  similarity?: number;
  searchType?: string;
}

interface MarketInsights {
  density: string;
  competition: string;
  opportunities: string[];
  topCompetitors: CompanyData[];
  marketGaps: string[];
}

interface BusinessIntelligenceResult {
  companies: CompanyData[];
  insights: MarketInsights;
  searchMetadata: {
    query: string;
    method: string;
    resultsCount: number;
    searchArea?: string;
    timestamp: string;
  };
  summary: {
    totalRevenue: number;
    totalEmployees: number;
    averageRevenue: number;
    topIndustries: { industry: string; count: number }[];
  };
}

export class BusinessIntelligenceService {
  constructor(
    private supabase: SupabaseClient,
    private openai: OpenAI
  ) {}

  /**
   * Get contextual business data using semantic search with embeddings
   */
  async getContextualBusinessData(
    query: string,
    limit: number = 10
  ): Promise<BusinessIntelligenceResult> {
    console.log("🧠 BusinessIntelligenceService: Processing query:", query);
    
    // 1. Perform semantic search using embeddings
    const companies = await this.performSemanticSearch(query, limit);
    
    // 2. Compute market insights from the results
    const insights = this.computeMarketInsights(companies, query);
    
    // 3. Calculate summary statistics
    const summary = this.computeSummaryStats(companies);
    
    // 4. Build metadata
    const searchMetadata = {
      query,
      method: companies.length > 0 && companies[0].similarity ? "semantic" : "keyword",
      resultsCount: companies.length,
      searchArea: this.extractLocation(query),
      timestamp: new Date().toISOString(),
    };
    
    console.log("✅ BusinessIntelligenceService: Processed", {
      companiesFound: companies.length,
      method: searchMetadata.method,
      hasInsights: !!insights,
    });
    
    return {
      companies,
      insights,
      searchMetadata,
      summary,
    };
  }

  /**
   * Perform semantic search using vector embeddings
   */
  private async performSemanticSearch(
    query: string,
    limit: number
  ): Promise<CompanyData[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);
      
      // Call the semantic search RPC function
      const { data, error } = await this.supabase.rpc("semantic_business_search", {
        query_embedding: embedding,
        similarity_threshold: 0.3,
        match_count: limit,
      });
      
      if (error) {
        console.warn("⚠️ Semantic search failed, falling back to keyword search:", error);
        return this.performKeywordFallback(query, limit);
      }
      
      // Map results and add search type, normalize employee field
      return (data || []).map((company: any) => ({
        ...company,
        employees_count: company.employees || company.employees_count,
        searchType: "semantic",
      }));
    } catch (error) {
      console.error("❌ Semantic search error:", error);
      return this.performKeywordFallback(query, limit);
    }
  }

  /**
   * Generate embedding vector for a query
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  }

  /**
   * Fallback to keyword search if semantic search fails
   */
  private async performKeywordFallback(
    query: string,
    limit: number
  ): Promise<CompanyData[]> {
    const keywords = query.toLowerCase().split(" ");
    
    let queryBuilder = this.supabase
      .from("companies")
      .select("id, name, industry, revenue, employees_count, headquarters")
      .eq("status", "active")
      .limit(limit);
    
    // Add keyword filters
    if (keywords.length > 0) {
      const searchPattern = keywords.join(" | ");
      queryBuilder = queryBuilder.or(
        `name.ilike.%${searchPattern}%,industry.ilike.%${searchPattern}%`
      );
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error("❌ Keyword search error:", error);
      return [];
    }
    
    return (data || []).map((company: any) => ({
      ...company,
      searchType: "keyword",
    }));
  }

  /**
   * Compute market insights from search results
   */
  private computeMarketInsights(
    companies: CompanyData[],
    query: string
  ): MarketInsights {
    // Group by industry
    const industryGroups = this.groupByIndustry(companies);
    const topIndustry = Object.keys(industryGroups)[0];
    
    // Calculate market density
    const density = this.calculateMarketDensity(companies.length, query);
    
    // Identify top competitors
    const topCompetitors = companies
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 3);
    
    // Identify market gaps
    const marketGaps = this.identifyMarketGaps(companies, query);
    
    // Generate competition assessment
    const competition = this.assessCompetition(companies.length, topCompetitors);
    
    // Generate opportunities
    const opportunities = this.identifyOpportunities(density, marketGaps, companies);
    
    return {
      density,
      competition,
      opportunities,
      topCompetitors,
      marketGaps,
    };
  }

  /**
   * Calculate summary statistics
   */
  private computeSummaryStats(companies: CompanyData[]) {
    const totalRevenue = companies.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const totalEmployees = companies.reduce((sum, c) => sum + (c.employees_count || 0), 0);
    const averageRevenue = companies.length > 0 ? totalRevenue / companies.length : 0;
    
    // Count by industry
    const industryCount = companies.reduce((acc, company) => {
      const industry = company.industry || "Unknown";
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topIndustries = Object.entries(industryCount)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalRevenue,
      totalEmployees,
      averageRevenue,
      topIndustries,
    };
  }

  /**
   * Helper: Group companies by industry
   */
  private groupByIndustry(companies: CompanyData[]): Record<string, CompanyData[]> {
    return companies.reduce((groups, company) => {
      const industry = company.industry || "Other";
      if (!groups[industry]) groups[industry] = [];
      groups[industry].push(company);
      return groups;
    }, {} as Record<string, CompanyData[]>);
  }

  /**
   * Helper: Calculate market density
   */
  private calculateMarketDensity(companyCount: number, query: string): string {
    if (companyCount === 0) return "No competition - untapped market";
    if (companyCount <= 3) return "Low density - significant opportunity";
    if (companyCount <= 10) return "Moderate density - room for differentiation";
    if (companyCount <= 20) return "High density - competitive market";
    return "Saturated market - strong differentiation required";
  }

  /**
   * Helper: Assess competition level
   */
  private assessCompetition(count: number, topCompetitors: CompanyData[]): string {
    if (count === 0) return "No direct competition found";
    
    const avgRevenue = topCompetitors.reduce((sum, c) => sum + (c.revenue || 0), 0) / topCompetitors.length;
    
    if (avgRevenue > 10000000) {
      return `Strong competition with ${count} established players, top competitors averaging $${(avgRevenue / 1000000).toFixed(1)}M revenue`;
    } else if (avgRevenue > 1000000) {
      return `Moderate competition with ${count} mid-size players, averaging $${(avgRevenue / 1000000).toFixed(1)}M revenue`;
    } else {
      return `Light competition with ${count} smaller players, mostly under $1M revenue`;
    }
  }

  /**
   * Helper: Identify market gaps
   */
  private identifyMarketGaps(companies: CompanyData[], query: string): string[] {
    const gaps: string[] = [];
    
    // Check for missing price segments
    const avgRevenue = companies.reduce((sum, c) => sum + (c.revenue || 0), 0) / companies.length;
    if (avgRevenue > 5000000) {
      gaps.push("Budget/entry-level segment underserved");
    } else if (avgRevenue < 1000000) {
      gaps.push("Premium/enterprise segment available");
    }
    
    // Check for geographic gaps
    const locations = companies.map(c => c.headquarters).filter(Boolean);
    if (locations.length < companies.length / 2) {
      gaps.push("Geographic expansion opportunities");
    }
    
    return gaps;
  }

  /**
   * Helper: Identify business opportunities
   */
  private identifyOpportunities(
    density: string,
    gaps: string[],
    companies: CompanyData[]
  ): string[] {
    const opportunities: string[] = [];
    
    if (density.includes("Low") || density.includes("No competition")) {
      opportunities.push("First-mover advantage available");
    }
    
    if (gaps.length > 0) {
      opportunities.push(`Market gaps identified: ${gaps[0]}`);
    }
    
    if (companies.length > 0 && companies.length < 5) {
      opportunities.push("Partnership opportunities with existing players");
    }
    
    if (companies.some(c => (c.revenue || 0) > 10000000)) {
      opportunities.push("Proven market demand with successful incumbents");
    }
    
    return opportunities;
  }

  /**
   * Helper: Extract location from query
   */
  private extractLocation(query: string): string | undefined {
    const locations = [
      "huntersville", "davidson", "charlotte", "matthews", "mint hill",
      "cornelius", "mooresville", "concord", "gastonia", "rock hill"
    ];
    
    const queryLower = query.toLowerCase();
    const found = locations.find(loc => queryLower.includes(loc));
    
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : undefined;
  }
}