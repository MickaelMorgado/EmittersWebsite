export async function POST(request: Request) {
  const { deviceId } = await request.json();
  console.log('Main camera set to:', deviceId);
  // TODO: Add future automation/logging here, e.g., switch OBS scene, send hotkey
  return Response.json({ success: true });
}
