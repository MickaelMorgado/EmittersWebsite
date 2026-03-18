import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, ...params } = body;

    if (!tool) {
      return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
    }

    const response = await fetch(`${GATEWAY_URL}/v1/tools/call/${tool}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gateway error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OpenClaw API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to OpenClaw gateway", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get("tool");

  if (!tool) {
    return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/v1/tools/call/${tool}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gateway error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OpenClaw API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to OpenClaw gateway" },
      { status: 500 }
    );
  }
}
