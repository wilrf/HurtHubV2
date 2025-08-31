import { createClient } from '@supabase/supabase-js'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { id, search, limit = 20 } = req.query
        
        if (id) {
          // Get single company
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) throw error
          return res.status(200).json(data)
        }
        
        if (search) {
          // Search companies
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .or(`name.ilike.%${search}%,industry.ilike.%${search}%,description.ilike.%${search}%`)
            .limit(Number(limit))
          
          if (error) throw error
          return res.status(200).json(data)
        }
        
        // Get all companies
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(Number(limit))
        
        if (error) throw error
        return res.status(200).json(data)
      }
      
      case 'POST': {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert(req.body)
          .select()
          .single()
        
        if (error) throw error
        return res.status(201).json(data)
      }
      
      case 'PUT': {
        // Update company
        const { id } = req.query
        if (!id) {
          return res.status(400).json({ error: 'Company ID required' })
        }
        
        const { data, error } = await supabase
          .from('companies')
          .update(req.body)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        return res.status(200).json(data)
      }
      
      case 'DELETE': {
        // Delete company
        const { id } = req.query
        if (!id) {
          return res.status(400).json({ error: 'Company ID required' })
        }
        
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        return res.status(204).end()
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