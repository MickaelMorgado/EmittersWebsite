import { Innertube } from "youtubei.js";

export async function downloadAudio(youtubeUrl: string): Promise<{ audioBuffer: ArrayBuffer; title: string }> {
  const yt = await Innertube.create();
  const info = await yt.getInfo(youtubeUrl);

  const title = info.basic_info.title ?? "video";
  const stream = await info.download({ type: "audio", quality: "best" });

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const audioBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    audioBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return { audioBuffer: audioBuffer.buffer, title };
}
