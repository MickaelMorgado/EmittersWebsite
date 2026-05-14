import { NextRequest, NextResponse } from 'next/server';
import { chatAI } from '@/lib/ai';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_KEY;
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
    console.log('[factcheck] Starting fact-check request...');
    const { content, type = 'text' } = await request.json();
    console.log('[factcheck] Content type:', type, 'Content length:', content.length);

    let result: { content: string; provider: string; error?: string };

    if (type === 'image') {
      console.log('[factcheck] Processing image...');
      result = await chatAIVision(content);
      console.log('[factcheck] Vision result:', { provider: result.provider, hasContent: !!result.content, error: result.error });

      if (result.error || !result.content) {
        console.error('[factcheck] Vision failed:', result.error);
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
      console.log('[factcheck] Sending image analysis to chatAI...');
      result = await chatAI(jsonPrompt);
    } else {
      const isYoutube = type === 'youtube';
      const prompt = isYoutube
        ? `You are a fact-checking AI. Analyze the video TRANSCRIPT below for factual claims and determine if they're TRUE, FALSE, UNCERTAIN, or MIXED.

VIDEO TRANSCRIPT:
"${content}"

Analyze the claims in this transcript. Look for specific factual statements that can be verified. For sources, provide ONLY actual web URLs (https://...) or leave the sources array empty if no URLs can be verified.

Respond ONLY in this exact JSON format (no extra text):
{"verdict": "true|false|uncertain|mixed", "summary": "Brief summary here", "reasoning": "Reasoning here", "confidence": 85, "sources": ["https://example.com", "https://another-source.com"]}`
        : `You are a fact-checking AI. Analyze the claim below and determine if it's TRUE, FALSE, UNCERTAIN, or MIXED.

Claim: "${content}"

For sources, provide ONLY actual web URLs (https://...) or leave the sources array empty if no URLs can be verified.

Respond ONLY in this exact JSON format (no extra text):
{"verdict": "true|false|uncertain|mixed", "summary": "Brief summary here", "reasoning": "Reasoning here", "confidence": 85, "sources": ["https://example.com", "https://another-source.com"]}`;

      console.log('[factcheck] Sending to chatAI, type:', isYoutube ? 'youtube' : 'text');
      result = await chatAI(prompt);
    }

    console.log('[factcheck] AI result:', { provider: result.provider, hasContent: !!result.content, hasError: !!result.error });

    if (result.error) {
      console.error('[factcheck] AI error:', result.error);
      return NextResponse.json({
        error: `AI failed (${result.provider}): ${result.error}`,
        provider: result.provider
      }, { status: 500 });
    }

    if (!result.content) {
      console.error('[factcheck] AI returned empty content');
      return NextResponse.json({
        error: 'AI returned empty response',
        provider: result.provider
      }, { status: 500 });
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

    console.log('[factcheck] Parsing JSON, length:', jsonStr.length);
    const parsed = JSON.parse(jsonStr);

    // Validate and filter sources to only include valid URLs
    const validatedSources = (parsed.sources || []).filter((source: string) => {
      try {
        // Check if it's a valid URL
        const url = new URL(source);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        console.log('[factcheck] Invalid URL source filtered out:', source);
        return false;
      }
    });

    console.log('[factcheck] Success, verdict:', parsed.verdict, 'sources:', validatedSources.length);
    return NextResponse.json({
      ...parsed,
      sources: validatedSources,
      provider: result.provider
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[factcheck] Error:', errorMsg, 'Stack:', err instanceof Error ? err.stack : '');
    return NextResponse.json({
      error: `Failed to process: ${errorMsg}`,
      details: errorMsg
    }, { status: 500 });
  }
}