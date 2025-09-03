import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

interface BusinessesRequest {
  filters?: {
    industry?: string[];
    location?: string[];
    minRevenue?: number;
    maxRevenue?: number;
    minEmployees?: number;
    maxEmployees?: number;
    query?: string;
  };
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialize Supabase
  let supabase;
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required');
    }

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }

    supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());
  } catch (error: any) {
    console.error('Supabase initialization failed:', error.message);
    return res.status(500).json({ 
      error: 'Database configuration error',
      details: error.message 
    });
  }

  try {
    if (req.method === 'GET') {
      // Handle GET request with query parameters
      const { 
        industry, 
        location, 
        minRevenue, 
        maxRevenue, 
        minEmployees, 
        maxEmployees, 
        query, 
        page = '1', 
        limit = '20',
        sortBy = 'revenue',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        industry: industry ? (Array.isArray(industry) ? industry : [industry]) : undefined,
        location: location ? (Array.isArray(location) ? location : [location]) : undefined,
        minRevenue: minRevenue ? parseInt(minRevenue as string) : undefined,
        maxRevenue: maxRevenue ? parseInt(maxRevenue as string) : undefined,
        minEmployees: minEmployees ? parseInt(minEmployees as string) : undefined,
        maxEmployees: maxEmployees ? parseInt(maxEmployees as string) : undefined,
        query: query as string,
      };

      const businessesData = await getBusinesses({
        filters,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      }, supabase);

      return res.status(200).json(businessesData);
    }

    if (req.method === 'POST') {
      // Handle POST request with body
      const requestData = req.body as BusinessesRequest;
      const businessesData = await getBusinesses(requestData, supabase);
      return res.status(200).json(businessesData);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Businesses API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch businesses',
      details: error.message
    });
  }
}

async function getBusinesses(request: BusinessesRequest, supabase: any) {
  const { 
    filters = {}, 
    page = 1, 
    limit = 20, 
    sortBy = 'revenue', 
    sortOrder = 'desc' 
  } = request;

  // Start building query
  let query = supabase
    .from('companies')
    .select('*')
    .eq('status', 'active');

  // Apply filters
  if (filters.industry && filters.industry.length > 0) {
    const industryConditions = filters.industry
      .map((ind: string) => `industry.ilike.%${ind}%`)
      .join(',');
    query = query.or(industryConditions);
  }

  if (filters.location && filters.location.length > 0) {
    const locationConditions = filters.location
      .map((loc: string) => `headquarters.ilike.%${loc}%,description.ilike.%${loc}%`)
      .join(',');
    query = query.or(locationConditions);
  }

  if (filters.query) {
    const searchTerm = filters.query.trim();
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`);
  }

  // Apply numeric filters
  if (filters.minRevenue) {
    query = query.gte('revenue', filters.minRevenue);
  }
  if (filters.maxRevenue) {
    query = query.lte('revenue', filters.maxRevenue);
  }
  if (filters.minEmployees) {
    query = query.gte('employees_count', filters.minEmployees);
  }
  if (filters.maxEmployees) {
    query = query.lte('employees_count', filters.maxEmployees);
  }

  // Apply sorting
  const validSortFields = ['name', 'industry', 'revenue', 'employees_count', 'founded_year', 'created_at'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'revenue';
  query = query.order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false });

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Get filter options for frontend
  const filterOptions = await getFilterOptions(supabase);

  // Calculate analytics
  const analytics = await getBusinessAnalytics(supabase, filters);

  return {
    businesses: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    filters: filterOptions,
    analytics,
    source: 'database'
  };
}

async function getFilterOptions(supabase: any) {
  try {
    // Get unique industries
    const { data: industries } = await supabase
      .from('companies')
      .select('industry')
      .not('industry', 'is', null)
      .eq('status', 'active');

    // Get unique locations/headquarters
    const { data: locations } = await supabase
      .from('companies')
      .select('headquarters')
      .not('headquarters', 'is', null)
      .eq('status', 'active');

    const uniqueIndustries = [...new Set((industries || []).map((item: any) => item.industry))].sort();
    const uniqueLocations = [...new Set((locations || []).map((item: any) => item.headquarters))].sort();

    return {
      industries: uniqueIndustries,
      locations: uniqueLocations,
      neighborhoods: uniqueLocations, // Alias for compatibility
      businessTypes: uniqueIndustries, // Alias for compatibility
      clusters: [] // Will be populated when cluster data is added
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      industries: [],
      locations: [],
      neighborhoods: [],
      businessTypes: [],
      clusters: []
    };
  }
}

async function getBusinessAnalytics(supabase: any, filters: any = {}) {
  try {
    // Build base query for analytics
    let analyticsQuery = supabase
      .from('companies')
      .select('industry, revenue, employees_count, founded_year')
      .eq('status', 'active');

    // Apply same filters as main query for consistent analytics
    if (filters.industry && filters.industry.length > 0) {
      const industryConditions = filters.industry
        .map((ind: string) => `industry.ilike.%${ind}%`)
        .join(',');
      analyticsQuery = analyticsQuery.or(industryConditions);
    }

    const { data: analyticsData } = await analyticsQuery;
    
    if (!analyticsData || analyticsData.length === 0) {
      return {
        totalCompanies: 0,
        totalRevenue: 0,
        totalEmployees: 0,
        averageRevenue: 0,
        averageEmployees: 0,
        topIndustries: [],
        revenueByIndustry: []
      };
    }

    // Calculate analytics
    const totalCompanies = analyticsData.length;
    const totalRevenue = analyticsData.reduce((sum: number, company: any) => sum + (company.revenue || 0), 0);
    const totalEmployees = analyticsData.reduce((sum: number, company: any) => sum + (company.employees_count || 0), 0);

    // Industry analytics
    const industryStats = analyticsData.reduce((acc: any, company: any) => {
      const industry = company.industry || 'Unknown';
      if (!acc[industry]) {
        acc[industry] = { count: 0, revenue: 0, employees: 0 };
      }
      acc[industry].count++;
      acc[industry].revenue += company.revenue || 0;
      acc[industry].employees += company.employees_count || 0;
      return acc;
    }, {});

    const topIndustries = Object.entries(industryStats)
      .map(([industry, stats]: [string, any]) => ({
        industry,
        count: stats.count,
        revenue: stats.revenue,
        employees: stats.employees
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCompanies,
      totalRevenue,
      totalEmployees,
      averageRevenue: totalCompanies > 0 ? totalRevenue / totalCompanies : 0,
      averageEmployees: totalCompanies > 0 ? totalEmployees / totalCompanies : 0,
      topIndustries,
      revenueByIndustry: topIndustries.map(item => ({
        industry: item.industry,
        revenue: item.revenue
      }))
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return {
      totalCompanies: 0,
      totalRevenue: 0,
      totalEmployees: 0,
      averageRevenue: 0,
      averageEmployees: 0,
      topIndustries: [],
      revenueByIndustry: []
    };
  }
}