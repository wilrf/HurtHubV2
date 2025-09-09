import type { SupabaseClient } from '@supabase/supabase-js';
import type { AIConversationRepository } from '../../core/repositories/AIConversationRepository.js';
import { AIConversation } from '../../core/domain/entities/AIConversation.js';

export class SupabaseAIConversationRepository implements AIConversationRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(conversation: AIConversation): Promise<AIConversation> {
    const insertData: any = {
      session_id: conversation.sessionId,
      user_id: conversation.userId,
      messages: conversation.messages,
      created_at: conversation.createdAt.toISOString(),
      metadata: conversation.metadata,
    };

    // Generate single embedding from all messages if present
    // Note: For now we're not generating embeddings here to avoid circular dependency
    // The service layer can handle embedding generation if needed
    
    const { data, error } = await this.supabase
      .from('ai_conversations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create AI conversation: ${error.message}`);
    }

    return AIConversation.fromDatabase(data);
  }

  async findBySessionId(sessionId: string, limit?: number): Promise<AIConversation[]> {
    let query = this.supabase
      .from('ai_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find conversations by session: ${error.message}`);
    }

    return data?.map(record => AIConversation.fromDatabase(record)) || [];
  }

  async findByUserId(userId: string, limit?: number): Promise<AIConversation[]> {
    let query = this.supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find conversations by user: ${error.message}`);
    }

    return data?.map(record => AIConversation.fromDatabase(record)) || [];
  }

  async searchByEmbedding(embedding: number[], userId?: string, limit: number = 10): Promise<AIConversation[]> {
    let query = this.supabase
      .from('ai_conversations')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      throw new Error(`Failed to search conversations: ${error.message}`);
    }

    return data?.map(record => AIConversation.fromDatabase(record)) || [];
  }

  async searchByKeywords(keywords: string[], userId?: string, limit: number = 10): Promise<AIConversation[]> {
    let query = this.supabase
      .from('ai_conversations')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      throw new Error(`Failed to search conversations by keywords: ${error.message}`);
    }

    return data?.map(record => AIConversation.fromDatabase(record)) || [];
  }

  async findRecent(userId?: string, limit: number = 10): Promise<AIConversation[]> {
    let query = this.supabase
      .from('ai_conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      throw new Error(`Failed to find recent conversations: ${error.message}`);
    }

    return data?.map(record => AIConversation.fromDatabase(record)) || [];
  }
}