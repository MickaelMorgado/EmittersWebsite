'use client';

import { useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { GUI } from 'lil-gui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Sidebar from '../../components/sidebar';

interface Device {
  deviceId: string;
  label: string;
}

// MediaPipe Pose types
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface Results {
  poseLandmarks: NormalizedLandmark[];
  poseWorldLandmarks: NormalizedLandmark[];
  segmentationMask: any;
  image: any;
}

// Robot Head GLTF Component with Fallback
function RobotHead() {
  const { scene } = useGLTF('/assets/models/robot-head.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: '#000810',
          metalness: 0.95,
          roughness: 0.05,
          emissive: '#001122',
          emissiveIntensity: 0.5,
          flatShading: true,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1
        });
      }
    });
    return clone;
  }, [scene]);

  if (!clonedScene) {
    return (
      <mesh>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshPhysicalMaterial
          color="#000810"
          metalness={0.95}
          roughness={0.05}
          emissive="#001122"
          emissiveIntensity={0.5}
          flatShading={true}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
    );
  }

  return <primitive object={clonedScene} scale={5} rotation={[0, 0, Math.PI]} />;
}

// Low Poly Origami Human Character - Optimized for "Cyberpunk Obsidian/Chrome" Look
function OrigamiCharacter({ landmarks }: { landmarks: any[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const [smoothedLandmarks, setSmoothedLandmarks] = useState<any[]>([]);
  
  // High smoothing factor (0.96) for professional liquid-smooth animation
  useEffect(() => {
    if (landmarks.length > 0) {
      setSmoothedLandmarks(prev => {
        if (prev.length === 0) return landmarks;
        return landmarks.map((lm, i) => ({
          x: prev[i] ? prev[i].x * 0.96 + lm.x * 0.05 : lm.x,
          y: prev[i] ? prev[i].y * 0.96 + lm.y * 0.05 : lm.y,
          z: prev[i] ? (prev[i].z || 0) * 0.96 + (lm.z || 0) * 0.05 : (lm.z || 0),
          visibility: lm.visibility
        }));
      });
    }
  }, [landmarks]);

  const getPoint = (index: number): THREE.Vector3 => {
    const lm = smoothedLandmarks[index];
    if (!lm || (lm.visibility !== undefined && lm.visibility < 0.2)) {
      return new THREE.Vector3(0, 0, 0);
    }
    // Vertical scale 5, horizontal 5. Z-axis is mapped directly (lm.z * 5) 
    // to ensure closer phone distance = closer 3D distance.
    return new THREE.Vector3(-(lm.x - 0.5) * 5, -(lm.y - 0.5) * 5, (lm.z || 0) * 5);
  };

  useFrame(() => {
    if (!groupRef.current || smoothedLandmarks.length === 0) return;

    // Position character with liquid lerping on all axes
    const shoulderCenter = getPoint(11).add(getPoint(12)).multiplyScalar(0.5);
    const targetX = 0;
    const targetY = -shoulderCenter.y - 1; // Lower altitude to center torso
    const targetZ = 0; // Fixed position in front of camera

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.1);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);

    // Rotate entire avatar to face camera
    groupRef.current.rotation.y = Math.PI;

    const nose = getPoint(0);
    const leftEar = getPoint(7);
    const rightEar = getPoint(8);

    if (nose.length() > 0 && leftEar.length() > 0 && rightEar.length() > 0) {
      const headGroup = groupRef.current.getObjectByName('headGroup');
      if (headGroup) {
        // Head rotation relative to body facing camera
        // Yaw: Left/Right rotation
        const targetYaw = (rightEar.z - leftEar.z) * 0.6 + 0.8; // Inverted for facing camera
        // Pitch: Up/Down tilt
        const targetPitch = (nose.y - (leftEar.y + rightEar.y) / 2) * 3.0 + 0.2;
        // Roll: Side-to-side head tilt
        const targetRoll = Math.atan2(rightEar.y - leftEar.y, leftEar.x - rightEar.x) * 1.2; // Adjusted for facing

        // Liquid-smooth rotation lerping
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetPitch, 0.1);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetYaw, 0.1);
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, targetRoll, 0.1);
      }
    }
  });

  const neonMaterial = new THREE.MeshStandardMaterial({
    color: '#00d4ff',
    emissive: '#00d4ff',
    emissiveIntensity: 10,
  });

  if (smoothedLandmarks.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Head - 3D Robot Mesh */}
      <group name="headGroup" position={getPoint(0)}>
        <RobotHead />
        {/* Neon Eyes - Positioned on robot head */}
        <mesh position={[0.08, 0.08, 0.25]} material={neonMaterial}>
          <boxGeometry args={[0.05, 0.01, 0.02]} />
        </mesh>
      </group>

      {/* Dramatic Rim Light */}
      <pointLight position={[0, 3, -3]} intensity={60} color="#00d4ff" distance={10} />
    </group>
  );
}

