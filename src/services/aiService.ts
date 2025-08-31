export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
}

export async function createChatCompletion(req: ChatRequest): Promise<string> {
  try {
    const res = await fetch('/api/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      
      // Check if it's an auth redirect (Vercel protection)
      if (detail.includes('Authentication Required') || detail.includes('Vercel Authentication')) {
        throw new Error('API endpoint requires authentication. Please check deployment settings.');
      }
      
      throw new Error(`Chat request failed: ${res.status} ${detail.substring(0, 200)}`)
    }

    const data = (await res.json()) as { content?: string }
    return data.content ?? ''
  } catch (error) {
    throw error;
  }
}

