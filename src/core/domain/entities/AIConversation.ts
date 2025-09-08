// Domain entity representing an AI Conversation
export class AIConversation {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly userId: string | null,
    public readonly messages: ChatMessage[],
    public readonly embedding: number[] | null,  // Changed from embeddings array
    public readonly metadata: ConversationMetadata | null,
    public readonly createdAt: Date,
  ) {}

  // Factory method to create from database record
  static fromDatabase(record: any): AIConversation {
    return new AIConversation(
      record.id,
      record.session_id,
      record.user_id,
      record.messages,
      record.embedding,  // Changed from embeddings
      record.metadata,
      new Date(record.created_at),
    );
  }

  // Factory method to create new conversation
  static createNew(
    sessionId: string,
    messages: ChatMessage[],
    userId?: string,
    embedding?: number[],  // Changed from embeddings array
    metadata?: ConversationMetadata,
  ): AIConversation {
    return new AIConversation(
      '', // Will be set by database
      sessionId,
      userId || null,
      messages,
      embedding || null,  // Changed from embeddings
      metadata || null,
      new Date(),
    );
  }

  // Get all message content as text for searching
  getMessageText(): string {
    return this.messages
      .map(msg => msg.content)
      .join(' ');
  }

  // Get conversation length
  getMessageCount(): number {
    return this.messages.length;
  }

  // Convert to JSON for API responses
  toJSON(): any {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      messages: this.messages,
      embedding: this.embedding,  // Changed from embeddings
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      messageCount: this.getMessageCount(),
    };
  }
}

// Supporting types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ConversationMetadata {
  module?: string;
  model?: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created_via?: string;
  message_count?: number;
  last_interaction?: string;
}