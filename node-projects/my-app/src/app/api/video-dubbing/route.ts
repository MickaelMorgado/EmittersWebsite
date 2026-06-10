import { NextRequest, NextResponse } from "next/server";
import { downloadAudio } from "@/lib/dubbing/download";
import { transcribeAudio } from "@/lib/dubbing/transcribe";
import { translateSegments } from "@/lib/dubbing/translate";
import { generateTTS } from "@/lib/dubbing/tts";

export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({
    status: "Video Dubbing API",
    methods: ["POST"],
    body: { url: "string", language: "fr|pt" },
  });
}

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  try {
    const body = await request.json();
    const { url, language } = body;

    if (!url || !language) {
      return NextResponse.json(
        { error: "Missing required fields: url, language" },
        { status: 400 }
      );
    }

    if (!["fr", "pt"].includes(language)) {
      return NextResponse.json(
        { error: "Unsupported language. Use 'fr' or 'pt'." },
        { status: 400 }
      );
    }

    logs.push("STEP 1/4: Downloading audio from YouTube...");
    console.log("[api] Step 1: Downloading audio...");
    const { audioBuffer, title } = await downloadAudio(url);
    logs.push(`  Downloaded: ${title} (${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);

    logs.push("STEP 2/4: Transcribing with Whisper...");
    console.log("[api] Step 2: Transcribing...");
    const transcript = await transcribeAudio(audioBuffer);
    logs.push(`  Transcribed ${transcript.length} segments`);

    logs.push("STEP 3/4: Translating to target language...");
    console.log("[api] Step 3: Translating...");
    const translated = await translateSegments(transcript, language);
    logs.push(`  Translated ${translated.length} segments`);

    logs.push("STEP 4/4: Generating TTS audio...");
    console.log("[api] Step 4: Generating TTS...");
    const ttsSegments = await generateTTS(translated, language);
    logs.push(`  Generated ${ttsSegments.length} TTS segments`);

    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      title,
      language,
      transcript,
      translated,
      ttsSegments,
      originalAudio: audioBase64,
      logs,
    });
  } catch (error: unknown) {
    console.error("[api] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    logs.push(`  ERROR: ${message}`);
    return NextResponse.json({ error: message, logs }, { status: 500 });
  }
}
