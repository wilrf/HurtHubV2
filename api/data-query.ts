import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessServices } from '../lib/api-bootstrap';

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, type, filters } = req.body;
    
    // Initialize services using bootstrap utility
    const { businessService } = createBusinessServices();
    
    let results: any = {};
    
    switch (type) {
      case 'businesses':
      case 'companies': // Legacy support
        const searchResult = await businessService.searchBusinesses(query, filters);
        results.businesses = searchResult.businesses.map(b => b.toJSON());
        results.analytics = searchResult.analytics;
        break;
        
      case 'industry':
        const industryBusinesses = await businessService.getBusinessesByIndustry(query);
        results.businesses = industryBusinesses.map(b => b.toJSON());
        break;
        
      case 'location':
        const locationBusinesses = await businessService.getBusinessesByLocation(
          filters?.city,
          filters?.state,
          filters?.neighborhood
        );
        results.businesses = locationBusinesses.map(b => b.toJSON());
        break;
        
      case 'top-performers':
        const metric = filters?.metric || 'revenue';
        const topBusinesses = await businessService.getTopPerformers(metric, 10);
        results.businesses = topBusinesses.map(b => b.toJSON());
        break;
        
      default:
        // General search
        const generalResult = await businessService.searchBusinesses(query, filters);
        results.businesses = generalResult.businesses.map(b => b.toJSON());
        results.totalCount = generalResult.totalCount;
    }
    
    return res.status(200).json({
      success: true,
      query,
      type,
      data: results,
      timestamp: new Date().toISOString(),
      metadata: {
        queryType: type,
        filters,
        resultCount: results.businesses?.length || 0,
      },
    });
    
  } catch (error) {
    console.error('Data Query Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Query failed',
    });
  }
}