// Debug Skeleton Visualization
function DebugSkeleton({ landmarks }: { landmarks: any[] }) {
  const getPoint = (lm: any): THREE.Vector3 => {
    return new THREE.Vector3(-(lm.x - 0.5) * 5, -(lm.y - 0.5) * 5, (lm.z || 0) * 5);
  };

  if (landmarks.length === 0) return null;

  const connections = [
    [11, 12], [0, 11], [0, 12],
    [0, 1], [1, 2], [2, 3],
    [0, 4], [4, 5], [5, 6]
  ];

  return (
    <group position={[0, -0.5, 0]}>
      {landmarks.map((lm, i) => (
        <mesh key={i} position={getPoint(lm)}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color={lm.visibility > 0.3 ? "#00ff00" : "#ff0000"} />
        </mesh>
      ))}
      
      {connections.map(([a, b], i) => {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        if (!p1 || !p2) return null;
        
        const v1 = getPoint(p1);
        const v2 = getPoint(p2);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([v1, v2]);
        
        return (
          <primitive key={`line-${i}`} object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#00ff00" }))} />
        );
      })}
    </group>
  );
}

// Scene Setup with Rim Lighting and Bloom
function Scene({ landmarks, showDebug }: { landmarks: any[], showDebug: boolean }) {
  const { camera } = useThree();
  const guiRef = useRef<GUI | null>(null);

  useEffect(() => {
    // Initialize lil-gui for camera controls
    if (!guiRef.current) {
      guiRef.current = new GUI();
      const cameraFolder = guiRef.current.addFolder('Camera Position');

      const cameraParams = {
        x: 0,
        y: 2,
        z: 10
      };

      cameraFolder.add(cameraParams, 'x', -10, 10, 0.1).onChange((value: number) => {
        camera.position.x = value;
      });
      cameraFolder.add(cameraParams, 'y', -10, 10, 0.1).onChange((value: number) => {
        camera.position.y = value;
      });
      cameraFolder.add(cameraParams, 'z', 0, 20, 0.1).onChange((value: number) => {
        camera.position.z = value;
      });

      cameraFolder.open();
    }

    // Set initial camera position
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    // Cleanup GUI on unmount
    return () => {
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
    };
  }, [camera]);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.05} color="#001122" />
      
      {/* Strong Rim Lights */}
      <directionalLight position={[-10, 5, -10]} intensity={35} color="#00ddff" />
      <directionalLight position={[10, 5, -10]} intensity={35} color="#0088ff" />
      <pointLight position={[0, 5, 5]} intensity={4000} color="#aaaaff" />

      {/* Subtle Grid Floor */}
      {/* <gridHelper args={[40, 80, '#001122', '#000205']} position={[0, -2, 0]} /> */}
      
      <OrigamiCharacter landmarks={landmarks} />
      {showDebug && <DebugSkeleton landmarks={landmarks} />}

      <fog attach="fog" args={['#000103', 2, 8]} />

      <EffectComposer>
        <Bloom 
          intensity={0.05} 
          luminanceThreshold={0.1} 
          luminanceSmoothing={0.9} 
          mipmapBlur 
        />
      </EffectComposer>
    </>
  );
}

