import { NextRequest, NextResponse } from 'next/server';
import { chatAI } from '@/lib/ai';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY;

async function chatAIVision(imageData: string): Promise<{ content: string; provider: string; error?: string }> {
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image and identify any factual claims that can be verified.' },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }],
          max_tokens: 1000
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, provider: 'openai' };
      }
      if (data.error?.code) {
        console.log('OpenAI vision error:', data.error.message);
      }
    } catch (err) {
      console.error('OpenAI vision error:', err);
    }
  }

  if (OPENROUTER_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://emitterswebsite.com',
          'X-Title': 'EmittersWebsite'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageData } },
              { type: 'text', text: 'Describe this image and identify any factual claims that can be verified.' }
            ]
          }],
          max_tokens: 1000
        })
      });
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      const content = msg?.content || msg?.reasoning_details?.[0]?.text || '';
      if (content) {
        return { content, provider: 'openrouter' };
      }
      return { content: '', provider: 'openrouter', error: data.error?.message || 'OpenRouter vision failed' };
    } catch (err) {
      return { content: '', provider: 'openrouter', error: String(err) };
    }
  }

  return { content: '', provider: 'openai', error: 'Vision not available' };
}

export async function POST(request: NextRequest) {
  try {
    const { content, type = 'text' } = await request.json();
    
    let result: { content: string; provider: string; error?: string };
    
    if (type === 'image') {
      result = await chatAIVision(content);
      console.log('Vision result:', result);
      
      if (result.error || !result.content) {
        console.error('Vision failed:', result.error);
        return NextResponse.json({ 
          error: result.error || 'Image analysis failed', 
          provider: result.provider,
          isImageError: true 
        }, { status: 500 });
      }
      const jsonPrompt = `Based on this image analysis, determine if there are any factual claims and provide a JSON verdict.
      
Image description: "${result.content}"

Respond ONLY in this exact JSON format:
{"verdict": "true|false|uncertain|mixed", "summary": "Brief summary here", "reasoning": "Reasoning here", "confidence": 85, "sources": []}`;
      result = await chatAI(jsonPrompt);
    } else {
      const prompt = `You are a fact-checking AI. Analyze the claim below and determine if it's TRUE, FALSE, UNCERTAIN, or MIXED.
         
Claim: "${content}"

Respond ONLY in this exact JSON format (no extra text):
{"verdict": "true|false|uncertain|mixed", "summary": "Brief summary here", "reasoning": "Reasoning here", "confidence": 85, "sources": ["source1", "source2"]}`;
      result = await chatAI(prompt);
    }
    console.log('AI result:', result);
    
    if (result.error) {
      return NextResponse.json({ error: result.error, provider: result.provider }, { status: 500 });
    }
    
    let jsonStr = result.content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();
    
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({ ...parsed, provider: result.provider });
  } catch (err) {
    console.error('Factcheck error:', err);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}