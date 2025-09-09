import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient } from './openai-singleton.js';
import { BusinessService } from '../src/core/services/BusinessService.js';
import { AIBusinessService } from '../src/core/services/AIBusinessService.js';
import { AIConversationService } from '../src/core/services/AIConversationService.js';
import { EmbeddingService } from '../src/core/services/EmbeddingService.js';
import { SupabaseBusinessRepository } from '../src/infrastructure/repositories/SupabaseBusinessRepository.js';
import { SupabaseAIConversationRepository } from '../src/infrastructure/repositories/SupabaseAIConversationRepository.js';

/**
 * Centralized service initialization for API endpoints
 * Ensures consistent configuration and reduces boilerplate code
 */

/**
 * Create Supabase client with service role key for server-side operations
 * Uses consistent environment variable naming
 */
function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('SUPABASE_URL environment variable is required');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  return createClient(url, serviceRoleKey);
}

/**
 * Initialize business-related services (most common pattern)
 * Returns: BusinessService + AIBusinessService with shared repository
 */
export function createBusinessServices() {
  const supabase = createSupabaseClient();
  const openai = getOpenAIClient();
  const repository = new SupabaseBusinessRepository(supabase);
  
  return {
    supabase,
    openai,
    repository,
    businessService: new BusinessService(repository),
    aiBusinessService: new AIBusinessService(repository, openai),
  };
}

/**
 * Initialize AI conversation services
 * Returns: AIConversationService with repository
 */
export function createConversationServices() {
  const supabase = createSupabaseClient();
  const openai = getOpenAIClient();
  const repository = new SupabaseAIConversationRepository(supabase);
  
  return {
    supabase,
    openai,
    repository,
    conversationService: new AIConversationService(repository, openai),
  };
}

/**
 * Initialize embedding services
 * Returns: EmbeddingService with business repository
 */
export function createEmbeddingServices() {
  const supabase = createSupabaseClient();
  const openai = getOpenAIClient();
  const repository = new SupabaseBusinessRepository(supabase);
  
  return {
    supabase,
    openai,
    repository,
    embeddingService: new EmbeddingService(repository, openai),
  };
}

/**
 * Initialize full service suite (business + conversations)
 * Returns: All services with shared clients
 */
export function createFullServices() {
  const supabase = createSupabaseClient();
  const openai = getOpenAIClient();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const conversationRepository = new SupabaseAIConversationRepository(supabase);
  
  return {
    supabase,
    openai,
    businessRepository,
    conversationRepository,
    businessService: new BusinessService(businessRepository),
    aiBusinessService: new AIBusinessService(businessRepository, openai),
    conversationService: new AIConversationService(conversationRepository, openai),
    embeddingService: new EmbeddingService(businessRepository, openai),
  };
}

/**
 * Initialize basic Supabase + OpenAI clients only
 * For APIs that don't need full service layer
 */
export function createBaseClients() {
  const supabase = createSupabaseClient();
  const openai = getOpenAIClient();
  
  return {
    supabase,
    openai,
  };
}