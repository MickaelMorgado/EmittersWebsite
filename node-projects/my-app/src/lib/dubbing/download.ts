import { ClientType, Innertube } from "youtubei.js";

export async function downloadAudio(youtubeUrl: string): Promise<{ audioBuffer: ArrayBuffer; title: string }> {
  console.log("[download] Starting with ANDROID client...");

  const yt = await Innertube.create({
    client_type: ClientType.ANDROID,
    generate_session_locally: false,
    enable_session_cache: true,
  });

  console.log("[download] Innertube created, fetching info...");
  const info = await yt.getInfo(youtubeUrl);
  const title = info.basic_info.title ?? "video";
  console.log("[download] Got info:", title);

  if (!info.streaming_data) {
    throw new Error("No streaming data available for this video");
  }

  const format = info.chooseFormat({ type: "audio", quality: "best" });
  console.log("[download] Chose format:", format.itag, format.mime_type);

  // Try to get URL directly (ANDROID client provides direct URLs)
  const url = (format as unknown as { url?: string }).url;

  if (url) {
    console.log("[download] Direct URL found, fetching...");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    const audioBuffer = await response.arrayBuffer();
    return { audioBuffer, title };
  }

  // If no direct URL, try decipher
  console.log("[download] No direct URL, attempting download via stream...");
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
