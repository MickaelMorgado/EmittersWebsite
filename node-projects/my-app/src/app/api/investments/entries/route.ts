import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const noCache = { headers: { 'Cache-Control': 'no-store, must-revalidate' } };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  let query = supabase
    .from('investment_entries')
    .select('*')
    .order('date', { ascending: false });

  if (symbol) {
    query = query.eq('symbol', symbol);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, noCache);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { symbol, date, qty, price, currency } = body;

  if (!symbol || !date || qty === undefined || price === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('investment_entries')
    .insert([{ symbol, date, qty, price, currency: currency || 'USD' }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('investment_entries')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
