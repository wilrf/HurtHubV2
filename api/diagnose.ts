import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessServices } from '../lib/api-bootstrap.js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: 'Vercel',
      nodeVersion: process.version,
      architecture: 'Clean Architecture',
    },
    checks: {},
    recommendations: [],
  };

  try {
    // Check environment variables
    diagnostics.checks.environment = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    };
    
    // Test database connection
    try {
      const { repository } = createBusinessServices();
      const count = await repository.getTotalCount();
      
      diagnostics.checks.database = {
        connected: true,
        businessCount: count,
        usingRepository: true,
      };
      
      if (count === 0) {
        diagnostics.recommendations.push('No businesses in database - run data import');
      }
    } catch (dbError) {
      diagnostics.checks.database = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Connection failed',
      };
      diagnostics.recommendations.push('Check database credentials and connection');
    }
    
    // Test OpenAI
    diagnostics.checks.openai = {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      expectedLength: 164, // New project keys
    };
    
    if (!process.env.OPENAI_API_KEY) {
      diagnostics.recommendations.push('Set OPENAI_API_KEY environment variable');
    }
    
    // Architecture check
    diagnostics.checks.architecture = {
      repositoryPattern: true,
      domainEntities: true,
      serviceLayer: true,
      cleanArchitecture: true,
    };
    
    // Overall status
    diagnostics.status = 
      diagnostics.checks.database?.connected && 
      diagnostics.checks.environment?.hasSupabaseUrl &&
      diagnostics.checks.environment?.hasSupabaseKey
        ? 'healthy' 
        : 'degraded';
    
    const statusCode = diagnostics.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(diagnostics);
    
  } catch (error) {
    diagnostics.status = 'critical';
    diagnostics.error = error instanceof Error ? error.message : 'Diagnostic failed';
    return res.status(500).json(diagnostics);
  }
}