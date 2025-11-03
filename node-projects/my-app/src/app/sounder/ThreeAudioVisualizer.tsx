"use client";

import { Box } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function AudioVisualizer() {
  const barsCount = 64;
  const barsRef = useRef<THREE.Mesh[]>([]);
  const audioDataRef = useRef(new Uint8Array(barsCount));

  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = barsCount * 2;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
    }).catch((err) => {
      console.error("Error accessing microphone:", err);
    });

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      audioDataRef.current = dataArray;
      requestAnimationFrame(update);
    };
    update();

    return () => {
      audioContext.close();
    };
  }, []);

  useFrame(() => {
    if (barsRef.current.length === 0) return;
    for (let i = 0; i < barsCount; i++) {
      const scale = audioDataRef.current[i] / 255;
      const bar = barsRef.current[i];
      if (bar) {
        bar.scale.y = Math.max(scale * 40, 0.1);
        (bar.material as THREE.MeshBasicMaterial).color.setHSL(scale, 1, 0.5);
      }
    }
  });

  return (
    <>
      {Array.from({ length: barsCount }).map((_, i) => (
        <Box
          key={i}
          ref={(el) => {
            if (el) barsRef.current[i] = el;
          }}
          position={[i - barsCount / 2, 0, 0]}
          args={[0.1, 1, 0.1]}
        >
          <meshBasicMaterial attach="material" color="green" />
        </Box>
      ))}
    </>
  );
}

export default function ThreeAudioVisualizer() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 40], fov: 75 }}>
        <AudioVisualizer />
        <EffectComposer>
          <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
