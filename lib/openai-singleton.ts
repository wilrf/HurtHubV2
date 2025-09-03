import OpenAI from 'openai';

/**
 * Singleton pattern for OpenAI client initialization
 * This ensures environment variables are loaded before initialization
 * and provides consistent error handling across the application
 */

let cachedClient: OpenAI | null = null;

/**
 * Get or create the OpenAI client instance
 * Uses lazy initialization to ensure environment variables are available
 * @throws {Error} If OPENAI_API_KEY is not configured or invalid
 */
export function getOpenAIClient(): OpenAI {
  // Lazy initialization ensures env vars are loaded
  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured in environment variables');
    }
    
    // Validate expected format
    if (!apiKey.startsWith('sk-')) {
      throw new Error(`Invalid OpenAI key format: key should start with 'sk-' but starts with '${apiKey.substring(0, 3)}'`);
    }
    
    // Check for project key vs legacy key
    const isProjectKey = apiKey.startsWith('sk-proj-');
    const expectedLength = isProjectKey ? 164 : 51;
    
    // Log diagnostics (never the actual key)
    console.log('OpenAI Client Initialization:', {
      keyLength: apiKey.length,
      expectedLength,
      isProjectKey,
      lengthValid: apiKey.length === expectedLength,
      keyPrefix: apiKey.substring(0, 12) + '...'
    });
    
    // Warn if key length is unexpected but don't fail
    // (OpenAI may change key lengths in the future)
    if (apiKey.length !== expectedLength) {
      console.warn(`OpenAI key length (${apiKey.length}) differs from expected (${expectedLength})`);
    }
    
    // Create the client with validated key
    cachedClient = new OpenAI({ 
      apiKey,
      maxRetries: 3,
      timeout: 30000 // 30 second timeout
    });
  }
  
  return cachedClient;
}

/**
 * Reset the cached client (useful for testing or key rotation)
 */
export function resetOpenAIClient(): void {
  cachedClient = null;
}

/**
 * Validate OpenAI configuration without making an API call
 * @returns {object} Validation result with details
 */
export function validateOpenAIConfig(): {
  isValid: boolean;
  hasKey: boolean;
  keyLength: number;
  isProjectKey: boolean;
  expectedLength: number;
  error?: string;
} {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      return {
        isValid: false,
        hasKey: false,
        keyLength: 0,
        isProjectKey: false,
        expectedLength: 164,
        error: 'OPENAI_API_KEY not found in environment'
      };
    }
    
    const isProjectKey = apiKey.startsWith('sk-proj-');
    const expectedLength = isProjectKey ? 164 : 51;
    
    if (!apiKey.startsWith('sk-')) {
      return {
        isValid: false,
        hasKey: true,
        keyLength: apiKey.length,
        isProjectKey: false,
        expectedLength,
        error: 'Invalid key format - must start with sk-'
      };
    }
    
    return {
      isValid: true,
      hasKey: true,
      keyLength: apiKey.length,
      isProjectKey,
      expectedLength
    };
  } catch (error: any) {
    return {
      isValid: false,
      hasKey: false,
      keyLength: 0,
      isProjectKey: false,
      expectedLength: 164,
      error: error.message
    };
  }
}

/**
 * Test OpenAI connection with a simple API call
 * @returns {Promise<object>} Connection test result
 */
export async function testOpenAIConnection(): Promise<{
  success: boolean;
  response?: string;
  model?: string;
  error?: string;
}> {
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say OK in one word' }],
      max_tokens: 5
    });
    
    return {
      success: true,
      response: completion.choices[0]?.message?.content || 'OK',
      model: completion.model
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

