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
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Initialize services using bootstrap utility
    const { aiBusinessService } = createBusinessServices();
    
    // Perform semantic search using service
    const businesses = await aiBusinessService.performSemanticSearch(query, limit);
    
    return res.status(200).json({
      success: true,
      query,
      results: businesses.map(b => b.toJSON()),
      count: businesses.length,
    });
    
  } catch (error) {
    console.error('AI Search Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Semantic search failed',
    });
  }
}