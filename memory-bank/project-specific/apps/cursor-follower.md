# Cursor Follower

Portrait (9:16) live streaming tool that crops around your mouse cursor.

## Location
`my-app/src/app/cursor-follower/page.tsx`

## Overview

A Next.js page that captures your screen and creates a portrait video stream that follows your mouse cursor, simulating a camera operator tracking the cursor.

## Features

- **Portrait output**: 1080x1920 canvas (9:16 aspect ratio)
- **Cursor tracking**: System-wide mouse tracking via Python + WebSocket
- **Zoom control**: Adjustable crop scale (0.3 - 1.0)
- **Smooth rendering**: 60fps output stream
- **Clamped cropping**: No black borders - always shows valid content

## Setup

### 1. Install Python dependencies
```bash
pip install pyautogui
```

### 2. Install server dependencies
```bash
cd node-projects/my-app/cursor-follower
npm install
```

### 3. Start the mouse tracking server
```bash
npm start
```
This starts a WebSocket server on port 3003 that broadcasts mouse position.

### 4. Open the app
Access at `/cursor-follower` when my-app is running.

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Python Script  │───────────────────►│  Node.js Server │
│  (pyautogui)   │   ws://localhost  │   (Port 3003)   │
└─────────────────┘      :3003        └────────┬────────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │  Browser App  │
                                   │ (cursor-follower│
                                   └───────────────┘
```

## Files

- `mouse_tracker.py` - Python script using pyautogui for global mouse tracking
- `server.js` - Node.js WebSocket server wrapping the Python script
- `package.json` - Server dependencies (express, ws)

## Integration

The app uses `canvas.captureStream(60)` which can be connected to:

- WebRTC peer connections
- TikTok/streaming pipelines
- MediaRecorder for recording
- Any WebRTC-based streaming service

Access via `canvasStreamRef` or modify to expose externally.

## Technical Details

- Uses `navigator.mediaDevices.getDisplayMedia()` for screen capture
- Python `pyautogui.position()` for system-wide cursor tracking (works across all monitors)
- WebSocket broadcasts mouse position at ~60fps
- Renders to canvas using `ctx.drawImage()` with computed source rectangle
- Source rectangle clamped to video bounds to prevent black borders
