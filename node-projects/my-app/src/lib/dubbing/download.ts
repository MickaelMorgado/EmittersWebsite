import { Innertube } from "youtubei.js";

export async function downloadAudio(youtubeUrl: string): Promise<{ audioBuffer: ArrayBuffer; title: string }> {
  const yt = await Innertube.create();
  const info = await yt.getBasicInfo(youtubeUrl);

  const title = info.basic_info.title ?? "video";

  // Choose the best audio format and decipher the URL
  const format = info.chooseFormat({ type: "audio", quality: "best" });
  const playbackUrl = await format.decipher(yt.session.player);

  const response = await fetch(playbackUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  return { audioBuffer, title };
}
