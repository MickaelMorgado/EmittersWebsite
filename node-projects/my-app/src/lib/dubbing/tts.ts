import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const VOICE_MAP: Record<string, string> = {
  fr: "fr-FR-HenriNeural",
  pt: "pt-BR-AntonioNeural",
};

export interface TTSSegment {
  index: number;
  start: number;
  end: number;
  text: string;
  audioBase64: string;
}

export async function generateTTS(
  segments: Array<{ start: number; end: number; text: string }>,
  language: string
): Promise<TTSSegment[]> {
  const voice = VOICE_MAP[language] ?? "fr-FR-HenriNeural";
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const results: TTSSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const { audioStream } = tts.toStream(seg.text);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (data: Buffer) => chunks.push(data));
      audioStream.on("end", () => resolve());
      audioStream.on("error", reject);
    });

    const audioBase64 = Buffer.concat(chunks).toString("base64");

    results.push({
      index: i + 1,
      start: seg.start,
      end: seg.end,
      text: seg.text,
      audioBase64,
    });
  }

  return results;
}
