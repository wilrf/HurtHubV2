import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthCheck = await performDatabaseHealthCheck();

    return res.status(200).json({
      status: healthCheck.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: healthCheck.database,
      tables: healthCheck.tables,
      dataCounts: healthCheck.dataCounts,
      recommendations: healthCheck.recommendations
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to perform health check',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function performDatabaseHealthCheck() {
  const results = {
    healthy: true,
    database: {
      connected: false,
      latency: 0
    },
    tables: {
      companies: false,
      developments: false,
      economic_indicators: false,
      ai_conversations: false,
      ai_session_summaries: false
    },
    dataCounts: {
      companies: 0,
      developments: 0,
      economic_indicators: 0,
      ai_conversations: 0,
      ai_session_summaries: 0
    },
    recommendations: [] as string[]
  };

  const startTime = Date.now();

  try {
    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count', { count: 'exact', head: true });

    results.database.connected = !testError;
    results.database.latency = Date.now() - startTime;

    if (testError) {
      results.healthy = false;
      results.recommendations.push('Database connection failed. Check Supabase credentials.');
      return results;
    }

    // Check each table
    const tables = [
      { name: 'companies', table: 'companies' },
      { name: 'developments', table: 'developments' },
      { name: 'economic_indicators', table: 'economic_indicators' },
      { name: 'ai_conversations', table: 'ai_conversations' },
      { name: 'ai_session_summaries', table: 'ai_session_summaries' }
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.table)
          .select('*', { count: 'exact', head: true });

        results.tables[table.name as keyof typeof results.tables] = !error;
        results.dataCounts[table.name as keyof typeof results.dataCounts] = count || 0;

        if (error) {
          results.healthy = false;
          results.recommendations.push(`Table '${table.table}' is not accessible: ${error.message}`);
        }
      } catch (error: any) {
        results.tables[table.name as keyof typeof results.tables] = false;
        results.healthy = false;
        results.recommendations.push(`Failed to check table '${table.table}': ${error.message}`);
      }
    }

    // Generate recommendations based on data
    if (results.dataCounts.companies === 0) {
      results.recommendations.push('No companies found. Consider seeding the database with business data.');
    }

    if (results.dataCounts.ai_conversations === 0) {
      results.recommendations.push('No AI conversations found. This is normal for a new system.');
    }

    if (results.database.latency > 1000) {
      results.recommendations.push(`Database latency is high (${results.database.latency}ms). Consider optimizing queries or database location.`);
    }

    // Check if AI tables exist but are empty
    if (results.tables.ai_conversations && results.dataCounts.ai_conversations === 0) {
      results.recommendations.push('AI conversation tables exist but are empty. The AI will build context over time.');
    }

  } catch (error: any) {
    results.healthy = false;
    results.database.connected = false;
    results.recommendations.push(`Critical database error: ${error.message}`);
  }

  return results;
}