// Main Component
export default function CameraEffects() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);

  const requestPermission = async () => {
    setErrorMessage('');
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ deviceId: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 4)}` }));
      setDevices(videoDevices);
      setPermissionGranted(true);
    } catch (error: any) {
      console.error('Error enumerating devices:', error);
      setErrorMessage(`Failed to access cameras: ${error.message}`);
    }
  };

  const onResults = useCallback((results: Results) => {
    if (results.poseLandmarks) {
      setLandmarks(results.poseLandmarks);
    }
  }, []);

  const startPoseDetection = async (deviceId: string) => {
    if (!videoRef.current) return;

    try {
      await stopPoseDetection();

      if (!(window as any).Pose) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = (e) => reject(e);
          document.head.appendChild(script);
        });
      }

      const PoseClass = (window as any).Pose;
      const pose = new PoseClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);
      poseRef.current = pose;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError: any) {
          if (playError.name !== 'AbortError') throw playError;
        }

        const processVideo = async () => {
          if (videoRef.current && poseRef.current && !videoRef.current.paused && !videoRef.current.ended) {
            await poseRef.current.send({ image: videoRef.current });
          }
          requestRef.current = requestAnimationFrame(processVideo);
        };
        processVideo();
        setIsDetecting(true);
      }
    } catch (error: any) {
      console.error('Error starting pose detection:', error);
      setErrorMessage(`Failed to start pose detection: ${error.message}`);
    }
  };

  const stopPoseDetection = async () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    setIsDetecting(false);
    setLandmarks([]);
  };

  useEffect(() => {
    return () => {
      stopPoseDetection();
    };
  }, []);

  const selectDevice = async (deviceId: string) => {
    setErrorMessage('');
    if (selectedDevice === deviceId) {
      await stopPoseDetection();
      setSelectedDevice('');
      return;
    }
    setSelectedDevice(deviceId);
    await startPoseDetection(deviceId);
  };

  return (
    <div className="relative h-screen overflow-hidden mx-auto max-w-screen bg-[#000103]">
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute top-0 left-0 w-32 h-24 opacity-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />

      <div className="absolute inset-0 w-full h-full">
        <Canvas 
          gl={{ antialias: false, powerPreference: "high-performance" }} 
          dpr={[1, 2]}
        >
          <Scene landmarks={landmarks} showDebug={showDebug} />
        </Canvas>
      </div>

      {isDetecting && (
        <div className="absolute top-4 right-4 w-48 h-36 bg-black border border-cyan-500/30 rounded overflow-hidden shadow-lg z-20">
          <video
            ref={(el) => {
              if (el && videoRef.current) el.srcObject = videoRef.current.srcObject;
            }}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute top-1 left-1 bg-black/70 text-[8px] text-cyan-400 px-1 rounded uppercase tracking-widest">Live Feed</div>
        </div>
      )}

      <div className="absolute bottom-4 left-16 z-10">
        <div className="bg-black/40 backdrop-blur-md rounded border border-white/5 p-4">
          <h1 className="text-white text-lg font-light tracking-[0.2em] mb-1 uppercase">Cyber-Bust Visualizer</h1>
          <div className="flex items-center gap-3 text-[10px] tracking-widest text-cyan-500/80">
            <span className={isDetecting ? 'text-cyan-400' : 'text-red-900'}>
              {isDetecting ? 'SYSTEM ACTIVE' : 'STANDBY'}
            </span>
            <span>|</span>
            <span>{landmarks.length > 0 ? `SYNCED [${landmarks.length} PTS]` : 'WAITING FOR DATA'}</span>
          </div>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} title="Visualizer Settings">
        {errorMessage && <div className="mb-4 p-4 bg-red-950/50 border border-red-500 text-red-200 text-xs rounded">{errorMessage}</div>}
        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 mb-4 font-bold">Input Selection</h2>
          {!permissionGranted ? (
            <button onClick={requestPermission} className="w-full py-2 bg-cyan-950/30 border border-cyan-500/50 text-cyan-400 text-[10px] uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">Initialize Camera</button>
          ) : (
            <div className="space-y-1">
              {devices.length === 0 ? (
                <p className="text-gray-600 text-[10px]">NO HARDWARE DETECTED</p>
              ) : (
                devices.map(device => (
                  <label key={device.deviceId} className={`flex items-center space-x-3 text-[10px] p-2 rounded cursor-pointer transition-all border ${selectedDevice === device.deviceId ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'border-transparent text-gray-500 hover:bg-white/5'}`} onClick={() => selectDevice(device.deviceId)}>
                    <input type="radio" name="camera" checked={selectedDevice === device.deviceId} onChange={() => selectDevice(device.deviceId)} className="hidden" />
                    <span className="truncate uppercase tracking-wider">{device.label || `CAM_${device.deviceId.slice(0, 4)}`}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-8">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 mb-4 font-bold">Diagnostic Overlay</h2>
          <label className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
            <span className="text-[10px] text-gray-300 uppercase tracking-widest">Motion Capture Debug</span>
            <div className="relative">
              <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} className="sr-only peer" />
              <div className="w-8 h-4 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white"></div>
            </div>
          </label>
        </div>

        <div className="mt-8 p-4 bg-cyan-950/10 border border-cyan-900/30 rounded">
          <h3 className="text-white text-[10px] uppercase tracking-widest mb-3 font-bold">Protocol</h3>
          <ul className="text-gray-500 text-[9px] space-y-2 uppercase tracking-tighter">
            <li>• Ensure optimal lighting for facets</li>
            <li>• Avatar syncs with head & shoulders</li>
            <li>• Maintain direct webcam alignment</li>
          </ul>
        </div>
      </Sidebar>
    </div>
  );
}
