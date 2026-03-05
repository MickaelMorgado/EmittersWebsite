# TikTok + AI Assistant

Integrated application combining TikTok live stream events with an AI voice assistant and reactive visualizations.

## Overview

The TikTok + AI Assistant is a real-time interactive app designed for live streaming. It connects to a TikTok live feed, processes comments, and uses an AI assistant to generate voice replies and reactive animations.

## Key Features

- **TikTok Live Connection**: Connects to a local TikTok backend to stream comments and events.
- **AI Voice Assistant**: Uses Socket.io to communicate with an AI voice server for speech-to-text and AI-generated responses.
- **Reactive Galaxy Visualization**: A 3D galaxy visualization (built with React Three Fiber) that reacts to AI status (listening, speaking, processing) and special events.
- **Integrated Audio**: Plays UI sounds and speech-to-text audio responses.
- **Auto-Reply Mode**: Can be toggled to automatically respond to incoming TikTok comments.

## Technical Details

- **Frontend**: Next.js, React Three Fiber, Socket.io-client.
- **Animations**: Reactive `Galaxy` component with different states: `idle`, `listening`, `speaking`, `processing`, `event`.
- **Communication Channels**:
  - WebSocket (`ws://localhost:8080/tiktok-stream`) for TikTok data.
  - Socket.io (`http://localhost:3001`) for AI interaction.
- **Location**: `node-projects/my-app/src/app/tiktok-tts/`

## Usage

1. Start the TikTok backend service.
2. Start the AI assistant socket server.
3. Open the TikTok + AI Assistant page.
4. Click "Connect TikTok" to start receiving live events.
