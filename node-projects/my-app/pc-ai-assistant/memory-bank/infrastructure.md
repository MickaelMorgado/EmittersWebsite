# System Infrastructure & Operations

This document describes how the TikTok AI Assistant ecosystem works, including the AI Server, the TikTok Backend, and the Frontend Visualizer.

## Components Overview

### 1. AI Assistant Server (Node.js)
- **Path**: `node-projects/my-app/pc-ai-assistant/voice_ollama.js`
- **Port**: `3001`
- **Core Logic**:
    - **Speech-to-Text (STT)**: Calls `speech_recog.py` (Python) to capture audio.
    - **Transcript Correction**: Uses Ollama (Llama-2) to clean and fix grammar/spelling of raw transcripts.
    - **Brain (Ollama)**: Generates reactive responses using context from Markdown memory files.
    - **Text-to-Speech (TTS)**: Calls `tts_piper.py` (Python bridge to Piper TTS) for high-quality offline voice synthesis.
    - **Socket.io**: Broadcasts status updates (listening, thinking, speaking, events) to the Frontend.

### 2. TikTok Live Backend (Node.js/WS)
- **Path**: `node-projects/tiktok-backend/server.js`
- **Port**: `8080`
- **Core Logic**:
    - Uses `tiktok-live-connector` to hook into a live stream.
    - Filters and relays live comments to any connected WebSocket client.

### 3. Frontend Galaxy Visualizer (Next.js)
- **Path**: `node-projects/my-app/src/app/tiktok-tts/page.tsx`
- **UI Architecture**:
    - **Galaxy Engine**: A 3D Three.js/React-Three-Fiber galaxy that changes speed, rotation, and particle density based on AI states.
    - **HUD Overlay**: Real-time status indicator, TikTok live feed, and AI conversation history.
    - **State Management**: Listens to the AI Server via Socket.io to trigger visual "mood" changes.

## State/Color Mapping
| State | Behavior | Color |
|-------|----------|-------|
| **Idle** | Slow drift | White (`#ffffff`) |
| **Listening** | Accelerated orbit | Red (`#ff0000`) |
| **STT Correcting**| Burst animation | Cyan (`#00ffff`) |
| **Processing** | Intense swirling | Blue (`#0000ff`) |
| **Speaking** | Vibrant pulsing | Green (`#00ff00`) |
| **TikTok Event** | Energy burst | Cyan (`#00ffff`) |

## Running the Ecosystem (Windows)

To run the full system, open three terminals and run the following in order:

1. **Frontend**:
   ```pwsh
   cd node-projects/my-app
   npm run dev
   ```
   *Available at http://localhost:3000/tiktok-tts*

2. **TikTok Connector**:
   ```pwsh
   cd node-projects/tiktok-backend
   node server.js
   ```

3. **AI Assistant**:
   ```pwsh
   cd node-projects/my-app/pc-ai-assistant
   npm start
   ```

## Development & Maintenance
- **Memory Bank**: To add more knowledge, create `.md` files in `pc-ai-assistant/memory-bank/` and add the corresponding keyword to the `keywordMap` in `voice_ollama.js`.
- **Latency**: STT correction is the most intense part of the loop. If it feels slow, check if Ollama is running on CPU or GPU.
- **Port Conflicts**: Use `taskkill /F /PID [ID]` if ports 3001 or 8080 get stuck.
