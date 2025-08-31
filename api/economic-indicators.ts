import { createClient } from '@supabase/supabase-js'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { current, days = 30 } = req.query
        
        if (current) {
          // Get most recent indicators
          const { data, error } = await supabase
            .from('economic_indicators')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .single()
          
          if (error) throw error
          return res.status(200).json(data)
        }
        
        // Get historical indicators
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - Number(days))
        
        const { data, error } = await supabase
          .from('economic_indicators')
          .select('*')
          .gte('date', startDate.toISOString())
          .order('date', { ascending: true })
        
        if (error) throw error
        return res.status(200).json(data)
      }
      
      case 'POST': {
        // Add new indicators (admin only)
        const { data, error } = await supabase
          .from('economic_indicators')
          .insert(req.body)
          .select()
          .single()
        
        if (error) throw error
        return res.status(201).json(data)
      }
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    })
  }
}