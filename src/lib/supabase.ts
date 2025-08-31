import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper functions for common operations
export const supabaseAdmin = {
  // Companies operations
  companies: {
    async getAll() {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async search(query: string) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .or(`name.ilike.%${query}%,industry.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20)
      
      if (error) throw error
      return data
    }
  },
  
  // Developments/News operations
  developments: {
    async getRecent(limit = 10) {
      const { data, error } = await supabase
        .from('developments')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    },
    
    async getByCompany(companyId: string) {
      const { data, error } = await supabase
        .from('developments')
        .select('*')
        .eq('company_id', companyId)
        .order('published_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  },
  
  // Economic indicators
  indicators: {
    async getCurrent() {
      const { data, error } = await supabase
        .from('economic_indicators')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getHistorical(days = 30) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('economic_indicators')
        .select('*')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true })
      
      if (error) throw error
      return data
    }
  },
  
  // Chat sessions for AI
  chat: {
    async createSession(userId?: string) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          started_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    async getSessionHistory(sessionId: string) {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    }
  }
}