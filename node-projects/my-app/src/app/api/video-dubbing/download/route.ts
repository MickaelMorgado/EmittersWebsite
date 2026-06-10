import { NextRequest } from "next/server";
import { existsSync } from "fs";
import { join } from "path";

const OUTPUT_BASE = "C:\\Users\\Mickael M\\development\\personal-memory-bank\\dub_output";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return new Response("Missing jobId", { status: 400 });
  }

  const filePath = join(OUTPUT_BASE, jobId, "dubbed_output.mp4");

  if (!existsSync(filePath)) {
    return new Response("File not found or still processing", { status: 404 });
  }

  const { readFile } = await import("fs/promises");
  const buffer = await readFile(filePath);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="dubbed_${jobId}.mp4"`,
    },
  });
}
