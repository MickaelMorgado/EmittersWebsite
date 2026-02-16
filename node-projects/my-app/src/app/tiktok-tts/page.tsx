'use client';

import { Galaxy, GalaxyAnimationState } from '@/components/galaxy';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// TikTok TTS + AI Assistant Integrated Component
export default function TikTokTTS() {
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

  // Connect to TikTok livestream WebSocket
  const connectToTiktok = () => {
    const ws = new WebSocket('ws://localhost:8080/tiktok-stream');
    
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
        <div className="flex items-center gap-3">
            <p className="text-cyan-400 text-[10px] tracking-widest uppercase opacity-50">
                {tiktokConnected ? 'TikTok Live Active' : 'Waiting for TikTok...'}
            </p>
        </div>
      </div>

      <div className="absolute top-5 right-5 z-10 flex gap-2">
        <button
          onClick={() => setAiAutoReply(!aiAutoReply)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
            aiAutoReply ? 'bg-purple-600 text-white border-purple-400' : 'bg-transparent text-purple-400 border-purple-400 hover:bg-purple-400/10'
          }`}
        >
          {aiAutoReply ? '🤖 AI Auto-Reply ON' : '🤖 AI Auto-Reply OFF'}
        </button>
        <button
          onClick={connectToTiktok}
          disabled={tiktokConnected}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            tiktokConnected ? 'bg-green-600/50 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {tiktokConnected ? 'TikTok Active' : 'Connect TikTok'}
        </button>
      </div>

      {/* 3D Galaxy Canvas */}
      <div className="absolute inset-0">
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
            <div className="flex gap-2 bg-black/50 backdrop-blur-xl border border-white/10 p-2 rounded-full">
              <input
                type="text"
                placeholder="Talk to the AI Assistant..."
                value={aiInputMessage}
                onChange={(e) => setAiInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4 py-2"
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
    </div>
  );
}
