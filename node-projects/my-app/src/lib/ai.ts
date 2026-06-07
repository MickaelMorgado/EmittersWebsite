const OPENAI_KEY =
  process.env.OPENAI_API_KEY ||
  process.env.OPENAI_KEY ||
  process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
  process.env.NEXT_PUBLIC_OPENAI_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY;

// Ordered fastest → slowest. Small 7-8b models respond in <15s on free tier.
const OPENROUTER_TEXT_MODELS = [
  process.env.OPENROUTER_MODEL,
  'meta-llama/llama-3.1-8b-instruct:free',   // fast, great at JSON
  'mistralai/mistral-7b-instruct:free',        // fast fallback
  'google/gemma-3-4b-it:free',                 // small, quick
  'google/gemma-4-31b-it:free',               // slower, last resort
].filter(Boolean) as string[];

// Ollama config
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2:7b';

export type AIProvider = 'openai' | 'openrouter' | 'ollama';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  error?: string;
}

export interface ChatOptions {
  provider?: AIProvider; // Force specific provider: 'ollama', 'openai', 'openrouter'
  fallback?: boolean;    // Allow fallback if primary fails (default: true)
  temperature?: number;  // default: 0.3
  maxTokens?: number;    // default: 800; use ~200 for short JSON responses
}

/**
 * Unified chat function - supports OpenAI, OpenRouter, and Ollama
 * @param prompt The prompt to send
 * @param options Provider selection, fallback behavior, temperature
 */
export async function chatAI(prompt: string, options?: ChatOptions): Promise<AIResponse> {
  const { provider, fallback = true, temperature, maxTokens } = options || {};
  let lastError = '';

  // Force Ollama if specified
  if (provider === 'ollama') {
    return chatOllama(prompt, temperature);
  }

  // Force OpenAI if specified
  if (provider === 'openai') {
    const result = await chatOpenAI(prompt, temperature, maxTokens);
    if (result.content || !fallback) return result;
    lastError = result.error || 'OpenAI failed';
  }

  // Force OpenRouter if specified
  if (provider === 'openrouter') {
    const result = await chatOpenRouter(prompt, temperature, maxTokens);
    if (result.content || !fallback) return result;
    lastError = result.error || 'OpenRouter failed';
  }

  // No specific provider: try OpenAI first, then OpenRouter
  if (!provider) {
    if (OPENAI_KEY) {
      const result = await chatOpenAI(prompt, temperature, maxTokens);
      if (result.content) return result;
      lastError = result.error || 'OpenAI failed';

      if (!fallback) return result;
    }

    if (OPENROUTER_KEY) {
      return chatOpenRouter(prompt, temperature, maxTokens);
    }
  }

  return {
    content: '',
    provider: provider || 'openai',
    error: lastError || 'No AI provider configured',
  };
}

/**
 * Chat via Ollama (local LLM)
 */
async function chatOllama(prompt: string, temperature = 0.3): Promise<AIResponse> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        temperature: temperature || 0.3
      })
    });

    if (!res.ok) {
      return {
        content: '',
        provider: 'ollama',
        error: `HTTP ${res.status}`
      };
    }

    const data = await res.json();
    if (data.message?.content) {
      return { content: data.message.content, provider: 'ollama' };
    }

    return {
      content: '',
      provider: 'ollama',
      error: 'No response from Ollama'
    };
  } catch (err) {
    return {
      content: '',
      provider: 'ollama',
      error: `Connection failed: ${String(err)}`
    };
  }
}

/**
 * Chat via OpenAI
 */
async function chatOpenAI(prompt: string, temperature?: number, maxTokens?: number): Promise<AIResponse> {
  if (!OPENAI_KEY) {
    return {
      content: '',
      provider: 'openai',
      error: 'No OpenAI API key configured'
    };
  }

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
        max_tokens: maxTokens ?? 800,
        ...(temperature !== undefined && { temperature })
      })
    });

    const data = await res.json();

    if (data.choices?.[0]?.message?.content) {
      return { content: data.choices[0].message.content, provider: 'openai' };
    }

    return {
      content: '',
      provider: 'openai',
      error: data.error?.message || `HTTP ${res.status}`
    };
  } catch (err) {
    return {
      content: '',
      provider: 'openai',
      error: String(err)
    };
  }
}

/**
 * Chat via OpenRouter
 */
// Per-model timeout — don't let one slow free model block all retries
const MODEL_TIMEOUT_MS = 45_000;

async function chatOpenRouter(prompt: string, temperature?: number, maxTokens?: number): Promise<AIResponse> {
  if (!OPENROUTER_KEY) {
    return {
      content: '',
      provider: 'openrouter',
      error: 'No OpenRouter API key configured'
    };
  }

  for (const model of OPENROUTER_TEXT_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://emitterswebsite.com',
          'X-Title': 'EmittersWebsite'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens ?? 800,
          ...(temperature !== undefined && { temperature })
        })
      });
      clearTimeout(timer);

      const data = await res.json();

      if (data.choices?.[0]?.message?.content) {
        console.log(`[openrouter] ✓ ${model}`);
        return { content: data.choices[0].message.content, provider: 'openrouter' };
      }

      console.log(`[openrouter] ${model} failed:`, data.error?.message);
    } catch (err: any) {
      clearTimeout(timer);
      const reason = err.name === 'AbortError' ? 'timed out (45s)' : String(err);
      console.log(`[openrouter] ${model} error: ${reason}`);
    }
  }

  return {
    content: '',
    provider: 'openrouter',
    error: 'All OpenRouter models failed or timed out'
  };
}

/**
 * Parse JSON from response (handles markdown code blocks and embedded JSON)
 */
export function parseJSON<T>(response: string): T | null {
  try {
    // Try direct JSON parse first
    return JSON.parse(response);
  } catch {
    // Try extracting from markdown code block
    const markdownMatch = response.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (markdownMatch) {
      try {
        return JSON.parse(markdownMatch[1]);
      } catch {
        // Continue to next attempt
      }
    }

    const stripPrefix = response.replace(/^[\s\S]*?(?=[\{\[])/, '');
    try {
      return JSON.parse(stripPrefix);
    } catch {
      // continue
    }

    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // continue
      }
    }

    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}
