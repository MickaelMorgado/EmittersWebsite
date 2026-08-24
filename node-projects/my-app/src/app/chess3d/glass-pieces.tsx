'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PieceType, PlayerColor } from './types';

const GLASS_WHITE = '#eef4ff';
const GLASS_BLACK = '#1a0828';
const GLASS_BASE = '#1a1520';

export function glassProps(isWhite: boolean) {
  return {
    color: isWhite ? GLASS_WHITE : GLASS_BLACK,
    transmission: isWhite ? 0.88 : 0.85,
    roughness: isWhite ? 0.04 : 0.06,
    thickness: 0.6,
    ior: 1.52,
    metalness: 0.02,
    envMapIntensity: 2.5,
  };
}

function GlassMaterial(props: ReturnType<typeof glassProps>) {
  const ref = useRef<THREE.MeshPhysicalMaterial>(null);
  useEffect(() => {
    const mat = ref.current;
    if (!mat) return;
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        vec3 N = gl_FrontFacing ? normalize(vNormal) : normalize(-vNormal);
        float f = pow(1.0 - abs(dot(normalize(vViewPosition), N)), 3.0);
        gl_FragColor.r += f * 0.12;
        gl_FragColor.b -= f * 0.08;`
      );
    };
  }, []);
  return <meshPhysicalMaterial ref={ref} {...props} />;
}

function Base() {
  return (
    <mesh castShadow position={[0, 0.025, 0]}>
      <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
      <meshStandardMaterial color={GLASS_BASE} roughness={0.4} metalness={0.7} />
    </mesh>
  );
}

function SelectRing() {
  return (
    <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.46, 0.56, 24]} />
      <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
    </mesh>
  );
}

function GlassPawn({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  const gp = glassProps(isWhite);
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.14, 0.28, 0.38, 6]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.19, 6, 5]} />
        <GlassMaterial {...gp} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassRook({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  const gp = glassProps(isWhite);
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.23, 0.30, 0.52, 4]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[0.48, 0.1, 0.48]} />
        <GlassMaterial {...gp} />
      </mesh>
      {[[-0.18,-0.18],[-0.18,0.18],[0.18,-0.18],[0.18,0.18]].map(([x,z],i) => (
        <mesh castShadow key={i} position={[x, 0.71, z]}>
          <boxGeometry args={[0.1, 0.14, 0.1]} />
          <GlassMaterial {...gp} />
        </mesh>
      ))}
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassKnight({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  const gp = glassProps(isWhite);
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.20, 0.30, 0.36, 6]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.60, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.30, 0.40]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.76, -0.18]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
        <GlassMaterial {...gp} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassBishop({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  const gp = glassProps(isWhite);
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.10, 0.26, 0.70, 6]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.84, 0]}>
        <sphereGeometry args={[0.10, 5, 4]} />
        <GlassMaterial {...gp} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassQueen({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  const gp = glassProps(isWhite);
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.15, 0.28, 0.74, 6]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20, 0.04, 4, 8]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <GlassMaterial {...gp} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassKing({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  const gp = glassProps(isWhite);
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.78, 6]} />
        <GlassMaterial {...gp} />
      </mesh>
      <mesh castShadow position={[0, 0.97, 0]}>
        <boxGeometry args={[0.06, 0.30, 0.06]} />
        <meshStandardMaterial color={isWhite ? '#c8a040' : '#7722cc'} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.07, 0]}>
        <boxGeometry args={[0.22, 0.06, 0.06]} />
        <meshStandardMaterial color={isWhite ? '#c8a040' : '#7722cc'} roughness={0.2} metalness={0.8} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

export function GlassPiece({ type, color, isSelected }: { type: PieceType; color: PlayerColor; isSelected?: boolean }) {
  const isWhite = color === 'white';
  switch (type) {
    case 'pawn': return <GlassPawn isWhite={isWhite} isSelected={isSelected} />;
    case 'rook': return <GlassRook isWhite={isWhite} isSelected={isSelected} />;
    case 'knight': return <GlassKnight isWhite={isWhite} isSelected={isSelected} />;
    case 'bishop': return <GlassBishop isWhite={isWhite} isSelected={isSelected} />;
    case 'queen': return <GlassQueen isWhite={isWhite} isSelected={isSelected} />;
    case 'king': return <GlassKing isWhite={isWhite} isSelected={isSelected} />;
  }
}
