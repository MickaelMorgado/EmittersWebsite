import { NextRequest, NextResponse } from 'next/server';
import { chatAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant. Respond concisely and clearly.' },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];
    
    const prompt = `Conversation:\n${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${message}\n\nRespond as the AI assistant.`;
    
    const result = await chatAI(prompt);
    console.log('AI response:', result);
    
    if (result.error) {
      return NextResponse.json({ error: result.error, provider: result.provider }, { status: 500 });
    }
    
    return NextResponse.json({ content: result.content, provider: result.provider });
  } catch (err) {
    console.error('Memogpt API error:', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}