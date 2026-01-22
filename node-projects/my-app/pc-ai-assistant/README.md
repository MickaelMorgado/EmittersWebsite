# PC AI Assistant with Galaxy Visualization

A fully functional voice-activated AI assistant featuring stunning 3D galaxy particle visualization with real-time speech-reactive animations, custom glow effects, and dynamic color-coded interactions.

## 🚀 Features

- 🗣️ **Voice Input/Output** - Terminal-based conversation with TTS
- 🌌 **3D Galaxy Visualization** - 3000 particles in spherical distribution
- 🎨 **Speech-Reactive Colors** - Red (listening) → Blue (processing) → Green (speaking) → White (ready)
- ✨ **Custom Glow Effects** - Beautiful additive-blending halos around particles
- 🌊 **Dynamic Animations** - Context-aware movement multipliers (idle: 1x, speaking: 30x)
- 📱 **Cross-Platform** - Works on Windows, Mac, Linux
- ⚡ **Real-time Sync** - Socket.io communication between voice and visual systems

## 🛠️ Prerequisites

### Install Node.js (v18+)
Download from: https://nodejs.org/

### Install Ollama
Download from: https://ollama.ai/

### Pull AI Model
```bash
ollama pull phi3:mini
```

## 🚀 Running the Application

**⚠️ IMPORTANT: You need to run TWO servers simultaneously**

### Step 1: Start the Voice Server (Port 3001) - Terminal Input & AI
```bash
cd node-projects/my-app/pc-ai-assistant
npm start
```
- **Purpose**: Handles AI conversations, terminal input, text-to-speech
- **Port**: 3001 (Socket.io server)
- **What it does**: Processes your messages with Ollama AI and speaks responses

### Step 2: Start the React Visual App (Port 3000) - Galaxy Visualization
```bash
cd node-projects/my-app
npm run dev
```
- **Purpose**: Displays the animated galaxy and visual feedback
- **Port**: 3000 (Next.js web server)
- **What it does**: Shows the 3D particle galaxy that reacts to your conversations

### Step 3: Open the Visual Interface
Navigate to: `http://localhost:3000/pc-ai-assistant`

### Step 4: Interact via Terminal
Type messages in the terminal where the voice server is running (Step 1).

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    Socket.io    ┌─────────────────┐
│   Terminal      │◄──────────────►│   Browser       │
│   (Port 3001)   │   (WebSocket)   │   (Port 3000)   │
│                 │                 │                 │
│ • AI Processing │                 │ • Galaxy Visual │
│ • Text Input    │                 │ • 3D Animation  │
│ • TTS Output    │                 │ • Color States  │
│ • Socket Server │                 │ • Bloom Effects │
└─────────────────┘                 └─────────────────┘
```

### Server Responsibilities
- **Voice Server (3001)**: AI logic, conversation processing, audio output
- **Visual Server (3000)**: Web interface, 3D rendering, visual feedback

### Communication
- **Socket.io**: Real-time bidirectional communication
- **State Sync**: Terminal actions instantly update galaxy animations
- **Color Coding**: Red (listening) → Blue (processing) → Green (speaking) → White (ready)

## 🎮 How to Use

1. **Start the server** using `npm start`
2. **Open your browser** to `http://localhost:3000`
3. **Type your message** in the terminal when prompted
4. **Watch the galaxy react** to your conversation phases:
   - 🔴 **Red**: Listening for input
   - 🔵 **Blue**: Processing your message
   - 🟢 **Green**: AI speaking response
   - ⚪ **White**: Ready for next interaction

## 🎛️ Customization Options

### Particle Settings
- **Count**: Modify `count` in `createGalaxy()` (default: 3000)
- **Size**: Adjust `geometry` radius and scale ranges
- **Distribution**: Modify radius calculation for different galaxy shapes

### Animation Settings
- **Movement Multipliers**: Adjust values in socket event handlers
- **Rotation Speeds**: Modify `animationSpeed` values
- **Camera Distance**: Change `camera.position.z`

### Color Scheme
- **State Colors**: Modify hex values in socket event handlers
- **Glow Opacity**: Adjust opacity in `updateGlowScene()`

### AI Settings
- **Model**: Change model name in `voice_ollama.js` (e.g., 'llama2:7b')
- **Prompt**: Modify the system prompt in `askOllama()` function
- **TTS**: Adjust TTS commands for different platforms

## 🐛 Troubleshooting

### Common Issues
1. **"Ollama not found"**: Ensure Ollama is installed and running
2. **"Port 3000 in use"**: Change PORT in `voice_ollama.js`
3. **"Particles not visible"**: Check browser WebGL support
4. **"Glow not working"**: Ensure browser supports WebGL extensions

### Debug Mode
- Open browser DevTools (F12)
- Check Console for detailed logging
- Verify Socket.io connection messages

## 📊 System Requirements

### Minimum Hardware
- **CPU**: Dual-core 2.5GHz+
- **RAM**: 4GB
- **GPU**: WebGL compatible
- **Storage**: 5GB (for Ollama models)

### Recommended Hardware
- **CPU**: Quad-core 3.0GHz+
- **RAM**: 8GB+
- **GPU**: Dedicated graphics card
- **Storage**: SSD with 10GB+ free space

## 🎯 Performance Tips

- **Particle Count**: Reduce to 1000-2000 for better performance
- **Geometry Detail**: Lower sphere segments for faster rendering
- **Animation Complexity**: Reduce movement calculations if needed
- **Browser**: Use Chrome/Firefox for best WebGL performance

## 📁 Project Structure

```
pc-ai-assistant/
├── package.json                 # Node.js dependencies and scripts
├── voice_ollama.js             # Main voice assistant server
├── README.md                   # Documentation
└── public/                     # Static web files
    ├── index.html              # Main HTML with Three.js setup
    └── visual.js               # Galaxy visualization engine
```

## 🔧 Advanced Configuration

### Alternative AI Models
```bash
# Use different Ollama models
ollama pull llama2:7b
# Change model name in voice_ollama.js
const stream = await ollama.generate('llama2:7b', prompt);
```

### Enhanced Voice Input
```javascript
// Add actual speech recognition (requires additional packages)
// npm install @google-cloud/speech
// Replace transcribeOnce() with actual microphone input
```

### Performance Optimization
- Reduce particle count for lower-end hardware
- Adjust animation frame rate
- Implement level-of-detail rendering

---

This complete implementation provides a production-ready voice assistant with stunning visual feedback! 🌟
