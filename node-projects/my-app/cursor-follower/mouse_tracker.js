const { spawn } = require('child_process');

const ps = spawn('powershell', [
  '-NoProfile',
  '-Command',
  `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
while ($true) {
  $pos = [System.Windows.Forms.Cursor]::Position
  $bounds = $screen.Bounds
  Write-Output ("{0},{1},{2},{3}" -f $pos.X, $pos.Y, $bounds.Width, $bounds.Height)
  Start-Sleep -Milliseconds 16
}
`
]);

console.log('MOUSE_TRACKER_READY');

let buffer = '';

ps.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',');
    if (parts.length >= 4) {
      const obj = {
        x: parseInt(parts[0]),
        y: parseInt(parts[1]),
        screenWidth: parseInt(parts[2]),
        screenHeight: parseInt(parts[3]),
        timestamp: Date.now() / 1000
      };
      console.log(JSON.stringify(obj));
    }
  }
});

ps.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg) console.error('[Mouse Tracker]', msg);
});

ps.on('close', (code) => {
  console.error(`[Mouse Tracker] PowerShell exited with code ${code}`);
  process.exit(code || 1);
});

process.on('SIGINT', () => { ps.kill(); process.exit(); });
process.on('SIGTERM', () => { ps.kill(); process.exit(); });
