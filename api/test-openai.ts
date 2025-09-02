import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'No API key found' });
  }
  
  // Check for newlines or doubling
  const hasNewline = apiKey.includes('\n');
  const trimmedKey = apiKey.trim();
  
  // Inline validation
  const isProjectKey = trimmedKey.startsWith('sk-proj-');
  const expectedLength = isProjectKey ? 164 : 51;
  
  try {
    const openai = new OpenAI({ 
      apiKey: trimmedKey,
      maxRetries: 3,
      timeout: 30000 
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say OK in one word' }],
      max_tokens: 5
    });
    
    return res.status(200).json({
      success: true,
      response: completion.choices[0]?.message?.content,
      keyInfo: {
        originalLength: apiKey.length,
        trimmedLength: trimmedKey.length,
        hasNewline,
        startsCorrectly: trimmedKey.startsWith('sk-'),
        isProjectKey,
        expectedLength,
        lengthValid: trimmedKey.length === expectedLength
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      keyInfo: {
        originalLength: apiKey.length,
        trimmedLength: trimmedKey.length,
        hasNewline,
        firstChars: apiKey.substring(0, 30),
        lastChars: apiKey.substring(apiKey.length - 30)
      }
    });
  }
}