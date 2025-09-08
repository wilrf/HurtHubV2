import type OpenAI from 'openai';
import type { AIConversationRepository } from '../repositories/AIConversationRepository.js';
import { AIConversation, type ChatMessage, type ConversationMetadata } from '../domain/entities/AIConversation.js';

export class AIConversationService {
  constructor(
    private repository: AIConversationRepository,
    private openai: OpenAI,
  ) {}

  async storeConversation(
    sessionId: string,
    messages: ChatMessage[],
    metadata?: ConversationMetadata,
    userId?: string,
  ): Promise<AIConversation> {
    // Generate single embedding from all messages for semantic search
    const embedding = messages.length > 0 
      ? await this.generateConversationEmbedding(messages)
      : undefined;
    
    const conversation = AIConversation.createNew(
      sessionId,
      messages,
      userId,
      embedding,
      metadata,
    );

    return await this.repository.create(conversation);
  }

  async retrieveConversation(sessionId: string, limit?: number): Promise<{
    conversations: AIConversation[];
    messages: ChatMessage[];
    summary?: string;
  }> {
    const conversations = await this.repository.findBySessionId(sessionId, limit);
    
    // Flatten all messages from conversations
    const allMessages = conversations.flatMap(conv => conv.messages);
    
    return {
      conversations,
      messages: allMessages,
    };
  }

  async searchConversations(
    query: string,
    userId?: string,
    limit: number = 10,
  ): Promise<{
    results: Array<{
      conversation: AIConversation;
      similarity: number;
      relevance: number;
      context: string;
    }>;
    metadata: {
      searchStrategy: string;
      totalResults: number;
      queryTerms: string[];
    };
  }> {
    // Multi-strategy search approach
    const results: any[] = [];
    
    // Strategy 1: Semantic search using embeddings
    const queryEmbedding = await this.generateEmbedding(query);
    const semanticResults = await this.performSemanticSearch(queryEmbedding, userId, Math.ceil(limit / 2));
    results.push(...semanticResults);

    // Strategy 2: Keyword-based search
    const keywords = this.extractSearchTerms(query);
    const keywordResults = await this.performKeywordSearch(keywords, userId, Math.ceil(limit / 2));
    results.push(...keywordResults);

    // Strategy 3: Recent conversation search
    const recentResults = await this.performRecentSearch(userId, Math.ceil(limit / 3));
    results.push(...recentResults);

    // Remove duplicates and sort by relevance
    const uniqueResults = this.removeDuplicates(results)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return {
      results: uniqueResults,
      metadata: {
        searchStrategy: uniqueResults.length > 0 ? 'enhanced' : 'fallback',
        totalResults: uniqueResults.length,
        queryTerms: keywords,
      },
    };
  }

  async summarizeConversation(sessionId: string): Promise<{
    summary: string;
    keyTopics: string[];
    sentiment: string;
    messageCount: number;
  }> {
    const { messages } = await this.retrieveConversation(sessionId);
    
    if (messages.length === 0) {
      throw new Error('No messages found for session');
    }

    // Use OpenAI to generate comprehensive summary
    const summaryPrompt = `Analyze and summarize the following conversation. Provide:
    1. A concise summary of key points discussed
    2. Main topics and themes
    3. Action items or decisions made
    4. Overall sentiment and tone
    5. Unresolved questions or topics
    
    Conversation:
    ${JSON.stringify(messages, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing and summarizing conversations, extracting key insights and patterns.',
        },
        { role: 'user', content: summaryPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const summary = completion.choices[0]?.message?.content || '';

    return {
      summary,
      keyTopics: this.extractKeyTopics(summary),
      sentiment: this.analyzeSentiment(messages),
      messageCount: messages.length,
    };
  }

  // Private helper methods
  private async generateConversationEmbedding(messages: ChatMessage[]): Promise<number[]> {
    // Concatenate all messages into single text for embedding
    const fullText = messages.map(msg => msg.content).join(' ');
    return this.generateEmbedding(fullText);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return [];
    }
  }

  private async performSemanticSearch(
    queryEmbedding: number[],
    userId?: string,
    limit: number = 5,
  ) {
    const conversations = await this.repository.searchByEmbedding(queryEmbedding, userId, 100);
    
    return conversations
      .filter(conv => conv.embedding && conv.embedding.length > 0)
      .map(conv => {
        // Calculate similarity with the conversation embedding
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          conv.embedding || [],
        );
        const relevance = similarity * 0.8; // Weight semantic similarity

        return {
          conversation: conv,
          similarity,
          relevance,
          context: 'semantic',
          type: 'semantic',
        };
      })
      .filter(result => result.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async performKeywordSearch(
    keywords: string[],
    userId?: string,
    limit: number = 5,
  ) {
    const conversations = await this.repository.searchByKeywords(keywords, userId, 50);
    
    return conversations
      .map(conv => {
        const messageText = conv.getMessageText().toLowerCase();
        let relevance = 0;

        // Calculate keyword relevance
        keywords.forEach(keyword => {
          const count = (messageText.match(new RegExp(keyword, 'gi')) || []).length;
          relevance += count * 0.1;
        });

        // Boost recent conversations
        const daysSince = (Date.now() - conv.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        relevance += Math.max(0, 0.2 - daysSince * 0.01);

        return {
          conversation: conv,
          similarity: relevance,
          relevance,
          context: 'keyword',
          type: 'keyword',
        };
      })
      .filter(result => result.relevance > 0.05) // Minimum relevance threshold
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  private async performRecentSearch(userId?: string, limit: number = 3) {
    const conversations = await this.repository.findRecent(userId, limit * 2);
    
    return conversations.map(conv => ({
      conversation: conv,
      similarity: 0.5, // Base relevance for recent items
      relevance: 0.5,
      context: 'recent',
      type: 'recent',
    }));
  }

  private extractSearchTerms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .map(term => term.replace(/[^\w]/g, ''));
  }

  private removeDuplicates(results: any[]): any[] {
    const seen = new Set();
    return results.filter(item => {
      const key = `${item.conversation.sessionId}-${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private extractKeyTopics(summary: string): string[] {
    const topics: string[] = [];
    const patterns = [
      /discussed ([\w\s]+)/gi,
      /topics?: ([\w\s,]+)/gi,
      /about ([\w\s]+)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = summary.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          topics.push(match[1].trim());
        }
      }
    });

    return [...new Set(topics)].slice(0, 5);
  }

  private analyzeSentiment(messages: ChatMessage[]): string {
    const positiveWords = ['great', 'excellent', 'good', 'happy', 'success', 'positive'];
    const negativeWords = ['bad', 'poor', 'unhappy', 'fail', 'negative', 'problem'];

    const text = messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      positiveCount += (text.match(new RegExp(word, 'g')) || []).length;
    });

    negativeWords.forEach(word => {
      negativeCount += (text.match(new RegExp(word, 'g')) || []).length;
    });

    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'neutral';
  }
}