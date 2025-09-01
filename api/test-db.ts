import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Test which environment variables are available
  const envCheck = {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SUPABASE_URL: !!process.env.SUPABASE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Try to connect with available credentials
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.SUPABASE_SUPABASE_URL || 
                      'https://osnbklmavnsxpgktdeun.supabase.co';
  
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
                      process.env.SUPABASE_ANON_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  let dbTest = {
    connected: false,
    companyCount: 0,
    error: null as any,
    usedUrl: supabaseUrl.substring(0, 30) + '...',
    usedKeyType: supabaseKey.includes('service_role') ? 'service_role' : 'anon',
    keyPrefix: supabaseKey.substring(0, 20) + '...'
  };

  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connection
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      dbTest.error = error.message;
    } else {
      dbTest.connected = true;
      dbTest.companyCount = count || 0;
    }

    // Get sample companies
    const { data: samples } = await supabase
      .from('companies')
      .select('name, industry')
      .limit(3);

    return res.status(200).json({
      status: dbTest.connected ? 'connected' : 'failed',
      environment: envCheck,
      database: dbTest,
      sampleCompanies: samples || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      environment: envCheck,
      database: dbTest,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}