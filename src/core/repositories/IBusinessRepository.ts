import type { Business } from '../domain/entities/Business';

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
  
  // Embedding operations
  updateEmbedding(id: string, embedding: number[]): Promise<void>;
  
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