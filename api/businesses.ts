import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessServices } from '../lib/api-bootstrap';

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize services using bootstrap utility
    const { businessService } = createBusinessServices();
    
    // Parse query parameters
    const { 
      search, 
      query,
      industry, 
      location, 
      minEmployees, 
      maxEmployees,
      minRevenue,
      maxRevenue,
      limit = 100,
      page = 1
    } = req.method === 'GET' ? req.query : req.body;
    
    // Build filters from query params
    const filters = {
      industry: industry ? (Array.isArray(industry) ? industry : [industry as string]) : undefined,
      location: location ? { 
        city: location as string 
      } : undefined,
      employeeRange: (minEmployees || maxEmployees) ? {
        min: minEmployees ? parseInt(minEmployees as string) : undefined,
        max: maxEmployees ? parseInt(maxEmployees as string) : undefined,
      } : undefined,
      revenueRange: (minRevenue || maxRevenue) ? {
        min: minRevenue ? parseFloat(minRevenue as string) : undefined,
        max: maxRevenue ? parseFloat(maxRevenue as string) : undefined,
      } : undefined,
    };
    
    // Use service for business logic
    const searchQuery = (search || query || '') as string;
    const result = await businessService.searchBusinesses(searchQuery, filters);
    
    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const paginatedBusinesses = result.businesses.slice(offset, offset + limitNum);
    
    // Return response
    return res.status(200).json({
      success: true,
      businesses: paginatedBusinesses.map(b => b.toJSON()),
      total: result.totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.totalCount / limitNum),
      analytics: result.analytics,
      source: 'repository',
    });
    
  } catch (error) {
    // Let error bubble - no business logic here
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}