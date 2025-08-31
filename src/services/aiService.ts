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
    // Use the enhanced endpoint for better context-aware responses
    const res = await fetch('/api/ai-chat-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: req.messages,
        model: req.model || 'gpt-4o-mini',
        temperature: req.temperature || 0.7,
        sessionId: `session-${Date.now()}`, // Generate a session ID for tracking
        saveToDatabase: false // Don't save to DB for now to avoid clutter
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      
      // Check if it's an auth redirect (Vercel protection)
      if (detail.includes('Authentication Required') || detail.includes('Vercel Authentication')) {
        throw new Error('API endpoint requires authentication. Please check deployment settings.');
      }
      
      // Fallback to basic endpoint if enhanced fails
      console.warn('Enhanced API failed, falling back to basic endpoint');
      const fallbackRes = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      
      if (!fallbackRes.ok) {
        const fallbackDetail = await fallbackRes.text().catch(() => '')
        throw new Error(`Chat request failed: ${fallbackRes.status} ${fallbackDetail.substring(0, 200)}`)
      }
      
      const fallbackData = (await fallbackRes.json()) as { content?: string }
      return fallbackData.content ?? ''
    }

    const data = (await res.json()) as { content?: string }
    return data.content ?? ''
  } catch (error) {
    throw error;
  }
}

