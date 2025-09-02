import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return res.status(200).json({
    hasOpenAI: !!openaiKey,
    openAIKeyLength: openaiKey?.length || 0,
    openAIKeyStart: openaiKey?.substring(0, 20) || 'missing',
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
  });
}