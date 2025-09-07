import { VercelRequest, VercelResponse } from '@vercel/node';
import { createEmbeddingServices } from '../lib/api-bootstrap';

export const config = {
  maxDuration: 300, // 5 minutes for embedding generation
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
    // This is an admin endpoint - should have authentication in production
    const { adminKey } = req.body;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Initialize services using bootstrap utility
    const { embeddingService } = createEmbeddingServices();
    
    // Generate embeddings for all businesses using service
    const result = await embeddingService.generateBusinessEmbeddings();
    
    return res.status(200).json({
      success: true,
      message: 'Embeddings generated',
      processed: result.processed,
      errors: result.errors,
      total: result.total,
    });
    
  } catch (error) {
    console.error('Generate Embeddings Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate embeddings',
    });
  }
}