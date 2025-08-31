// Vercel Serverless Function: Secure OpenAI proxy
// Expects process.env.OPENAI_API_KEY (do NOT expose in client)

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS for local dev and browser requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' })
  }

  try {
    const { messages, model = 'gpt-4o-mini', temperature = 0.2 } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages array' })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return res.status(response.status).json({ error: 'OpenAI error', detail: errText })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ content })
  } catch (err) {
    return res.status(500).json({ error: 'Unexpected server error', detail: err?.message })
  }
}

