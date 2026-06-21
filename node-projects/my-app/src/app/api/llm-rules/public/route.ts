import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: rules, error: rulesError } = await supabase
    .from('llm_rules')
    .select('*')
    .order('sort_order', { ascending: true });

  if (rulesError) {
    return NextResponse.json({ error: rulesError.message }, { status: 500 });
  }

  let sections: { name: string; color: string }[] = [];
  const { data: sectionsData, error: sectionsError } = await supabase
    .from('llm_sections')
    .select('*')
    .order('sort_order', { ascending: true });

  if (!sectionsError && sectionsData) {
    sections = sectionsData;
  }

  const sectionMap = new Map(sections.map((s) => [s.name, s]));
  const grouped: Record<string, { title: string; content: string }[]> = {};

  for (const rule of rules || []) {
    if (!grouped[rule.section]) {
      grouped[rule.section] = [];
    }
    grouped[rule.section].push({ title: rule.title, content: rule.content });
  }

  let markdown = '# LLM Rules\n\n';
  for (const [section, sectionRules] of Object.entries(grouped)) {
    const sectionMeta = sectionMap.get(section);
    markdown += `## ${sectionMeta?.name || section}\n\n`;
    for (const rule of sectionRules) {
      markdown += `### ${rule.title}\n\n${rule.content}\n\n`;
    }
  }

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
