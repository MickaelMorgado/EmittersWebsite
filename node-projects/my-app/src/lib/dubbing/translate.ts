import { translate } from "@vitalets/google-translate-api";

export async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await translate(text, { to: targetLang });
  return res.text;
}

export async function translateSegments(
  segments: Array<{ start: number; end: number; text: string }>,
  targetLang: string
): Promise<Array<{ start: number; end: number; text: string }>> {
  const results: Array<{ start: number; end: number; text: string }> = [];

  for (const seg of segments) {
    const translated = await translateText(seg.text, targetLang);
    results.push({ start: seg.start, end: seg.end, text: translated });
  }

  return results;
}
