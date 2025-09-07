import type { SupabaseClient } from '@supabase/supabase-js';
import { Business } from '../../core/domain/entities/Business';
import type { 
  IBusinessRepository, 
  BusinessFilters, 
  IndustryStats, 
  LocationStats 
} from '../../core/repositories/IBusinessRepository';

export class SupabaseBusinessRepository implements IBusinessRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Business | null> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      // Let error bubble up - no try-catch!
      throw new Error(`Failed to find business: ${error.message}`);
    }
    
    return data ? Business.fromDatabase(data) : null;
  }

  async findAll(limit: number = 100): Promise<Business[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch businesses: ${error.message}`);
    }
    
    return (data || []).map(Business.fromDatabase);
  }

  async save(business: Business): Promise<void> {
    // Transform domain entity back to database format
    const dbRecord = {
      id: business.id,
      name: business.name,
      industry: business.industry,
      employees: business.employeeCount,  // Map domain to DB field
      year_established: business.yearFounded,  // Map domain to DB field
      revenue: business.revenue,
      city: business.city,
      state: business.state,
      neighborhood: business.neighborhood,
      // Note: We don't update computed fields like revenue_per_employee
    };

    const { error } = await this.supabase
      .from('businesses')
      .upsert(dbRecord);
    
    if (error) {
      throw new Error(`Failed to save business: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('businesses')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete business: ${error.message}`);
    }
  }

  async findByIndustry(industry: string): Promise<Business[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .ilike('industry', `%${industry}%`);
    
    if (error) {
      throw new Error(`Failed to find by industry: ${error.message}`);
    }
    
    return (data || []).map(Business.fromDatabase);
  }

  async findByLocation(
    city?: string, 
    state?: string, 
    neighborhood?: string
  ): Promise<Business[]> {
    let query = this.supabase.from('businesses').select('*');
    
    if (city) query = query.ilike('city', `%${city}%`);
    if (state) query = query.eq('state', state);
    if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find by location: ${error.message}`);
    }
    
    return (data || []).map(Business.fromDatabase);
  }

  async findByEmployeeRange(min: number, max: number): Promise<Business[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .gte('employees', min)
      .lte('employees', max);
    
    if (error) {
      throw new Error(`Failed to find by employee range: ${error.message}`);
    }
    
    return (data || []).map(Business.fromDatabase);
  }

  async findByRevenueRange(min: number, max: number): Promise<Business[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .gte('revenue', min)
      .lte('revenue', max);
    
    if (error) {
      throw new Error(`Failed to find by revenue range: ${error.message}`);
    }
    
    return (data || []).map(Business.fromDatabase);
  }

  async search(query: string, filters?: BusinessFilters): Promise<Business[]> {
    let dbQuery = this.supabase
      .from('businesses')
      .select('*');
    
    // Apply text search
    if (query) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%,industry.ilike.%${query}%,neighborhood.ilike.%${query}%`
      );
    }
    
    // Apply filters
    if (filters) {
      if (filters.industry?.length) {
        dbQuery = dbQuery.in('industry', filters.industry);
      }
      if (filters.location?.city) {
        dbQuery = dbQuery.ilike('city', `%${filters.location.city}%`);
      }
      if (filters.location?.neighborhood) {
        dbQuery = dbQuery.ilike('neighborhood', `%${filters.location.neighborhood}%`);
      }
      if (filters.employeeRange) {
        if (filters.employeeRange.min) {
          dbQuery = dbQuery.gte('employees', filters.employeeRange.min);
        }
        if (filters.employeeRange.max) {
          dbQuery = dbQuery.lte('employees', filters.employeeRange.max);
        }
      }
      if (filters.revenueRange) {
        if (filters.revenueRange.min) {
          dbQuery = dbQuery.gte('revenue', filters.revenueRange.min);
        }
        if (filters.revenueRange.max) {
          dbQuery = dbQuery.lte('revenue', filters.revenueRange.max);
        }
      }
    }
    
    const { data, error } = await dbQuery;
    
    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    
    return (data || []).map(Business.fromDatabase);
  }

  async searchSemantic(embedding: number[], limit: number = 10): Promise<Business[]> {
    const { data, error } = await this.supabase.rpc('semantic_business_search', {
      query_embedding: embedding,
      limit_count: limit
    });
    
    if (error) {
      throw new Error(`Semantic search failed: ${error.message}`);
    }
    
    // Fetch full records for the returned IDs
    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.id);
      const { data: businesses, error: fetchError } = await this.supabase
        .from('businesses')
        .select('*')
        .in('id', ids);
      
      if (fetchError) {
        throw new Error(`Failed to fetch semantic results: ${fetchError.message}`);
      }
      
      return (businesses || []).map(Business.fromDatabase);
    }
    
    return [];
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const { error } = await this.supabase
      .from('businesses')
      .update({ embedding })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to update embedding: ${error.message}`);
    }
  }

  async getIndustryStats(): Promise<IndustryStats[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('industry, revenue, employees');
    
    if (error) {
      throw new Error(`Failed to get industry stats: ${error.message}`);
    }
    
    // Group by industry
    const stats = new Map<string, IndustryStats>();
    
    for (const record of data || []) {
      if (!record.industry) continue;
      
      if (!stats.has(record.industry)) {
        stats.set(record.industry, {
          industry: record.industry,
          count: 0,
          totalRevenue: 0,
          totalEmployees: 0,
          averageRevenue: 0,
        });
      }
      
      const stat = stats.get(record.industry)!;
      stat.count++;
      stat.totalRevenue += record.revenue || 0;
      stat.totalEmployees += record.employees || 0;
    }
    
    // Calculate averages
    for (const stat of stats.values()) {
      stat.averageRevenue = stat.count > 0 ? stat.totalRevenue / stat.count : 0;
    }
    
    return Array.from(stats.values());
  }

  async getLocationStats(): Promise<LocationStats[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('neighborhood, revenue, customer_rating');
    
    if (error) {
      throw new Error(`Failed to get location stats: ${error.message}`);
    }
    
    // Group by neighborhood
    const stats = new Map<string, LocationStats>();
    
    for (const record of data || []) {
      const location = record.neighborhood || 'Unknown';
      
      if (!stats.has(location)) {
        stats.set(location, {
          location,
          count: 0,
          totalRevenue: 0,
          averageRating: 0,
        });
      }
      
      const stat = stats.get(location)!;
      stat.count++;
      stat.totalRevenue += record.revenue || 0;
      stat.averageRating = 
        (stat.averageRating * (stat.count - 1) + (record.customer_rating || 0)) / stat.count;
    }
    
    return Array.from(stats.values());
  }

  async getTotalCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Failed to get count: ${error.message}`);
    }
    
    return count || 0;
  }
}