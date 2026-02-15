# PC AI Assistant

Voice-activated AI assistant featuring 3D galaxy visualization and speech-reactive animations.

## Overview

The PC AI Assistant is a standalone voice-interactive application. It uses speech recognition and AI to respond to user queries, providing both auditory and visual feedback through a dynamic 3D galaxy interface.

## Key Features

- **Voice Interaction**: Real-time speech-to-text and AI response generation.
- **Dynamic 3D Galaxy**: A particle-based 3D galaxy that reacts to the assistant's state (listening, speaking, processing).
- **Socket.io Integration**: Connects to a local voice server for handling heavy AI and audio processing.
- **Interactive Audio**: Includes sound effects for state transitions and voice feedback.
- **Conversation History**: Displays a floating overlay of the recent conversation.

## Technical Details

- **Frontend**: Next.js, React Three Fiber (Three.js), Socket.io-client.
- **Visuals**: Instanced mesh based galaxy with Bloom, Noise, and Vignette post-processing.
- **State-Driven Animation**: Particle speeds and rotations change based on the assistant's current activity.
- **Communication**: Socket.io (`http://localhost:3001`).
- **Location**: `node-projects/my-app/src/app/pc-ai-assistant/`

## Usage

1. Start the AI voice server (Port 3001).
2. Open the PC AI Assistant page.
3. Interact with the assistant using voice or text input.
4. Interact with the 3D galaxy using mouse/touch controls.
