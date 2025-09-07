/**
 * Business types based on the demo data structure
 */

export interface BusinessAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode?: string;
  zip_code?: string; // Database field name compatibility
  latitude?: number;
  longitude?: number;
}

export interface NAICSLevels {
  naics2: string;
  naics3: string;
  naics4: string;
}

export interface OperatingCosts {
  rent: number;
  payroll: number;
  marketing: number;
  utilities: number;
  other: number;
}

export interface BusinessHours {
  monday: { open: string; close: string } | "Closed";
  tuesday: { open: string; close: string } | "Closed";
  wednesday: { open: string; close: string } | "Closed";
  thursday: { open: string; close: string } | "Closed";
  friday: { open: string; close: string } | "Closed";
  saturday: { open: string; close: string } | "Closed";
  sunday: { open: string; close: string } | "Closed";
}

export interface BusinessFeatures {
  parking: boolean;
  transitAccessible: boolean;
  wheelchairAccessible: boolean;
  wifi: boolean;
  outdoorSeating: boolean;
  delivery: boolean;
  curbsidePickup: boolean;
}

export interface BusinessReview {
  id: string;
  rating: number;
  comment?: string; // Maps to comment field in database
  text?: string;    // Legacy field for compatibility  
  reviewer?: string; // Maps to reviewer field in database
  author?: string;   // Legacy field for compatibility
  reviewed_at?: string; // Maps to reviewed_at field in database
  date?: string;     // Legacy field for compatibility
  verified?: boolean;
}

// Database-specific types for the enhanced schema
export interface Address {
  id?: number;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip_code?: string;
  zipCode?: string; // Legacy compatibility
  latitude?: number;
  longitude?: number;
}

export interface BusinessMetrics {
  squareFeet?: number;
  rentPerSqFt?: number;
  annualRent?: number;
  grossMargin?: number;
  netMargin?: number;
  revenueGrowth?: number;
  operatingCosts?: OperatingCosts;
  industryMetrics?: Record<string, string | number>;
  businessAge?: number;
  utilizationRate?: number;
  naicsCode?: string;
  cluster?: string;
}

export interface ExtendedFinancials {
  monthlyRevenue?: number[];
  revenuePerEmployee?: number;
  rating?: number;
  reviewCount?: number;
  hours?: BusinessHours;
}

export interface Business {
  // Core fields (clean domain entity names)
  id: string;
  name: string;
  industry?: string;
  sector?: string;
  description?: string;
  yearFounded?: number;    // CLEAN NAME - matches domain entity
  employeeCount?: number;  // CLEAN NAME - matches domain entity
  revenue?: number;
  website?: string;
  headquarters?: string;
  logoUrl?: string;        // CLEAN NAME - matches domain entity
  status?: string;
  created_at?: string;
  updated_at?: string;

  // Enhanced schema fields
  address?: Address;
  features?: BusinessFeatures;
  metrics?: BusinessMetrics;
  ext_financials?: ExtendedFinancials;
  reviews?: BusinessReview[];

  // Legacy fields for backward compatibility
  naics?: string;
  employeeSizeCategory?: string;
  naicsLevels?: NAICSLevels;
  businessType?: "Local" | "Regional" | "National" | "Franchise";
  cluster?: string;
  yearEstablished?: number;
  owner?: string;
  phone?: string;
  email?: string;

  // Computed/derived fields (from API transformation)
  monthlyRevenue?: number[]; // Extracted from ext_financials
  rating?: number;           // Extracted from ext_financials
  reviewCount?: number;      // Computed or from ext_financials
  hours?: BusinessHours;     // Extracted from ext_financials

  // Legacy fields for demo data compatibility
  employees?: number;         // Maps to employees_count
  revenuePerEmployee?: number; // Computed or from ext_financials
  grossMargin?: number;       // From metrics
  netMargin?: number;         // From metrics
  revenueGrowth?: number;     // From metrics
  neighborhood?: string;      // From address or legacy data
  squareFeet?: number;        // From metrics
  rentPerSqFt?: number;       // From metrics
  annualRent?: number;        // From metrics
  operatingCosts?: OperatingCosts; // From metrics
  industryMetrics?: Record<string, string | number>; // From metrics
  businessAge?: number;       // From metrics

  // Demo metadata
  isDemo?: boolean;
  dataVersion?: string;
  lastUpdated?: string;
}

export interface DemoDataset {
  version: string;
  generated: string;
  totalBusinesses: number;
  metadata: {
    description: string;
    improvements: string[];
    dataQuality: {
      hasRealisticFinancials: boolean;
      hasLocationContext: boolean;
      hasOperatingCosts: boolean;
      hasSeasonalData: boolean;
      corruptedRecordsFixed: boolean;
    };
  };
  businesses: Business[];
}

// Search and filter types
export interface BusinessSearchFilters {
  query?: string;
  industry?: string[];
  neighborhood?: string[];
  location?: string[]; // Added for API compatibility
  employeeRange?: {
    min?: number;
    max?: number;
  };
  revenueRange?: {
    min?: number;
    max?: number;
  };
  businessType?: string[];
  features?: Partial<BusinessFeatures>;
  naics?: string[];
  yearEstablished?: {
    min?: number;
    max?: number;
  };
  rating?: {
    min?: number;
  };
  sortBy?: "name" | "revenue" | "employees" | "rating" | "yearEstablished";
  sortOrder?: "asc" | "desc";
}

export interface BusinessSearchResult {
  businesses: Business[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filters: BusinessSearchFilters;
  analytics: BusinessAnalytics;
}

// Analytics types
export interface BusinessAnalytics {
  totalBusinesses: number;
  totalCompanies: number; // Added for API compatibility
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
  revenueByIndustry: Array<{
    industry: string;
    revenue: number;
  }>;
  topNeighborhoods: Array<{
    neighborhood: string;
    count: number;
    totalRevenue: number;
    avgRating: number;
  }>;
  businessAgeDistribution: Array<{
    ageRange: string;
    count: number;
  }>;
  revenueDistribution: Array<{
    range: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalRevenue: number;
    avgRevenue: number;
    businessCount: number;
  }>;
}

// Export types
export interface ExportOptions {
  format: "csv" | "json" | "pdf";
  fields: (keyof Business)[];
  filters?: BusinessSearchFilters;
  includeAnalytics?: boolean;
}

export type BusinessSortField = keyof Pick<
  Business,
  | "name"
  | "revenue"
  | "employees"
  | "rating"
  | "yearEstablished"
  | "revenueGrowth"
  | "grossMargin"
>;

export type BusinessGroupBy =
  | "industry"
  | "neighborhood"
  | "businessType"
  | "cluster"
  | "employeeSizeCategory";
