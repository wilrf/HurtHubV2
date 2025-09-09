import type { AIConversation } from '../domain/entities/AIConversation';

export interface AIConversationRepository {
  create(conversation: AIConversation): Promise<AIConversation>;
  findBySessionId(sessionId: string, limit?: number): Promise<AIConversation[]>;
  findByUserId(userId: string, limit?: number): Promise<AIConversation[]>;
  searchByEmbedding(embedding: number[], userId?: string, limit?: number): Promise<AIConversation[]>;
  searchByKeywords(keywords: string[], userId?: string, limit?: number): Promise<AIConversation[]>;
  findRecent(userId?: string, limit?: number): Promise<AIConversation[]>;
}