import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const SCRIPT_PATH = "C:\\Users\\Mickael M\\.opencode\\skills\\video-dubbing\\scripts\\dub.py";
const OUTPUT_BASE = "C:\\Users\\Mickael M\\development\\personal-memory-bank\\dub_output";

function ensureOutputDir() {
  if (!existsSync(OUTPUT_BASE)) {
    mkdirSync(OUTPUT_BASE, { recursive: true });
  }
}

function jobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, language, whisperModel = "base" } = body;

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

    ensureOutputDir();
    const id = jobId();
    const workDir = join(OUTPUT_BASE, id);
    const outputPath = join(workDir, "dubbed_output.mp4");

    mkdirSync(workDir, { recursive: true });

    const result = execFileSync("python", [
      SCRIPT_PATH,
      url,
      "--lang", language,
      "--whisper-model", whisperModel,
      "--workdir", workDir,
      "--keep-workdir",
      "--output", outputPath,
    ], {
      encoding: "utf-8",
      timeout: 600_000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    if (!existsSync(outputPath)) {
      return NextResponse.json(
        { error: "Pipeline completed but output file not found", log: result },
        { status: 500 }
      );
    }

    const files = existsSync(join(workDir, "tts_segments"))
      ? readdirSync(join(workDir, "tts_segments")).filter((f) => f.endsWith(".wav")).length
      : 0;

    return NextResponse.json({
      success: true,
      jobId: id,
      downloadUrl: `/api/video-dubbing/download?jobId=${id}`,
      segments: files,
      log: result.split("\n").filter((l) => l.startsWith("STEP") || l.startsWith("=") || l.startsWith("  ")),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Video Dubbing API",
    methods: ["POST"],
    body: { url: "string", language: "fr|pt", whisperModel: "tiny|base|small|medium|large" },
  });
}
