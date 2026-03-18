'use client';

import { Galaxy, GalaxyAnimationState } from '@/components/galaxy';
import { VersionBadge } from "@/components/VersionBadge";
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// TikTok TTS + AI Assistant Integrated Component
export default function TikTokTTS() {
  const [visualMode, setVisualMode] = useState<'default'|'overlay'>('default')

  function ChromakeyOverlay() {
    return (
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={["#00ff00"]} />
        <ambientLight intensity={1} />
        <mesh rotation={[0.3, 0.6, 0]}>
          <icosahedronGeometry args={[2.5, 0]} />
          <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.8} />
        </mesh>
      </Canvas>
    )
  }
  // TikTok State
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [tiktokMessages, setTiktokMessages] = useState<string[]>([]);

// AI Assistant State
  const [aiSocket, setAiSocket] = useState<Socket | null>(null);
  const [aiStatus, setAiStatus] = useState('Ready 🎨');
  const [aiAnimationState, setAiAnimationState] = useState<GalaxyAnimationState>('idle');
  const [aiConversationLines, setAiConversationLines] = useState<string[]>([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // AI Context Category State
  const [categories, setCategories] = useState<{id: string; name: string; description: string}[]>([
    { id: 'default', name: 'Default', description: 'Developer AI assistant' },
    { id: 'racing', name: 'Racing Gaming', description: 'Focus on racing games, F1, sim racing' },
    { id: 'stalker', name: 'Stalker Gaming', description: 'Focus on S.T.A.L.K.E.R. game series' }
  ]);
  const [currentCategory, setCurrentCategory] = useState('default');

  // Shared Animation State (Priority: AI > TikTok Event > Idle)
  const [animationState, setAnimationState] = useState<GalaxyAnimationState>('idle');
  const [particleColor, setParticleColor] = useState('#ffffff');

  // Refs for scrolling
  const tiktokFeedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll TikTok Feed
  useEffect(() => {
    if (tiktokFeedRef.current) {
      tiktokFeedRef.current.scrollTop = tiktokFeedRef.current.scrollHeight;
    }
  }, [tiktokMessages]);

  // Audio Logic
  const [audioEnabled, setAudioEnabled] = useState(false);
  const statusChangeSound = useRef<HTMLAudioElement | null>(null);
  const processingSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio objects
    statusChangeSound.current = new Audio('/joseegn_ui_sound_select.wav');
    processingSound.current = new Audio('/squirrel_404_click_tick.wav');

    // Enable audio on user interaction
    const enableAudio = () => {
      setAudioEnabled(true);
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, []);

  // Play sound on status change
  useEffect(() => {
    if (aiStatus !== 'Ready 🎨' && audioEnabled && statusChangeSound.current && processingSound.current) {
      if (aiStatus.includes('Processing')) {
        processingSound.current.currentTime = 0;
        processingSound.current.play().catch(e => console.log('Audio play failed:', e));
      } else {
        statusChangeSound.current.currentTime = 0;
        statusChangeSound.current.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  }, [aiStatus, audioEnabled]);

  // Visual mode (default vs chroma overlay)
  // Visual mode toggle for overlay features
  // Connect to TikTok livestream WebSocket
  const connectToTiktok = () => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      setTiktokConnected(true);
      console.log('Integrated App: Connected to TikTok backend');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'comment') {
        handleNewTiktokComment(data.user, data.message);
      }
    };

    ws.onclose = () => {
      setTiktokConnected(false);
      console.log('Integrated App: Disconnected from TikTok backend');
    };
    
    ws.onerror = (err) => {
      console.error('TikTok WebSocket error:', err);
    };
  };

  // Connect to AI Assistant Socket.io
  useEffect(() => {
    console.log('Integrated App: Initializing AI Socket.io connection...');
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    setAiSocket(socket);

    socket.on('connect', () => {
      console.log('Integrated App: Connected to AI voice server');
      setAiStatus('Ready 🎨');
    });

    socket.on('speech_start', () => {
      setAiAnimationState('listening');
      setParticleColor('#ff0000');
      setAiStatus('Listening... 🔴');
    });

    socket.on('speech_end', () => {
      setAiAnimationState('processing');
      setParticleColor('#0000ff');
      setAiStatus('Processing... 🔵');
    });

    socket.on('stt_correcting', () => {
      setAiAnimationState('event');
      setParticleColor('#00ffff');
      setAiStatus('Fixing Speech... ✨');
    });

    socket.on('ai_response_start', () => {
      setAiAnimationState('speaking');
      setParticleColor('#00ff00');
      setAiStatus('Speaking... 🟢');
    });

    socket.on('ai_response_end', () => {
      setAiAnimationState('idle');
      setParticleColor('#ffffff');
      setAiStatus('Ready 🎨');
    });

    socket.on('user_speech', (text: string) => {
      setAiConversationLines(prev => [...prev, `You: ${text}`]);
    });

    socket.on('ai_response', (text: string) => {
      setAiConversationLines(prev => [...prev, `AI: ${text}`]);
    });

    socket.on('idle', () => {
        setAiStatus('Ready 🎨');
        setAiAnimationState('idle');
        setParticleColor('#ffffff');
    });

    socket.on('mic_status', (enabled: boolean) => {
      setMicEnabled(enabled);
    });

    socket.on('categories', (cats: {id: string; name: string; description: string}[]) => {
      setCategories(cats);
    });

    socket.on('category_change', (category: string) => {
      setCurrentCategory(category);
    });

    // Request categories on connect
    socket.emit('get_categories');

    return () => {
      socket.close();
    };
  }, []);

  // Synchronize overall animation state
  useEffect(() => {
    if (aiAnimationState !== 'idle') {
      setAnimationState(aiAnimationState);
    } else {
      setAnimationState('idle');
    }
  }, [aiAnimationState]);

  // Handle new TikTok comments
  const handleNewTiktokComment = async (user: string, message: string) => {
    const fullMessage = `${user}: ${message}`;
    console.log('New TikTok Comment:', fullMessage);
    console.log('AI Auto-Reply State:', { aiAutoReply, aiStatus, hasSocket: !!aiSocket });

    setTiktokMessages(prev => [...prev, fullMessage]);
    
    // Auto-reply logic: Speak the comment THEN ask the AI for a reply
    const canReply = aiAnimationState === 'idle' || aiAnimationState === 'listening' || aiAnimationState === 'event';
    
    console.log('[DEBUG] AI Reply Check:', { 
        aiAutoReply, 
        canReply, 
        currentState: aiAnimationState, 
        hasSocket: !!aiSocket 
    });

    if (aiAutoReply && canReply && aiSocket) {
        console.log('--- AI Auto-Reply Conditions Met ---');
        // Visual trigger
        setAiAnimationState('event');
        setParticleColor('#00ffff');

        // 1. Speak the user's message so the stream hears it
        console.log('Emitting speak event...');
        aiSocket.emit('speak', `${user} says: ${message}`);
        
        // 2. Send to AI for a real-time reactive reply
        console.log('Sending live comment to AI for reply:', message);
        aiSocket.emit('message', `${user} said: ${message}`);
    } else {
        console.log('--- AI Auto-Reply Conditions NOT Met ---');
        // Fallback for visual only
        setAiAnimationState('event');
        setParticleColor('#00ffff');
        setTimeout(() => {
            setAiAnimationState('idle');
            setParticleColor('#ffffff');
        }, 2000);
    }
  };


  const handleSendAiMessage = () => {
    if (aiSocket && aiInputMessage.trim()) {
      aiSocket.emit('message', aiInputMessage.trim());
      setAiInputMessage('');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Header / Titles */}
      <div className="absolute top-5 left-5 z-10">
        <h1 className="text-white text-2xl font-bold drop-shadow-lg">
          TikTok + AI Galaxy 🌌
        </h1>
      </div>

      <div className="absolute top-5 right-5 z-10">
        {/* Control Card with LED Toggles */}
        <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl min-w-[200px]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">System Controls</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          
          <div className="flex flex-col gap-3">
            {/* Visual mode select (like AI Context) */}
            <div className="group flex flex-col gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-blue-500/20 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  <circle cx="12" cy="12" r="3" />
</svg>
                </div>
                <span className="text-xs font-medium text-white/90">Visual Mode</span>
              </div>
              <select
                value={visualMode}
                onChange={(e) => setVisualMode(e.target.value as 'default' | 'overlay')}
                className="bg-black/60 text-white border border-white/20 rounded px-2 py-1"
              >
                <option value="default">Default (Galaxy)</option>
                <option value="overlay">Chroma Overlay</option>
              </select>
            </div>

            {/* AI Context Category Selector */}
            <div className="group flex flex-col gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-blue-500/20 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-white/90">AI Context</span>
              </div>
              <select
                value={currentCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setCurrentCategory(newCategory);
                  aiSocket?.emit('set_category', newCategory);
                }}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Auto Reply Toggle */}
            <div className="group flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  aiAutoReply ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" x2="12" y1="19" y2="22"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-white/90">AI Auto Reply</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiAutoReply}
                  onChange={() => setAiAutoReply(!aiAutoReply)}
                  className="sr-only peer"
                />
                <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                  aiAutoReply ? 'bg-green-500/40' : 'bg-red-500/40'
                }`}>
                  {/* LED Dot */}
                  <div 
                    className={`absolute top-[4px] left-[6px] w-4 h-4 rounded-full transition-all duration-300 ${
                      aiAutoReply 
                        ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8),0_0_16px_rgba(74,222,128,0.4)] translate-x-5' 
                        : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8),0_0_16px_rgba(248,113,113,0.4)]'
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* TikTok Connect Toggle */}
            <button 
              onClick={() => !tiktokConnected && connectToTiktok()}
              className={`group flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors w-full ${tiktokConnected ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  tiktokConnected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-white/90">TikTok Live</span>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                tiktokConnected ? 'bg-green-500/40' : 'bg-red-500/40'
              }`}>
                {/* LED Dot */}
                <div 
                  className={`absolute top-[4px] left-[5px] w-4 h-4 rounded-full transition-all duration-300 ${
                    tiktokConnected 
                      ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8),0_0_16px_rgba(74,222,128,0.4)] translate-x-5' 
                      : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8),0_0_16px_rgba(248,113,113,0.4)]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3D Galaxy Canvas (switchable) */}
      <div className="absolute inset-0">
        {visualMode === 'default' ? (
          <Canvas camera={{ position: [0, 20, 75], fov: 60, near: 1.0 }}>
          <Suspense fallback={null}>
            <color attach="background" args={["#000000"]} />
            <ambientLight intensity={0.6} />
            <pointLight position={[0, 0, 500]} intensity={1} color="#4169E1" />
            
            <Galaxy
              count={3000}
              spacing={1}
              color={particleColor}
              animationState={animationState}
            />

            <OrbitControls autoRotate autoRotateSpeed={animationState === 'idle' ? 0.5 : 2} />

            <EffectComposer>
              <Bloom luminanceThreshold={0} luminanceSmoothing={1} height={100} intensity={2} />
              <Noise opacity={0.03} />
              <Vignette offset={0.001} darkness={1} />
            </EffectComposer>
          </Suspense>
          </Canvas>
        ) : (
          <ChromakeyOverlay />
        )}
      </div>

      {/* Main UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        
        {/* TikTok Feed (Left) */}
        <div className="fixed w-80 pointer-events-auto mt-20">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 h-96 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">TikTok Live Feed</h3>
            <div ref={tiktokFeedRef} className="flex-1 overflow-y-auto space-y-2 scrollbar-none scroll-smooth">
              {tiktokMessages.map((msg, i) => (
                <div key={i} className="text-sm text-white bg-white/5 p-2 rounded border-l-2 border-cyan-500">
                  {msg}
                </div>
              ))}
              {tiktokMessages.length === 0 && <p className="text-gray-600 text-xs italic">Waiting for live events...</p>}
            </div>
          </div>
        </div>

        {/* Bottom Interaction Area */}
        <div className="fixed bottom-0 pb-4 left-0 w-full">
          <div className="max-w-4xl mx-auto max-h-[40vh] flex flex-col gap-4 pointer-events-auto overflow-y-auto scrollbar-none">
            
            {/* AI Status Indicator */}
            <div className="flex flex-col items-center gap-1 mb-2 animate-pulse">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                    <div 
                        className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: particleColor, color: particleColor }}
                    />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/80">
                        {aiStatus}
                    </span>
                </div>
            </div>

            {/* AI Conversation Lines (Floating) */}
            <div 
              className="flex flex-col items-center gap-2 mb-4 h-48 justify-end overflow-hidden"
              style={{ 
                maskImage: 'linear-gradient(to bottom, transparent, black 70%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 70%)'
              }}
            >
              {aiConversationLines.slice(-3).map((line, i) => (
                <div key={i} className={`text-lg font-light transition-all duration-500 ${line.startsWith('AI:') ? 'text-green-400' : 'text-white'}`}>
                  {line}
                </div>
              ))}
            </div>

{/* AI Input */}
            <div className="flex gap-2 bg-black/50 backdrop-blur-xl border border-white/10 p-2 rounded-full items-center">
              <button
                onClick={() => {
                  const newState = !micEnabled
                  setMicEnabled(newState)
                  aiSocket?.emit('mic_toggle', newState)
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all shrink-0 ${
                  micEnabled 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                }`}
              >
                {micEnabled ? '🎤' : '🔇'}
              </button>
              <input
                type="text"
                placeholder="Talk to the AI Assistant..."
                value={aiInputMessage}
                onChange={(e) => setAiInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white px-2 py-2"
              />
              <button
                onClick={handleSendAiMessage}
                className="bg-primary hover:bg-primary/80 text-white p-2 rounded-full px-6 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status & Instructions (Optional) */}
      <div className="absolute bottom-5 right-5 text-right z-10">
        <p className="text-gray-500 text-[10px] uppercase tracking-tighter">
          Galaxy: Reacts to TikTok Comments & AI Voice<br/>
          AI Server: Port 3001 | TikTok Server: Port 8080<br/>
          {!audioEnabled && "Click anywhere to enable status sounds"}
        </p>
      </div>
      <VersionBadge projectName="tiktok-tts" />
    </div>
  );
}
    // Overlay mode toggle hook (for future dynamic overlay)
