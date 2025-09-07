
# Agent 1 - Domain & Repository Layer Implementation

## 🎯 Your Mission
You are responsible for creating the foundation of our clean architecture: the domain entities and repository pattern. This is the most critical layer as both other agents depend on your work.

## 🏛️ Architecture Context
We're moving from direct database access to proper layered architecture:
- **CURRENT**: APIs directly query Supabase
- **TARGET**: APIs → Services → **Repositories** → **Domain Entities** → Database

You're building the **Domain Entities** and **Repository** layers.

## 📁 Files You Will Create

### 1. **CREATE: `src/core/domain/entities/Business.ts`**
```typescript
// Domain entity representing a Business
export class Business {
  // Domain properties (use business-friendly names)
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly industry: string | null,
    public readonly employeeCount: number | null,  // NOT employees_count
    public readonly yearFounded: number | null,     // NOT year_established
    public readonly revenue: number | null,
    public readonly city: string,
    public readonly state: string,
    public readonly neighborhood: string | null,
    // Rich domain properties
    public readonly operatingHours: BusinessHours | null,
    public readonly customerMetrics: CustomerMetrics | null,
    public readonly financialMetrics: FinancialMetrics | null,
  ) {}

  // Factory method to create from database record
  static fromDatabase(record: any): Business {
    return new Business(
      record.id,
      record.name,
      record.industry,
      record.employees,           // Map DB field to domain field
      record.year_established,    // Map DB field to domain field
      record.revenue,
      record.city || 'Charlotte',
      record.state || 'NC',
      record.neighborhood,
      // Transform operating hours from DB format
      Business.parseOperatingHours(record),
      // Build customer metrics
      {
        averageSpend: record.avg_customer_spend,
        monthlyCustomers: record.monthly_customers,
        rating: record.customer_rating,
        reviewCount: record.review_count,
      },
      // Build financial metrics
      {
        revenuePerEmployee: record.revenue_per_employee,
        operatingMargin: record.operating_margin,
        monthlyRent: record.rent_per_month,
        monthlyPayroll: record.payroll_per_month,
        monthlyUtilities: record.utilities_per_month,
      }
    );
  }

  // Helper to parse hours from DB format
  private static parseOperatingHours(record: any): BusinessHours | null {
    if (!record.hours_monday) return null;
    
    return {
      monday: record.hours_monday,
      tuesday: record.hours_tuesday,
      wednesday: record.hours_wednesday,
      thursday: record.hours_thursday,
      friday: record.hours_friday,
      saturday: record.hours_saturday,
      sunday: record.hours_sunday,
    };
  }

  // Domain methods (business logic goes here)
  isOpenOn(day: string): boolean {
    if (!this.operatingHours) return false;
    const hours = this.operatingHours[day.toLowerCase()];
    return hours !== null && hours !== 'Closed';
  }

  getAgeInYears(): number | null {
    if (!this.yearFounded) return null;
    return new Date().getFullYear() - this.yearFounded;
  }

  getEmployeeSizeCategory(): string {
    if (!this.employeeCount) return 'Unknown';
    if (this.employeeCount < 10) return 'Micro';
    if (this.employeeCount < 50) return 'Small';
    if (this.employeeCount < 250) return 'Medium';
    return 'Large';
  }

  // Convert to API response format
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      industry: this.industry,
      employeeCount: this.employeeCount,
      yearFounded: this.yearFounded,
      revenue: this.revenue,
      location: {
        city: this.city,
        state: this.state,
        neighborhood: this.neighborhood,
      },
      operatingHours: this.operatingHours,
      customerMetrics: this.customerMetrics,
      financialMetrics: this.financialMetrics,
      // Computed properties
      businessAge: this.getAgeInYears(),
      sizeCategory: this.getEmployeeSizeCategory(),
    };
  }
}

// Supporting types
interface BusinessHours {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
}

interface CustomerMetrics {
  averageSpend: number | null;
  monthlyCustomers: number | null;
  rating: number | null;
  reviewCount: number | null;
}

interface FinancialMetrics {
  revenuePerEmployee: number | null;
  operatingMargin: number | null;
  monthlyRent: number | null;
  monthlyPayroll: number | null;
  monthlyUtilities: number | null;
}
```

