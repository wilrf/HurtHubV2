import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessServices } from '../lib/api-bootstrap';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize services
    const { repository } = createBusinessServices();
    
    // Simple health checks
    const startTime = Date.now();
    const count = await repository.getTotalCount();
    const latency = Date.now() - startTime;
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latency,
      },
      businessCount: count,
      architecture: 'Repository Pattern + Domain-Driven Design',
    });
    
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}