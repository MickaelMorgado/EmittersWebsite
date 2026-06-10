import { ClientType, Innertube, Platform, Types } from "youtubei.js/web";

// Set up JS interpreter for decipher (required for WEB client URLs)
Platform.shim.eval = async (data: Types.BuildScriptResult) => {
  return new Function(data.output)();
};

export async function downloadAudio(youtubeUrl: string): Promise<{ audioBuffer: ArrayBuffer; title: string }> {
  // Use ANDROID client - returns direct URLs without needing decipher
  const yt = await Innertube.create({
    client_type: ClientType.ANDROID,
    generate_session_locally: false,
    enable_session_cache: true,
  });

  let info;
  try {
    info = await yt.getInfo(youtubeUrl);
  } catch {
    // Fallback: try with WEB client + eval shim
    const ytWeb = await Innertube.create();
    info = await ytWeb.getInfo(youtubeUrl);
  }

  const title = info.basic_info.title ?? "video";

  // Get audio stream via download method (handles decipher internally)
  const stream = await info.download({
    type: "audio",
    quality: "best",
  });

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