### 2. **CREATE: `src/core/repositories/IBusinessRepository.ts`**
```typescript
import { Business } from '../domain/entities/Business';

// Repository interface - defines data access contract
export interface IBusinessRepository {
  // Basic CRUD operations
  findById(id: string): Promise<Business | null>;
  findAll(limit?: number): Promise<Business[]>;
  save(business: Business): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query operations
  findByIndustry(industry: string): Promise<Business[]>;
  findByLocation(city?: string, state?: string, neighborhood?: string): Promise<Business[]>;
  findByEmployeeRange(min: number, max: number): Promise<Business[]>;
  findByRevenueRange(min: number, max: number): Promise<Business[]>;
  
  // Search operations
  search(query: string, filters?: BusinessFilters): Promise<Business[]>;
  searchSemantic(embedding: number[], limit?: number): Promise<Business[]>;
  
  // Analytics operations
  getIndustryStats(): Promise<IndustryStats[]>;
  getLocationStats(): Promise<LocationStats[]>;
  getTotalCount(): Promise<number>;
}

export interface BusinessFilters {
  industry?: string[];
  location?: {
    city?: string;
    state?: string;
    neighborhood?: string;
  };
  employeeRange?: {
    min?: number;
    max?: number;
  };
  revenueRange?: {
    min?: number;
    max?: number;
  };
  yearFoundedRange?: {
    min?: number;
    max?: number;
  };
}

export interface IndustryStats {
  industry: string;
  count: number;
  totalRevenue: number;
  totalEmployees: number;
  averageRevenue: number;
}

export interface LocationStats {
  location: string;
  count: number;
  totalRevenue: number;
  averageRating: number;
}
```

### 3. **CREATE: `src/infrastructure/repositories/SupabaseBusinessRepository.ts`**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Business } from '../../core/domain/entities/Business';
import { 
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
```

### 4. **DELETE: `src/services/BusinessAdapter.ts`**
Remove this file completely - it's the wrong pattern. Domain entities replace it.

## 📋 Implementation Checklist

- [ ] Create folder structure: `src/core/domain/entities/`
- [ ] Create folder structure: `src/core/repositories/`
- [ ] Create folder structure: `src/infrastructure/repositories/`
- [ ] Implement Business domain entity with fromDatabase()
- [ ] Implement IBusinessRepository interface
- [ ] Implement SupabaseBusinessRepository
- [ ] Delete BusinessAdapter.ts
- [ ] Run `npm run type-check` - ensure no errors
- [ ] Update EXECUTION_LOG.md with your progress

## 🎯 Success Criteria

1. **Domain Entity** properly transforms DB records to business objects
2. **Repository Interface** defines clear data access contract
3. **Repository Implementation** handles all Supabase queries
4. **No Business Logic** in repository (only data access)
5. **Error Bubbling** - no try-catch, let errors propagate
6. **Type Safety** - full TypeScript typing throughout

## 🚨 Critical Notes

- **Field Mapping**: DB `employees` → Domain `employeeCount`
- **Field Mapping**: DB `year_established` → Domain `yearFounded`
- **No Fallbacks**: Don't use `|| ''` or `|| 0` - use proper null handling
- **Let Errors Bubble**: No try-catch in repositories
- **Domain Logic**: Put business methods in the entity, not repository

## 📊 Database Schema Reference

Key fields in `businesses` table:
- `id` (varchar)
- `name` (varchar)
- `employees` (integer) - NOT employees_count!
- `year_established` (integer) - NOT founded_year!
- `revenue` (numeric)
- `city`, `state`, `neighborhood` (varchar)
- `hours_monday` through `hours_sunday` (varchar)
- `avg_customer_spend`, `monthly_customers` (numeric)
- `customer_rating`, `review_count` (numeric)
- `embedding` (vector) - for semantic search

Your work creates the foundation for the entire architecture. Agent 2 and Agent 3 depend on your domain entity and repository!