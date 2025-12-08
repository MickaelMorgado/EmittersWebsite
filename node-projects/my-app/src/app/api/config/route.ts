export async function GET() {
  return Response.json({
    appName: '3D Printer Camera Monitor',
    theme: 'dark',
    maxCameras: 4,
    // TODO: Add future extensions here
  });
}
