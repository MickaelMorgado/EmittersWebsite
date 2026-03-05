'use client';

import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Sidebar from '../../components/sidebar';
import { VersionBadge } from "@/components/VersionBadge";
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { GCodePoint, parseGCode } from './gcodeParser';
import { loadSTLModel, setupSTLModelForVisualization } from './stlLoader';


function GCodeVisualizer({ points, isPlaying, speed, progress, onProgressChange }: {
  points: GCodePoint[],
  isPlaying: boolean,
  speed: number,
  progress: number,
  onProgressChange: (progress: number) => void
}) {
  const { camera, controls } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const targetCameraPosition = useRef(new THREE.Vector3(200, 200, 200));

  // Transform points for better initial orientation
  const transformedPoints = useMemo(() => {
    if (points.length === 0) return points;

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });

    // Calculate center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Calculate scale to fit in reasonable bounds - further increased for better visibility
    const maxDimension = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const scale = maxDimension > 0 ? 300 / maxDimension : 1;

    // Transform points: center, scale, and rotate for better viewing (-90° around X axis)
    return points.map(point => {
      const centeredX = (point.x - centerX) * scale;
      const centeredY = (point.y - centerY) * scale;
      const centeredZ = (point.z - centerZ) * scale;

      // Rotate -90° around X axis to lay model flat
      const rotatedY = centeredY * Math.cos(-Math.PI/2) - centeredZ * Math.sin(-Math.PI/2);
      const rotatedZ = centeredY * Math.sin(-Math.PI/2) + centeredZ * Math.cos(-Math.PI/2);

      return {
        ...point,
        x: centeredX,
        y: rotatedY,
        z: rotatedZ
      };
    });
  }, [points]);

  const [completedLineObject] = useState(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.01, // Low opacity for completed lines
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    return new THREE.Line(geometry, material);
  });

  const [currentSegmentObject] = useState(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 1, // Will be set to 1.0 when drawing positive extrusion
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    return new THREE.Line(geometry, material);
  });

  const [nozzleObject] = useState(() => {
    // Create a cone geometry for nozzle effect
    const geometry = new THREE.ConeGeometry(1, 8, 8);
    // Translate geometry so the tip is at the origin (0,0,0) instead of the center
    // Height is 8, so we move it down by 4 to bring the tip to 0
    geometry.translate(0, -4, 0);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000, // red
      emissive: 0xff0000,
      emissiveIntensity: 15.0, // Increased for more intense red glow
      transparent: true,
      opacity: 1,
      depthTest: false,  // Ensure nozzle is always visible on top
      depthWrite: false
    });
    const cone = new THREE.Mesh(geometry, material);
    // Rotate cone to point downward (negative Y direction)
    // Since tip is at origin, rotating will keep the tip at the point of contact
    cone.rotation.x = Math.PI;
    // Ensure nozzle renders on top of filament lines
    cone.renderOrder = 1;
    return cone;
  });

  useFrame((state, delta) => {
    if (transformedPoints.length === 0) return;

    if (isPlaying) {
      // Update progress based on speed
      const newProgress = Math.min(progress + (delta * speed * 0.01), 1);
      onProgressChange(newProgress);
    }

    const currentPointIndex = Math.floor(progress * (transformedPoints.length - 1));
    const nextPointIndex = Math.min(currentPointIndex + 1, transformedPoints.length - 1);
    const t = (progress * (transformedPoints.length - 1)) - currentPointIndex;

    // Get completed points (all points up to current point)
    const completedPoints = transformedPoints.slice(0, Math.max(0, currentPointIndex));

    // Get current segment points
    const currentSegmentPoints: typeof transformedPoints = [];

    if (currentPointIndex < transformedPoints.length) {
      currentSegmentPoints.push(transformedPoints[currentPointIndex]);
    }

    // Interpolate between current and next point for smooth animation
    if (currentPointIndex < transformedPoints.length - 1) {
      const currentPoint = transformedPoints[currentPointIndex];
      const nextPoint = transformedPoints[nextPointIndex];

      const interpolatedPoint = {
        x: currentPoint.x + (nextPoint.x - currentPoint.x) * t,
        y: currentPoint.y + (nextPoint.y - currentPoint.y) * t,
        z: currentPoint.z + (nextPoint.z - currentPoint.z) * t,
        e: currentPoint.e,
        isExtrusion: nextPoint.isExtrusion,
        isPositiveExtrusion: nextPoint.isPositiveExtrusion
      };

      currentSegmentPoints.push(interpolatedPoint);

      // Update nozzle position to follow the current extrusion point
      nozzleObject.position.set(interpolatedPoint.x, interpolatedPoint.y, interpolatedPoint.z);

      // Calculate desired camera position (closer to nozzle for zoom effect, more downward angle)
      const desiredCameraPosition = nozzleObject.position.clone().add(new THREE.Vector3(120, 50, 100));

      // Smoothly interpolate camera position with spring effect
      targetCameraPosition.current.lerp(desiredCameraPosition, delta * 1);

      // Update camera position and set controls target to follow the nozzle
      camera.position.copy(targetCameraPosition.current);
      if (controls) {
        (controls as any).target.copy(targetPosition.current);
      }
    }

    // Update completed lines geometry (always low opacity)
    const completedPositions: number[] = [];
    completedPoints.forEach(point => {
      completedPositions.push(point.x, point.y, point.z);
    });

    const completedGeometry = completedLineObject.geometry;
    completedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(completedPositions, 3));
    completedGeometry.attributes.position.needsUpdate = true;

    // Update current segment geometry (high opacity if positive extrusion)
    const currentPositions: number[] = [];
    currentSegmentPoints.forEach(point => {
      currentPositions.push(point.x, point.y, point.z);
    });

    const currentGeometry = currentSegmentObject.geometry;
    currentGeometry.setAttribute('position', new THREE.Float32BufferAttribute(currentPositions, 3));
    currentGeometry.attributes.position.needsUpdate = true;

    // Set opacity based on whether current segment is positive extrusion
    const isCurrentSegmentPositiveExtrusion = currentSegmentPoints.length > 0 && currentSegmentPoints[0].isPositiveExtrusion;
    (currentSegmentObject.material as THREE.LineBasicMaterial).opacity = isCurrentSegmentPositiveExtrusion ? 1.0 : 0.001;
  });

  if (transformedPoints.length === 0) {
    return null;
  }

  // Initialize geometries
  if (transformedPoints.length > 0) {
    // Start with empty geometries - they'll be populated during animation
    completedLineObject.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    currentSegmentObject.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
  }

  return (
    <>
      <primitive object={completedLineObject} />
      <primitive object={currentSegmentObject} />
      <primitive object={nozzleObject} />
    </>
  );
}

