'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Ground Fog ──────────────────────────────────────────────────────────────

const FOG_COUNT = 80;
const fogPositions = new Float32Array(FOG_COUNT * 3);
const fogSpeeds = new Float32Array(FOG_COUNT * 3);

for (let i = 0; i < FOG_COUNT; i++) {
  fogPositions[i * 3] = (Math.random() - 0.5) * 14;
  fogPositions[i * 3 + 1] = Math.random() * 1.5;
  fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
  fogSpeeds[i * 3] = (Math.random() - 0.5) * 0.003;
  fogSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.0004;
  fogSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
}

export function GroundFog() {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const positions = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < FOG_COUNT; i++) {
      const idx = i * 3;
      positions.array[idx] += fogSpeeds[idx] + Math.sin(timeRef.current * 0.4 + i * 0.3) * 0.0008;
      positions.array[idx + 1] += Math.sin(timeRef.current * 0.3 + i * 0.7) * 0.0002;
      positions.array[idx + 2] += fogSpeeds[idx + 2] + Math.cos(timeRef.current * 0.4 + i * 0.5) * 0.0008;
      if (Math.abs(positions.array[idx]) > 8) positions.array[idx] *= -0.9;
      if (Math.abs(positions.array[idx + 2]) > 8) positions.array[idx + 2] *= -0.9;
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[fogPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#b8a9c4" size={0.14} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ─── Sparkle Dust ────────────────────────────────────────────────────────────

const SPARKLE_COUNT = 50;
const sparklePositions = new Float32Array(SPARKLE_COUNT * 3);
const sparkleVelocities = new Float32Array(SPARKLE_COUNT * 3);

for (let i = 0; i < SPARKLE_COUNT; i++) {
  sparklePositions[i * 3] = (Math.random() - 0.5) * 12;
  sparklePositions[i * 3 + 1] = Math.random() * 5;
  sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  sparkleVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
  sparkleVelocities[i * 3 + 1] = Math.random() * 0.003;
  sparkleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
}

export function SparkleDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const positions = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.25 + Math.sin(timeRef.current * 0.5) * 0.1;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const idx = i * 3;
      positions.array[idx] += sparkleVelocities[idx] + Math.sin(timeRef.current + i * 0.5) * 0.0005;
      positions.array[idx + 1] += sparkleVelocities[idx + 1];
      positions.array[idx + 2] += sparkleVelocities[idx + 2] + Math.cos(timeRef.current + i * 0.5) * 0.0005;
      if (positions.array[idx + 1] > 6) {
        positions.array[idx] = (Math.random() - 0.5) * 12;
        positions.array[idx + 1] = 0;
        positions.array[idx + 2] = (Math.random() - 0.5) * 12;
      }
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[sparklePositions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffd475" size={0.02} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}
