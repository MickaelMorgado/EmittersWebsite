"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Glitch, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const fftSize = 4096; // Must be a power of two
const barsCount = 20; // Number of bars for visualization

/**
 * Helper function to get a random float within a range.
 */
const getRandomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Effects component that reacts to spectrum values.
 */
function Effects({ spectrumValues, normalizedLow, normalizedHigh }: { spectrumValues: number[], normalizedLow: number, normalizedHigh: number }) {
  const glitchDensity = 0.0002 * normalizedHigh;
  const vignetteDarkness = 1 * (normalizedHigh / 100);

  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.5} intensity={0 + normalizedLow * 0.3} />
      <Noise opacity={0.03} />
      <Vignette eskil={false} offset={0.1} darkness={vignetteDarkness} />
      <Glitch columns={0.003} strength={new THREE.Vector2(glitchDensity, glitchDensity)} />
    </EffectComposer>
  );
}

/**
 * Main component handling microphone access and 3D visualization logic with super random effects.
 */
function AudioVisualizer({ onSpectrumUpdate, spectrumValues, onNormalizedLowUpdate, onNormalizedHighUpdate, normalizedLow, normalizedHigh }: { onSpectrumUpdate: (data: number[]) => void, spectrumValues: number[], onNormalizedLowUpdate: (value: number) => void, onNormalizedHighUpdate: (value: number) => void, normalizedLow: number, normalizedHigh: number }) {
  const barsRef = useRef<THREE.Mesh[]>([]);
  const audioDataRef = useRef(new Uint8Array(barsCount));
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Create geometries for each bar
  const geometries = useMemo(() => Array.from({ length: barsCount }).map(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array(
      Array.from({ length: 10 }, () => (Math.random() - 0.5) * 20)
    );
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }), []);

  // Initialize audio context and analyser
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.error("Web Audio API not supported in this browser.");
      return;
    }

    let audioContext: AudioContext;
    const updateAnimationFrame: number | undefined = undefined;
    try {
      audioContext = new AudioContext();
      const analyserNode = audioContext.createAnalyser();
      // fftSize must be a power of two. barsCount * 2 = 256, which is valid.
      analyserNode.fftSize = fftSize;
      setAnalyser(analyserNode);

      navigator.mediaDevices.getUserMedia({ audio: true }).then(async (stream) => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserNode);
        await audioContext.resume();
        setIsAudioReady(true);
      }).catch((err) => {
        console.error("Error accessing microphone:", err);
      });
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
    }

    return () => {
      if (updateAnimationFrame) cancelAnimationFrame(updateAnimationFrame);
      if (audioContext) audioContext.close().catch(e => console.error("Error closing audio context:", e));
    };
  }, [barsCount]);

  // Update loop for analyser data and logging
  useEffect(() => {
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let updateAnimationFrame: number | null = null;

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const spectrumThreshold = 0;
      for (let i = 0; i < barsCount; i++) {
        const binIndex = Math.floor(Math.exp(i / (barsCount - 1) * Math.log(bufferLength)) - 1);
        const value = dataArray[binIndex] || 0;
        audioDataRef.current[i] = value > spectrumThreshold ? value : 0;
      }
      
      // Spectrum Parts (3 - Low, Mid, High):
      const third = Math.floor(barsCount / 3);
      const audioSpectrum = Array.from(audioDataRef.current);

      const low = audioSpectrum.slice(0, third);
      // const mid = audioSpectrum.slice(third, third * 2);
      const high = audioSpectrum.slice(third * 2, barsCount);

      const normalizedLow = low.reduce((a, b) => a + b, 0.1) / low.length;
      const normalizedHigh = high.reduce((a, b) => a + b, 0.1) / high.length * 3; // * 3 to amplify high frequencies effect
      
      //console.table([audioSpectrum.join(','), low.join(','), high.join(','), normalizedLow, normalizedHigh]);

      onNormalizedLowUpdate(normalizedLow);
      onNormalizedHighUpdate(normalizedHigh);

      onSpectrumUpdate(audioSpectrum);
      updateAnimationFrame = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (updateAnimationFrame !== null) cancelAnimationFrame(updateAnimationFrame);
      updateAnimationFrame = null;
    };
  }, [analyser, barsCount, onSpectrumUpdate]);

  /**
   * Animation loop for super random effects.
   */
  useFrame(({ camera, clock }) => {
    if (!isAudioReady || barsRef.current.length === 0) return;

    const elapsedTime = clock.getElapsedTime();
    
    // Camera movement for added disorientation
    // const cameraAproximationDistance = 50;
    // const speedCamera = 5;
    // camera.position.x = Math.sin(elapsedTime * 0.2 * speedCamera) * 50 - cameraAproximationDistance;
    // camera.position.y = Math.cos(elapsedTime * 0.3 * speedCamera) * 20 + 10 - cameraAproximationDistance;
    // camera.position.z = Math.sin(elapsedTime * 0.1 * speedCamera) * 50 + 50 - cameraAproximationDistance;
    camera.lookAt(0, 0, 0); // Always look towards the center of the chaos

    for (let i = 0; i < barsCount; i++) {
      const audioValue = audioDataRef.current[i];
      const normalizedScale = audioValue / 255;
      const bar = barsRef.current[i];

      if (bar) {
        // Apply initial random position and add audio reactive displacement
        /*
        bar.position.copy(initialTransform.position);
        bar.position.x += Math.sin(elapsedTime * (normalizedScale ) + i) * normalizedScale * 10;
        bar.position.y += Math.cos(elapsedTime * (normalizedScale ) + i) * normalizedScale * 25;
        bar.position.z += Math.sin(elapsedTime * (normalizedScale ) + i) * normalizedScale * 40;
        */

        // Apply initial random rotation and add audio reactive rotation
        /*         
        bar.rotation.copy(initialTransform.rotation);
        bar.rotation.x += elapsedTime * 0.5 + normalizedScale * Math.PI;
        bar.rotation.y += elapsedTime * 0.8 + normalizedScale * Math.PI * 2;
        */

        const scalePower = 5;
        const size = 0.1 + normalizedScale * scalePower;
        bar.scale.set(size, size, size);

        // Super-sized and audio-reactive scaling with randomness
        // const dynamicScale = Math.max(normalizedScale * 2 , 0.1); // Much larger scale
        // bar.scale.set(dynamicScale * 0.1, dynamicScale, dynamicScale * 0.2);

        const flipFlop = () => i % 2 === 0 ? 1 : -1;
        bar.rotation.x += elapsedTime * 0.00002 * normalizedHigh * 0.015 * Math.PI / 2 * flipFlop();

        // Rapidly shifting chaotic colors
        const colorHue = (elapsedTime * .1 + i / barsCount) % 1;
        (bar.material as THREE.MeshBasicMaterial).color.setHSL(colorHue, 1, 0.50);
      }
    }
  });

  return (
  <>
    {Array.from({ length: barsCount }).map((_, i) => (
      <mesh
        key={i}
        ref={(el) => {
          if (el) barsRef.current[i] = el
        }}
        geometry={geometries[i]}
      >
        <meshBasicMaterial attach="material" color="orange" wireframe />
      </mesh>
    ))}
  </>
  );
}

/**
 * Main application component setting up the 3D environment.
 */
export default function ThreeAudioVisualizer() {
  const [spectrumValues, setSpectrumValues] = useState<number[]>([]);
  const [normalizedLow, setNormalizedLow] = useState(0);
  const [normalizedHigh, setNormalizedHigh] = useState(0);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
      {/* spectrumValues: {spectrumValues.join(", ")} */}
      <Canvas
        camera={{ position: [0, 0, 70], fov: 60 }} // Wider FOV for more immersive chaos
        onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color("#000000"));
        }}
      >
        <AudioVisualizer onSpectrumUpdate={setSpectrumValues} spectrumValues={spectrumValues} onNormalizedLowUpdate={setNormalizedLow} onNormalizedHighUpdate={setNormalizedHigh} normalizedLow={normalizedLow} normalizedHigh={normalizedHigh} />
        <Effects spectrumValues={spectrumValues} normalizedLow={normalizedLow} normalizedHigh={normalizedHigh} />
      </Canvas>
    </div>
  );
}
