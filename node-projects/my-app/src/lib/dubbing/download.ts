import { ClientType, Innertube, Platform, Types } from "youtubei.js";

// Set up JS interpreter for decipher (required for WEB client fallback)
if (typeof globalThis.Function === "function") {
  Platform.shim.eval = async (data: Types.BuildScriptResult) => {
    return new Function(data.output)();
  };
}

export async function downloadAudio(youtubeUrl: string): Promise<{ audioBuffer: ArrayBuffer; title: string }> {
  console.log("[download] Creating Innertube with ANDROID client...");

  let info;
  let title = "video";

  try {
    const yt = await Innertube.create({
      client_type: ClientType.ANDROID,
      generate_session_locally: false,
      enable_session_cache: true,
    });

    console.log("[download] Fetching video info...");
    info = await yt.getInfo(youtubeUrl);
    title = info.basic_info.title ?? "video";
    console.log("[download] Title:", title);

    if (info.streaming_data) {
      const format = info.chooseFormat({ type: "audio", quality: "best" });
      console.log("[download] Format:", format.itag, format.mime_type);

      const directUrl = (format as unknown as { url?: string }).url;
      if (directUrl) {
        console.log("[download] Direct URL found, downloading...");
        const response = await fetch(directUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const audioBuffer = await response.arrayBuffer();
        console.log("[download] Downloaded:", (audioBuffer.byteLength / 1024 / 1024).toFixed(1), "MB");
        return { audioBuffer, title };
      }
    }

    console.log("[download] No direct URL, trying stream download...");
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

    console.log("[download] Streamed:", (audioBuffer.byteLength / 1024 / 1024).toFixed(1), "MB");
    return { audioBuffer: audioBuffer.buffer, title };
  } catch (androidError) {
    console.error("[download] ANDROID client failed:", (androidError as Error).message);
    console.log("[download] Falling back to WEB client...");

    const ytWeb = await Innertube.create();
    info = await ytWeb.getInfo(youtubeUrl);
    title = info.basic_info.title ?? "video";

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
}