function STLModelRenderer({ mesh, isVisible }: {
  mesh: THREE.Mesh;
  isVisible: boolean;
}) {
  useFrame(() => {
    if (mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (isVisible) {
        material.opacity = 0.1;
        material.color = new THREE.Color(0x333333);
        mesh.visible = true;
      } else {
        mesh.visible = false;
      }
    }
  });

  return <primitive object={mesh} />;
}

export default function GCodeTimelapsePage() {
  const [gcodePoints, setGcodePoints] = useState<GCodePoint[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [useEstimatedTime, setUseEstimatedTime] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stlModel, setStlModel] = useState<THREE.Mesh | null>(null);
  const [isStlVisible, setIsStlVisible] = useState<boolean>(false);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const offsets = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  const meshPosition = useMemo(() => ({ x: -100, y: -65, z: 145 }), []);

  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  const effectiveSpeed = useEstimatedTime && totalSeconds > 0 ? 100 / totalSeconds : speed;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = progress * totalSeconds;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  // Update mesh position when state changes
  useEffect(() => {
    if (stlModel) {
      stlModel.position.set(meshPosition.x, meshPosition.y, meshPosition.z);
    }
  }, [stlModel, meshPosition]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const points = parseGCode(content);
      setGcodePoints(points);
      setProgress(0); // Reset progress when loading new file
      setIsPlaying(true); // Auto-start animation when file is loaded
    };
    reader.readAsText(file);
  };

  const handleSTLFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStlFile(file);
    
    try {
      // Load the STL model
      const stlData = await loadSTLModel(file);
      
      // Set up the model for visualization with the current G-code points
      const mesh = setupSTLModelForVisualization(stlData, gcodePoints, offsets);

      // Set the mesh at initial position
      mesh.position.set(meshPosition.x, meshPosition.y, meshPosition.z);
      
      // Add the mesh to the scene
      setStlModel(mesh);
      
      // Make it visible by default
      setIsStlVisible(true);
    } catch (error) {
      console.error('Error loading STL file:', error);
      // You could add error handling UI here
    }
  };


  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
  };

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        title="G-code Timelapse"
      >
        <div className="flex flex-col gap-4">
          {/* File Upload */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs">Upload G-code File</label>
            <Input
              type="file"
              accept=".gcode,.g"
              onChange={handleFileUpload}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>

          {/* STL File Upload */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs">Upload STL Model</label>
            <Input
              type="file"
              accept=".stl"
              onChange={handleSTLFileUpload}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>

          {/* STL Model Controls */}
          {stlModel && (
            <div className="flex flex-col gap-3">
              <label className="text-white text-xs">STL Model Controls</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="stl-visibility-toggle"
                  checked={isStlVisible}
                  onChange={() => setIsStlVisible(!isStlVisible)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="stl-visibility-toggle" className="text-white text-sm cursor-pointer">
                  Show STL Model
                </label>
              </div>
              <div className="text-white text-xs">
                <div>STL File: {stlFile?.name}</div>
                <div>Visibility: {isStlVisible ? 'Visible' : 'Hidden'}</div>
              </div>

              {/* Position Controls 
              <div className="flex flex-col gap-2">
                <label className="text-white text-xs">Position Controls</label>
                <div className="flex flex-col gap-1">
                  <label className="text-white text-xs">X: {meshPosition.x}</label>
                  <Input
                    type="range"
                    min="-500"
                    max="500"
                    step="1"
                    value={meshPosition.x}
                    onChange={(e) => setMeshPosition(prev => ({ ...prev, x: Number(e.target.value) }))}
                    className="bg-white/10 border-white/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white text-xs">Y: {meshPosition.y}</label>
                  <Input
                    type="range"
                    min="-500"
                    max="500"
                    step="1"
                    value={meshPosition.y}
                    onChange={(e) => setMeshPosition(prev => ({ ...prev, y: Number(e.target.value) }))}
                    className="bg-white/10 border-white/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white text-xs">Z: {meshPosition.z}</label>
                  <Input
                    type="range"
                    min="-500"
                    max="500"
                    step="1"
                    value={meshPosition.z}
                    onChange={(e) => setMeshPosition(prev => ({ ...prev, z: Number(e.target.value) }))}
                    className="bg-white/10 border-white/20"
                  />
                </div>
              </div>
              */}
            </div>
          )}

          {/* Animation Controls */}
          <div className="flex flex-col gap-2">
            <label className="text-white text-xs">Animation Controls</label>
            <div className="flex gap-2">
              <Button
                onClick={handlePlayPause}
                variant={isPlaying ? "secondary" : "default"}
                size="sm"
                className="flex-1"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Speed Control */}
          <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-white text-xs font-medium">Speed Control</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-estimated-time"
                  checked={useEstimatedTime}
                  onChange={() => setUseEstimatedTime(!useEstimatedTime)}
                  className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="use-estimated-time" className="text-[10px] text-white/70 cursor-pointer">
                  Match Print Time
                </label>
              </div>
            </div>

            {!useEstimatedTime ? (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-white/60">
                  <span>Manual Speed</span>
                  <span>{speed.toFixed(2)}x</span>
                </div>
                <Input
                  type="range"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="h-6 bg-transparent accent-white"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-white/60">Estimated Print Time (HH:MM:SS)</label>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="HH"
                      value={hours || ''}
                      onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-8 bg-white/10 border-white/20 text-white text-center text-xs px-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={minutes || ''}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="h-8 bg-white/10 border-white/20 text-white text-center text-xs px-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="SS"
                      value={seconds || ''}
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="h-8 bg-white/10 border-white/20 text-white text-center text-xs px-1"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-white/40 italic">
                  Effective speed: {effectiveSpeed.toFixed(4)}x
                </div>
              </div>
            )}
          </div>

          {/* Progress Control */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-white text-xs">Progress</label>
              <span className="text-[10px] text-white/60">{(progress * 100).toFixed(1)}%</span>
            </div>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              className="bg-white/10 border-white/20 accent-blue-500"
            />
            
            {/* Remaining logic in stats */}
          </div>

          {/* Stats */}
          {gcodePoints.length > 0 && (
            <div className="text-white text-xs">
              <div>Points: {gcodePoints.length.toLocaleString()}</div>
              <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
            </div>
          )}
        </div>
      </Sidebar>

      <div className="absolute inset-0">
        <Canvas
          camera={{
            position: [200, 50, 250],
            fov: 60,
            near: 0.01,
            far: 10000
          }}
          style={{ background: 'black' }}
        >
          <Environment preset="studio" environmentIntensity={0.05} />
          <ambientLight intensity={0.5} color={0xffffff} />
          <directionalLight position={[1, 1, 1]} intensity={1} />

          <GCodeVisualizer
            points={gcodePoints}
            isPlaying={isPlaying}
            speed={effectiveSpeed}
            progress={progress}
            onProgressChange={handleProgressChange}
          />

          {/* STL Model */}
          {stlModel && (
            <STLModelRenderer
              mesh={stlModel}
              isVisible={isStlVisible}
            />
          )}

          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

          <EffectComposer>
            {/* <Bloom {...bloomParams} emitiveIntensity={1000} /> */}
            <Bloom
              luminanceThreshold={0.4}
              luminanceSmoothing={0.1}
              height={300}
              intensity={1}
              radius={.8}
            />
          </EffectComposer>
        </Canvas>

        {/* Futuristic Chrono Overlay */}
        {totalSeconds > 0 && (
          <div className="absolute top-6 right-6 flex flex-col gap-3 pointer-events-none select-none">
            {/* Main Chrono Container */}
            <div className="bg-black/40 backdrop-blur-xl border-r-2 border-red-600/50 p-6 rounded-l-2xl flex flex-col gap-4 shadow-[0_0_30px_rgba(220,38,38,0.15)] animate-in fade-in slide-in-from-right duration-700">
              
              {/* Elapsed Time Sector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Chronometer_Elapsed</span>
                </div>
                <div className="text-4xl font-mono tracking-tighter text-white tabular-nums flex items-baseline gap-1">
                  {formatTime(elapsedSeconds)}
                  <span className="text-xs text-red-500 font-bold opacity-80 animate-pulse">REC</span>
                </div>
              </div>

              {/* Progress Bar Micro-display */}
              <div className="w-full h-[2px] bg-white/10 relative overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-red-600 shadow-[0_0_10px_#dc2626]" 
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              {/* Remaining Time Sector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
                  <span className="text-[10px] text-red-500/80 uppercase tracking-[0.2em] font-bold">Estimated_Completion</span>
                </div>
                <div className="text-2xl font-mono tracking-tighter text-red-500/90 tabular-nums">
                  -{formatTime(remainingSeconds)}
                </div>
              </div>

              {/* Speed Vector Indicator */}
              <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5">
                <div className="text-[9px] text-white/30 uppercase font-medium">Vec_Velocity</div>
                <div className="text-[10px] text-red-400 font-mono bg-red-950/30 px-2 py-0.5 rounded border border-red-900/40">
                  {effectiveSpeed.toFixed(4)}x
                </div>
              </div>
            </div>

            {/* Sub-status badges */}
            <div className="flex gap-2 justify-end">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
                  {isPlaying ? 'System_Active' : 'System_Idle'}
                </span>
              </div>
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                <span className="text-[9px] text-white/60 font-black tracking-widest uppercase">
                  {(progress * 100).toFixed(1)}%_PRG
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <VersionBadge projectName="gcode-timelapse" />
    </>
  );
}
