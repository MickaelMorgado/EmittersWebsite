const OPENAI_KEY =
  process.env.OPENAI_API_KEY ||
  process.env.OPENAI_KEY ||
  process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
  process.env.NEXT_PUBLIC_OPENAI_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY;

const OPENROUTER_TEXT_MODELS = [
  process.env.OPENROUTER_MODEL,
  'deepseek/deepseek-v4-flash:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
].filter(Boolean) as string[];

export type AIProvider = 'openai' | 'openrouter';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  error?: string;
}

export async function chatAI(prompt: string, fallback = true): Promise<AIResponse> {
  let lastError = '';

  // Try OpenAI first
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800
        })
      });

      const data = await res.json();
      
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, provider: 'openai' };
      }

      lastError = data.error?.message || `OpenAI HTTP ${res.status}`;
      
      if (data.error?.code === 'insufficient_quota') {
        console.log('OpenAI quota exceeded, trying OpenRouter...');
      } else if (!fallback) {
        return { content: '', provider: 'openai', error: lastError || 'OpenAI error' };
      }
    } catch (err) {
      console.error('OpenAI error:', err);
      lastError = String(err);
      if (!fallback) return { content: '', provider: 'openai', error: lastError };
    }
  }

  // Fallback to OpenRouter
  if (OPENROUTER_KEY) {
    for (const model of OPENROUTER_TEXT_MODELS) {
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
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 800
          })
        });

        const data = await res.json();
        
        if (data.choices?.[0]?.message?.content) {
          return { content: data.choices[0].message.content, provider: 'openrouter' };
        }

        lastError = data.error?.message || `OpenRouter ${model} HTTP ${res.status}`;
        console.log(`OpenRouter model failed (${model}):`, lastError);
      } catch (err) {
        lastError = String(err);
        console.log(`OpenRouter model failed (${model}):`, lastError);
      }
    }

    return { content: '', provider: 'openrouter', error: lastError || 'OpenRouter error' };
  }

  return {
    content: '',
    provider: 'openai',
    error: lastError || 'No AI API keys configured',
  };
}
