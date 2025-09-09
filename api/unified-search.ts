import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessServices } from '../lib/api-bootstrap.js';

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
    const { query, useAI = false, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Initialize services using bootstrap utility
    const { businessService, aiBusinessService } = createBusinessServices();
    
    let results;
    
    if (useAI) {
      // Use AI service for semantic search
      const businesses = await aiBusinessService.performSemanticSearch(query);
      results = {
        businesses: businesses.map(b => b.toJSON()),
        searchType: 'semantic',
      };
    } else {
      // Use regular business service
      const searchResult = await businessService.searchBusinesses(query, filters);
      results = {
        businesses: searchResult.businesses.map(b => b.toJSON()),
        totalCount: searchResult.totalCount,
        analytics: searchResult.analytics,
        searchType: 'structured',
      };
    }
    
    return res.status(200).json({
      success: true,
      query,
      ...results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Unified Search Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
}