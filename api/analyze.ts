import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required but not found in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export const config = {
  maxDuration: 120, // Extended for deep analysis
};

interface AnalysisRequest {
  type: 'code' | 'business' | 'market' | 'competitive';
  data: any;
  depth: 'quick' | 'standard' | 'deep';
  context?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data, depth = 'standard', context } = req.body as AnalysisRequest;

    const systemPrompt = getAnalysisPrompt(type, depth);
    const userPrompt = formatDataForAnalysis(type, data, context);

    // Use GPT-5 with extended reasoning for deep analysis
    const model = depth === 'deep' ? 'gpt-5-pro' : 'gpt-5';
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: depth === 'deep' ? 0.3 : 0.5, // Lower temperature for deeper analysis
      max_tokens: depth === 'deep' ? 12000 : 6000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const analysis = completion.choices[0]?.message?.content || '';

    // Parse structured insights from the analysis
    const insights = extractInsights(analysis, type);

    return res.status(200).json({
      analysis,
      insights,
      metadata: {
        type,
        depth,
        model: completion.model,
        tokens: completion.usage,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Analysis API Error:', error);
    return res.status(500).json({
      error: 'Failed to perform analysis',
      details: error.message,
    });
  }
}

function getAnalysisPrompt(type: 'code' | 'business' | 'market' | 'competitive', depth: 'quick' | 'standard' | 'deep'): string {
  const basePrompt = `You are GPT-5, an advanced AI with superior reasoning and analytical capabilities. 
  Perform a ${depth} analysis with the following characteristics:`;

  const depthGuidelines: Record<'quick' | 'standard' | 'deep', string> = {
    quick: 'Provide key insights and immediate actionable recommendations.',
    standard: 'Deliver comprehensive analysis with supporting data and strategic recommendations.',
    deep: 'Conduct exhaustive analysis using advanced reasoning, identify hidden patterns, predict future trends, and provide detailed strategic roadmap.'
  };

  const typePrompts: Record<'code' | 'business' | 'market' | 'competitive', string> = {
    code: `${basePrompt} ${depthGuidelines[depth]}
    
    Analyze the code for:
    - Architecture and design patterns
    - Performance bottlenecks and optimization opportunities
    - Security vulnerabilities and best practices
    - Scalability considerations
    - Technical debt and refactoring opportunities
    - Integration points and API design`,
    
    business: `${basePrompt} ${depthGuidelines[depth]}
    
    Analyze the business data for:
    - Revenue trends and growth patterns
    - Operational efficiency metrics
    - Market positioning and competitive advantages
    - Risk factors and mitigation strategies
    - Expansion opportunities
    - Strategic partnerships and synergies`,
    
    market: `${basePrompt} ${depthGuidelines[depth]}
    
    Analyze the market for:
    - Industry trends and disruptions
    - Market size and growth potential
    - Customer segments and behavior patterns
    - Competitive landscape dynamics
    - Regulatory impacts and compliance
    - Emerging opportunities and threats`,
    
    competitive: `${basePrompt} ${depthGuidelines[depth]}
    
    Perform competitive intelligence analysis:
    - Competitor strengths and weaknesses
    - Market share and positioning
    - Strategic moves and patterns
    - Innovation and R&D focus
    - Customer satisfaction and loyalty
    - Potential competitive responses`
  };

  return typePrompts[type];
}

function formatDataForAnalysis(type: string, data: any, context?: string): string {
  let formatted = `Analyze the following ${type} data:\n\n`;
  
  if (typeof data === 'object') {
    formatted += JSON.stringify(data, null, 2);
  } else {
    formatted += data.toString();
  }
  
  if (context) {
    formatted += `\n\nAdditional Context:\n${context}`;
  }
  
  formatted += '\n\nProvide structured analysis with clear sections for findings, insights, and recommendations.';
  
  return formatted;
}

function extractInsights(analysis: string, type: string): any {
  // Extract structured insights from the analysis
  const insights = {
    keyFindings: [] as string[],
    recommendations: [] as string[],
    risks: [] as string[],
    opportunities: [] as string[],
    metrics: {} as Record<string, any>,
    priority: 'medium' as string,
  };

  // Parse sections from the analysis
  const sections = analysis.split(/\n(?=[A-Z])/);
  
  sections.forEach(section => {
    if (section.includes('Finding') || section.includes('Key')) {
      insights.keyFindings.push(section.trim());
    }
    if (section.includes('Recommend')) {
      insights.recommendations.push(section.trim());
    }
    if (section.includes('Risk')) {
      insights.risks.push(section.trim());
    }
    if (section.includes('Opportunit')) {
      insights.opportunities.push(section.trim());
    }
  });

  // Determine priority based on content
  if (analysis.includes('critical') || analysis.includes('urgent')) {
    insights.priority = 'high';
  } else if (analysis.includes('low priority') || analysis.includes('minor')) {
    insights.priority = 'low';
  }

  return insights;
}