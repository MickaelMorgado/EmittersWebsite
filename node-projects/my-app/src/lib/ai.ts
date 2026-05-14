const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';

export type AIProvider = 'openai' | 'openrouter' | 'ollama';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  error?: string;
}

async function chatOllama(prompt: string): Promise<AIResponse> {
  console.log(`[Ollama] Trying ${OLLAMA_URL} with model ${OLLAMA_MODEL}...`);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    console.log(`[Ollama] Response status: ${res.status}`);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error: ${res.status} - ${text}`);
    }
    
    const data = await res.json();
    console.log(`[Ollama] Response received, length: ${data.response?.length || 0}`);
    return { content: data.response || '', provider: 'ollama' };
  } catch (err) {
    console.error(`[Ollama] Failed:`, err);
    return { content: '', provider: 'ollama', error: String(err) };
  }
}

export async function chatAI(prompt: string, fallback = true): Promise<AIResponse> {
  console.log(`[chatAI] Keys - OpenAI: ${!!OPENAI_KEY}, OpenRouter: ${!!OPENROUTER_KEY}`);
  
  // Try OpenAI first
  if (OPENAI_KEY) {
    console.log('[chatAI] Trying OpenAI...');
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
      console.log('[chatAI] OpenAI response:', data.error || 'success');
      
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, provider: 'openai' };
      }
      
      if (data.error?.code === 'insufficient_quota') {
        console.log('[chatAI] OpenAI quota exceeded, trying OpenRouter...');
      } else if (!fallback) {
        return { content: '', provider: 'openai', error: data.error?.message || 'OpenAI error' };
      }
    } catch (err) {
      console.error('[chatAI] OpenAI error:', err);
      if (!fallback) return { content: '', provider: 'openai', error: String(err) };
    }
  }

  // Try OpenRouter
  if (OPENROUTER_KEY) {
    console.log('[chatAI] Trying OpenRouter...');
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
      console.log('[chatAI] OpenRouter response:', data.error || 'success');
      
      if (data.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, provider: 'openrouter' };
      }
      
      console.log('[chatAI] OpenRouter failed, trying Ollama...');
    } catch (err) {
      console.log('[chatAI] OpenRouter error:', err);
    }
  } else {
    console.log('[chatAI] No OpenRouter key, trying Ollama...');
  }

  // Fallback to local Ollama
  const ollamaResult = await chatOllama(prompt);
  if (ollamaResult.content) {
    return ollamaResult;
  }

  return { content: '', provider: 'openai', error: 'No AI available (OpenAI, OpenRouter, and Ollama failed)' };
}