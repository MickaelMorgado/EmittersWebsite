import { pipeline } from "@xenova/transformers";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<Segment[]> {
  const tmpPath = join(tmpdir(), `whisper_input_${Date.now()}.wav`);
  await writeFile(tmpPath, Buffer.from(audioBuffer));

  try {
    const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");

    const result = await transcriber(tmpPath, {
      language: "english",
      return_timestamps: true,
    } as Parameters<typeof transcriber>[1]);

    const chunks = (result as { chunks?: Array<{ timestamp: [number, number]; text: string }> }).chunks ?? [];
    return chunks.map((c) => ({
      start: c.timestamp[0],
      end: c.timestamp[1],
      text: c.text.trim(),
    }));
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
