import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
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

    const templatePath = join(process.cwd(), "public", "scripts", "dub_template.py");
    let script = await readFile(templatePath, "utf-8");

    script = script.replace("{{YOUTUBE_URL}}", url);
    script = script.replace("{{TARGET_LANG}}", language);

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/x-python; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dubbed_video.py"',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
