const { spawn } = require('child_process');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const PORT = 3003;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let pythonProcess = null;
let mouseData = { x: 0, y: 0, screenWidth: 1920, screenHeight: 1080 };

app.get('/status', (req, res) => {
  res.json({
    status: pythonProcess ? 'running' : 'stopped',
    mouse: mouseData
  });
});

wss.on('connection', (ws) => {
  console.log('[Cursor Server] Browser connected');

  ws.send(JSON.stringify({ type: 'init', ...mouseData }));

  ws.on('close', () => {
    console.log('[Cursor Server] Browser disconnected');
  });
});

function startPythonTracker() {
  if (pythonProcess) {
    pythonProcess.kill();
  }

  console.log('[Cursor Server] Starting mouse tracker...');
  pythonProcess = spawn('python', ['mouse_tracker.py'], { cwd: __dirname });

  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line === 'MOUSE_TRACKER_READY') {
        console.log('[Cursor Server] Mouse tracker ready');
        return;
      }
      try {
        const json = JSON.parse(line);
        if (json.error) {
          console.error('[Cursor Server] Python error:', json.error);
          return;
        }
        mouseData = json;
        broadcast({ type: 'mouse', ...json });
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('[Cursor Server] Python stderr:', data.toString());
  });

  pythonProcess.on('close', (code) => {
    console.log(`[Cursor Server] Python process exited with code ${code}`);
    pythonProcess = null;
  });

  pythonProcess.on('error', (err) => {
    console.error('[Cursor Server] Failed to start Python:', err);
  });
}

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(PORT, () => {
  console.log(`[Cursor Server] Running on http://localhost:${PORT}`);
  console.log(`[Cursor Server] WebSocket available at ws://localhost:${PORT}`);
  startPythonTracker();
});

process.on('SIGINT', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit();
});
