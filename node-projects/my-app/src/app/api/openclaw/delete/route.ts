import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionKey } = body;

    if (!sessionKey) {
      return NextResponse.json({ error: "Session key is required" }, { status: 400 });
    }

    const response = await fetch(`${GATEWAY_URL}/v1/tools/call/sessions_delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionKey }),
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
    console.error("sessions_delete error:", error);
    return NextResponse.json(
      { error: "Failed to connect to OpenClaw gateway" },
      { status: 500 }
    );
  }
}
