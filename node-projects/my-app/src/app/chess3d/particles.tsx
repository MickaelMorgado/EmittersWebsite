'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Procedural soft circle texture ──────────────────────────────────────────

function makeSoftCircle(size: number, softness: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(255,255,255,1)`);
  gradient.addColorStop(softness, `rgba(255,255,255,0.4)`);
  gradient.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Ground Fog (smoky drifting clouds) ──────────────────────────────────────

const FOG_LAYERS = [
  { count: 30, y: [0, 0.6], spread: 16, size: 1.8, speed: 0.12, opacity: 0.10, color: '#666666' },
  { count: 20, y: [0.3, 1.2], spread: 14, size: 2.4, speed: 0.08, opacity: 0.06, color: '#666666' },
  { count: 12, y: [0.8, 2.0], spread: 18, size: 3.0, speed: 0.05, opacity: 0.04, color: '#666666' },
];

interface FogParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  baseY: number;
  phase: number;
  driftSpeed: number;
  layerIdx: number;
}

function useFogParticles(): FogParticle[] {
  return useMemo(() => {
    const particles: FogParticle[] = [];
    FOG_LAYERS.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        particles.push({
          pos: new THREE.Vector3(
            (Math.random() - 0.5) * layer.spread,
            layer.y[0] + Math.random() * (layer.y[1] - layer.y[0]),
            (Math.random() - 0.5) * layer.spread
          ),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * layer.speed,
            0,
            (Math.random() - 0.5) * layer.speed
          ),
          baseY: layer.y[0] + Math.random() * (layer.y[1] - layer.y[0]),
          phase: Math.random() * Math.PI * 2,
          driftSpeed: 0.2 + Math.random() * 0.4,
          layerIdx: li,
        });
      }
    });
    return particles;
  }, []);
}

export function GroundFog() {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const particles = useFogParticles();
  const softTex = useMemo(() => makeSoftCircle(64, 0.35), []);

  const total = particles.length;
  const positions = useMemo(() => {
    const arr = new Float32Array(total * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.pos.x;
      arr[i * 3 + 1] = p.pos.y;
      arr[i * 3 + 2] = p.pos.z;
    });
    return arr;
  }, [particles, total]);

  const sizes = useMemo(() => {
    const arr = new Float32Array(total);
    particles.forEach((p, i) => {
      arr[i] = FOG_LAYERS[p.layerIdx].size;
    });
    return arr;
  }, [particles, total]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;

    particles.forEach((p, i) => {
      const layer = FOG_LAYERS[p.layerIdx];

      // Slow drift with sine wave swirling
      p.pos.x += p.vel.x * delta + Math.sin(t * p.driftSpeed + p.phase) * 0.003;
      p.pos.z += p.vel.z * delta + Math.cos(t * p.driftSpeed * 0.7 + p.phase) * 0.003;
      p.pos.y = p.baseY + Math.sin(t * 0.15 + p.phase) * 0.2;

      // Wrap around bounds
      const half = layer.spread / 2;
      if (p.pos.x > half) p.pos.x = -half;
      if (p.pos.x < -half) p.pos.x = half;
      if (p.pos.z > half) p.pos.z = -half;
      if (p.pos.z < -half) p.pos.z = half;

      posAttr.array[i * 3] = p.pos.x;
      posAttr.array[i * 3 + 1] = p.pos.y;
      posAttr.array[i * 3 + 2] = p.pos.z;

      // Gentle size pulsing
      const pulse = 1 + Math.sin(t * 0.3 + p.phase * 2) * 0.15;
      sizeAttr.array[i] = layer.size * pulse;
    });

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <>
      {FOG_LAYERS.map((layer, li) => (
        <points key={li} ref={li === 0 ? pointsRef : undefined}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-size" args={[sizes, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={softTex}
            color={layer.color}
            size={layer.size}
            transparent
            opacity={layer.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      ))}
    </>
  );
}

// ─── Sparkle Dust (rising magical particles) ─────────────────────────────────

const SPARKLE_COUNT = 250;
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
  const softTex = useMemo(() => makeSoftCircle(64, 0.2), []);

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
      <pointsMaterial
        map={softTex}
        color="#ffd475"
        size={0.04}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
