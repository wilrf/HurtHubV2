import type OpenAI from 'openai';
import type { IBusinessRepository } from '../repositories/IBusinessRepository.js';
import type { Business } from '../domain/entities/Business.js';

export class EmbeddingService {
  constructor(
    private businessRepository: IBusinessRepository,
    private openai: OpenAI,
  ) {}

  async generateBusinessEmbeddings(): Promise<{
    processed: number;
    errors: number;
    total: number;
  }> {
    // Get all businesses
    const businesses = await this.businessRepository.findAll(1000);
    
    let processed = 0;
    let errors = 0;
    
    // Generate embeddings for each business
    for (const business of businesses) {
      try {
        // Create text representation for embedding
        const text = this.createBusinessText(business);
        
        // Generate embedding
        const embedding = await this.generateEmbedding(text);
        
        // Update business with embedding through repository
        await this.businessRepository.updateEmbedding(business.id, embedding);
        
        processed++;
        
      } catch (err) {
        console.error(`Failed to generate embedding for ${business.id}:`, err);
        errors++;
      }
    }
    
    return {
      processed,
      errors,
      total: businesses.length,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createBusinessText(business: Business): string {
    const parts = [
      business.name,
      business.industry || '',
      business.neighborhood || '',
      business.city,
      business.state || 'NC',
    ].filter(Boolean);
    
    return parts.join(' ');
  }
}