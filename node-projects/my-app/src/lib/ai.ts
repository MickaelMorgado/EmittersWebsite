const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY;

export type AIProvider = 'openai' | 'openrouter';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  error?: string;
}

export async function chatAI(prompt: string, fallback = true): Promise<AIResponse> {
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
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800
        })
      });

      const data = await res.json();
      
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, provider: 'openai' };
      }
      
      if (data.error?.code === 'insufficient_quota') {
        console.log('OpenAI quota exceeded, trying OpenRouter...');
      } else if (!fallback) {
        return { content: '', provider: 'openai', error: data.error?.message || 'OpenAI error' };
      }
    } catch (err) {
      console.error('OpenAI error:', err);
      if (!fallback) return { content: '', provider: 'openai', error: String(err) };
    }
  }

  // Fallback to OpenRouter
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
          model: 'google/gemma-3n-e4b-it:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800
        })
      });

      const data = await res.json();
      
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, provider: 'openrouter' };
      }
      
      return { content: '', provider: 'openrouter', error: data.error?.message || 'OpenRouter error' };
    } catch (err) {
      return { content: '', provider: 'openrouter', error: String(err) };
    }
  }

  return { content: '', provider: 'openai', error: 'No AI API keys configured' };
}