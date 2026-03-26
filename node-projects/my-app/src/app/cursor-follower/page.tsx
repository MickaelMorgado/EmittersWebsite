'use client';

import { VersionBadge } from '@/components/VersionBadge';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../../components/sidebar';

const STREAM_FPS = 60;
const MOUSE_SERVER_URL = 'ws://localhost:3003';
const MOUSE_SERVER_API = 'http://localhost:3003';

type Orientation = 'portrait' | 'landscape';

export default function CursorFollower() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparingCountdown, setPreparingCountdown] = useState(3);
  const [cropScale, setCropScale] = useState(0.5);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [status, setStatus] = useState('Ready to start');
  const [error, setError] = useState('');
  const [serverConnected, setServerConnected] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const canvasWidth = useMemo(() => orientation === 'portrait' ? 1080 : 1920, [orientation]);
  const canvasHeight = useMemo(() => orientation === 'portrait' ? 1920 : 1080, [orientation]);
  const targetAspect = useMemo(() => orientation === 'portrait' ? 9 / 16 : 16 / 9, [orientation]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const smoothMouseX = useRef(0);
  const smoothMouseY = useRef(0);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const screenWidth = useRef(1920);
  const screenHeight = useRef(1080);
  const capturedWidth = useRef(0);
  const capturedHeight = useRef(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const connectToMouseServer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(MOUSE_SERVER_URL);

      wsRef.current.onopen = () => {
        console.log('[Cursor Follower] Connected to mouse server');
        setServerConnected(true);
        setError('');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'mouse') {
            mouseX.current = data.x;
            mouseY.current = data.y;
          } else if (data.type === 'init') {
            mouseX.current = data.x;
            mouseY.current = data.y;
            screenWidth.current = data.screenWidth;
            screenHeight.current = data.screenHeight;
          }
        } catch (e) {
          console.error('[Cursor Follower] Failed to parse mouse data:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[Cursor Follower] Disconnected from mouse server');
        setServerConnected(false);
        setTimeout(connectToMouseServer, 2000);
      };

      wsRef.current.onerror = () => {
        setError('Mouse tracking server not running. Start with: npm run start:cursor-server');
        setServerConnected(false);
      };
    } catch (e) {
      setError('Failed to connect to mouse server');
    }
  }, []);

  const disconnectFromMouseServer = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const checkServerStatus = useCallback(async () => {
    try {
      const res = await fetch(`${MOUSE_SERVER_API}/status`);
      const data = await res.json();
      setServerRunning(data.status === 'running');
      return data;
    } catch {
      setServerRunning(false);
      return null;
    }
  }, []);

  const startMouseServer = useCallback(async () => {
    try {
      const res = await fetch(`${MOUSE_SERVER_API}/start`);
      const data = await res.json();
      if (data.status === 'starting' || data.status === 'already_running') {
        setServerRunning(true);
        return true;
      }
      return false;
    } catch {
      setError('Failed to start mouse server');
      return false;
    }
  }, []);

  const stopMouseServer = useCallback(async () => {
    try {
      await fetch(`${MOUSE_SERVER_API}/stop`);
      setServerRunning(false);
    } catch {
      // Ignore
    }
  }, []);

  const startCapture = useCallback(async () => {
    setError('');
    try {
      setStatus('Select what to share...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
        audio: false
      });

      mediaStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = videoTrack.getSettings() as any;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        capturedWidth.current = settings.displayWidth || videoRef.current.videoWidth;
        capturedHeight.current = settings.displayHeight || videoRef.current.videoHeight;
      }

      setIsPreparing(true);
      setPreparingCountdown(3);
      setStatus('Position your cursor...');

      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setPreparingCountdown(count);
        
        if (count === 0) {
          clearInterval(countdownInterval);
          setIsPreparing(false);
          connectToMouseServer();
          setIsStreaming(true);
          setStatus('Streaming...');
          startRenderLoop();
        }
      }, 1000);

    } catch (err: any) {
      console.error('[Cursor Follower] Error:', err);
      setError(err.message);
      setStatus('Failed to start');
    }
  }, [connectToMouseServer]);

  const stopCapture = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (canvasStreamRef.current) {
      canvasStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }

    disconnectFromMouseServer();
    setIsStreaming(false);
    setIsPreparing(false);
    setStatus('Stopped');
  }, [disconnectFromMouseServer]);

  const startRenderLoop = useCallback(() => {
    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const preview = previewRef.current;

      if (!video || !canvas || !preview || video.readyState < 2) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (vw === 0 || vh === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      // Calculate velocity from raw mouse position
      velocityX.current = mouseX.current - lastMouseX.current;
      velocityY.current = mouseY.current - lastMouseY.current;
      lastMouseX.current = mouseX.current;
      lastMouseY.current = mouseY.current;

      // Scale mouse from screen space to captured video space
      const scaleX = (capturedWidth.current || vw) / (screenWidth.current || 1);
      const scaleY = (capturedHeight.current || vh) / (screenHeight.current || 1);

      // Velocity-based smoothing: faster movement = less smoothing, slower = more smoothing
      const speed = Math.sqrt(velocityX.current ** 2 + velocityY.current ** 2);
      const baseSmoothing = 0.1;
      const velocityBoost = Math.min(speed / 50, 0.5); // Max 0.5 boost
      const smoothing = Math.min(baseSmoothing + velocityBoost, 0.6);

      // Apply smooth interpolation
      smoothMouseX.current += (mouseX.current - smoothMouseX.current) * smoothing;
      smoothMouseY.current += (mouseY.current - smoothMouseY.current) * smoothing;

      const scaledMouseX = smoothMouseX.current * scaleX;
      const scaledMouseY = smoothMouseY.current * scaleY;

      const currentTargetAspect = orientation === 'portrait' ? 9 / 16 : 16 / 9;
      let cropWidth, cropHeight;

      if (vw / vh > currentTargetAspect) {
        cropHeight = vh * cropScale;
        cropWidth = cropHeight * currentTargetAspect;
      } else {
        cropWidth = vw * cropScale;
        cropHeight = cropWidth / currentTargetAspect;
      }

      let srcX = scaledMouseX - cropWidth / 2;
      let srcY = scaledMouseY - cropHeight / 2;

      srcX = Math.max(0, Math.min(srcX, vw - cropWidth));
      srcY = Math.max(0, Math.min(srcY, vh - cropHeight));

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.drawImage(video, srcX, srcY, cropWidth, cropHeight, 0, 0, canvasWidth, canvasHeight);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, [cropScale, orientation]);

  useEffect(() => {
    if (isStreaming && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Reset smoothing on orientation change
      smoothMouseX.current = capturedWidth.current / 2;
      smoothMouseY.current = capturedHeight.current / 2;

      canvasStreamRef.current = canvas.captureStream(STREAM_FPS);
      if (previewRef.current) {
        previewRef.current.srcObject = canvasStreamRef.current;
      }
    }
  }, [isStreaming, orientation, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (isStreaming) {
      startRenderLoop();
    }
  }, [cropScale, isStreaming, startRenderLoop]);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  useEffect(() => {
    setMounted(true);
    checkServerStatus();
  }, []);

  return (
    <div className="relative h-screen overflow-hidden mx-auto max-w-screen bg-[#0a0a0f]">
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute top-0 left-0 w-32 h-24 opacity-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 flex items-center justify-center">
        {isStreaming ? (
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        ) : isPreparing ? (
          <div className="text-center p-8">
            <div className="text-yellow-400 text-6xl font-bold mb-4">
              {preparingCountdown}
            </div>
            <div className="text-white text-lg mb-2">
              Position your cursor
            </div>
            <div className="text-gray-400 text-sm">
              Place your cursor where you want to start tracking from
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 border-2 border-yellow-400/50 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 bg-yellow-400 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="text-gray-500 text-sm mb-4">
              Portrait 9:16 stream centered on mouse cursor
            </div>
            <button
              onClick={startCapture}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
            >
              Start Screen Capture
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-16 z-10">
        <div className="bg-black/40 backdrop-blur-md rounded border border-white/5 p-4">
          <h1 className="text-white text-lg font-light tracking-[0.2em] mb-1 uppercase">Cursor Follower</h1>
          <div className="flex items-center gap-3 text-[10px] tracking-widest">
            <span className={isPreparing ? 'text-yellow-400' : isStreaming ? 'text-green-400' : 'text-gray-600'}>
              {status}
            </span>
            <span className={serverConnected ? 'text-green-400' : 'text-red-400'}>
              {serverConnected ? 'TRACKING' : 'NO TRACKER'}
            </span>
          </div>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} title="Stream Settings">
        {error && (
          <div className="mb-4 p-4 bg-red-950/50 border border-red-500 text-red-200 text-xs rounded">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-4 font-bold">Mouse Server</h2>
          <div className="text-[10px] text-gray-400 space-y-2">
            <p>Server: {MOUSE_SERVER_URL}</p>
            <p className={serverRunning ? 'text-green-400' : 'text-red-400'}>
              Server: {serverRunning ? 'Running' : 'Stopped'}
            </p>
            <p className={serverConnected ? 'text-green-400' : 'text-red-400'}>
              Tracker: {serverConnected ? 'Connected' : 'Disconnected'}
            </p>
            {!serverRunning && (
              <button
                onClick={startMouseServer}
                className="mt-2 w-full py-2 bg-indigo-600 text-white text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all"
              >
                Start Mouse Server
              </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-4 font-bold">Orientation</h2>
          {mounted ? (
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as Orientation)}
              className="w-full bg-[#1a1a22] text-gray-300 text-[10px] px-3 py-2 rounded border border-white/10 focus:border-indigo-500 focus:outline-none"
            >
              <option value="portrait">Portrait (1080x1920)</option>
              <option value="landscape">Landscape (1920x1080)</option>
            </select>
          ) : (
            <div className="w-full bg-[#1a1a22] text-gray-400 text-[10px] px-3 py-2 rounded border border-white/10">
              Loading...
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-4 font-bold">Zoom Level</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-2">
                <span>Crop Scale</span>
                <span className="text-indigo-400">{cropScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={cropScale}
                onChange={(e) => setCropScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                <span>Tighter</span>
                <span>Full</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-4 font-bold">Controls</h2>
          <div className="space-y-2">
            {!isStreaming && !isPreparing ? (
              <button
                onClick={startCapture}
                className="w-full py-2 bg-indigo-600 text-white text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all"
              >
                Start Capture
              </button>
            ) : isPreparing ? (
              <button
                onClick={stopCapture}
                className="w-full py-2 bg-red-600/50 text-white/50 text-[10px] uppercase tracking-widest cursor-not-allowed"
                disabled
              >
                Starting...
              </button>
            ) : (
              <button
                onClick={stopCapture}
                className="w-full py-2 bg-red-600 text-white text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-indigo-950/10 border border-indigo-900/30 rounded">
          <h3 className="text-white text-[10px] uppercase tracking-widest mb-3 font-bold">Output</h3>
          <ul className="text-gray-500 text-[9px] space-y-2 uppercase tracking-tighter">
            <li>• Resolution: {mounted ? `${canvasWidth}x${canvasHeight}` : '1080x1920'}</li>
            <li>• Aspect: {mounted ? (orientation === 'portrait' ? '9:16 Portrait' : '16:9 Landscape') : '9:16 Portrait'}</li>
            <li>• FPS: {STREAM_FPS}</li>
            <li>• Python + WebSocket tracking</li>
          </ul>
        </div>
      </Sidebar>

      <VersionBadge projectName="cursor-follower" />
    </div>
  );
}
