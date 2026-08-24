'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Position } from './types';

const PARTICLE_COUNT = 18;
const RING_SEGMENTS = 40;

function isValidMovePos(pos: Position, validMoves: Position[]) {
  return validMoves.some((m) => m.row === pos.row && m.col === pos.col);
}

// Single floating orb for a valid move square
function MoveOrb({ position, isCapture }: { position: [number, number, number]; isCapture: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * 100);

  const particles = useMemo(() => {
    const arr: { offset: THREE.Vector3; speed: number; phase: number; size: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.15;
      arr.push({
        offset: new THREE.Vector3(Math.cos(angle) * radius, 0.1 + Math.random() * 0.3, Math.sin(angle) * radius),
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        size: 0.02 + Math.random() * 0.025,
      });
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    groupRef.current.children.forEach((child, i) => {
      if (i >= particles.length) return;
      const p = particles[i];
      const y = p.offset.y + Math.sin(t * p.speed + p.phase) * 0.12;
      const wobbleX = Math.sin(t * 0.7 + p.phase) * 0.04;
      const wobbleZ = Math.cos(t * 0.6 + p.phase) * 0.04;
      child.position.set(p.offset.x + wobbleX, y, p.offset.z + wobbleZ);
    });
  });

  const green = '#10d569';
  const red = '#ff4466';
  const color = isCapture ? red : green;
  const emissiveColor = isCapture ? red : green;

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.offset.x, p.offset.y, p.offset.z]}>
          <sphereGeometry args={[p.size, 8, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={emissiveColor}
            emissiveIntensity={2.5}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Central glow */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={3}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* Ground ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.24, RING_SEGMENTS]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={2}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// Selected piece floating ring
function SelectionAura({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    ringRef.current.rotation.z = t * 0.8;
    const scale = 1 + Math.sin(t * 2) * 0.08;
    ringRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.40, 0.46, RING_SEGMENTS]} />
        <meshStandardMaterial
          color="#ffd475"
          emissive="#ffaa22"
          emissiveIntensity={3}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Inner subtle glow */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.40, RING_SEGMENTS]} />
        <meshStandardMaterial
          color="#ffd475"
          emissive="#ffaa22"
          emissiveIntensity={1.5}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function FantasyHighlights({
  selectedPos,
  validMoves,
  board,
}: {
  selectedPos: Position | null;
  validMoves: Position[];
  board: (import('./types').Piece | null)[][];
}) {
  return (
    <group>
      {selectedPos && (
        <SelectionAura position={[selectedPos.col - 3.5, 0, selectedPos.row - 3.5]} />
      )}
      {validMoves.map((m, i) => (
        <MoveOrb
          key={`${m.row}-${m.col}-${i}`}
          position={[m.col - 3.5, 0, m.row - 3.5]}
          isCapture={!!board[m.row][m.col]}
        />
      ))}
    </group>
  );
}
