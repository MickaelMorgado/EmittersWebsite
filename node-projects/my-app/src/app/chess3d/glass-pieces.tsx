'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PieceType, PlayerColor } from './types';

const GLASS_WHITE = '#ffffff';
const GLASS_BLACK = '#1a0828';
const GLASS_BASE = '#1a1520';

function GlassMaterial({ isWhite }: { isWhite: boolean }) {
  const ref = useRef<THREE.MeshPhysicalMaterial>(null);

  useEffect(() => {
    const mat = ref.current;
    if (!mat) return;
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        vec3 N = gl_FrontFacing ? normalize(vNormal) : normalize(-vNormal);
        float fresnel = pow(1.0 - abs(dot(normalize(vViewPosition), N)), 3.0);
        gl_FragColor.rgb += fresnel * vec3(0.35, 0.25, 0.55);
        gl_FragColor.a = mix(gl_FragColor.a, 1.0, fresnel * 0.6);`
      );
    };
  }, []);

  return (
    <meshPhysicalMaterial
      ref={ref}
      color={isWhite ? '#ffffff' : '#000000'}
      transmission={0.6}
      roughness={0.05}
      thickness={0.5}
      ior={1.8}
      metalness={1}
      envMapIntensity={2.5}
      transparent
      clearcoat={1}
      clearcoatRoughness={0}
      reflectivity={0.9}
      opacity={0.95}
    />
  );
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
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.14, 0.28, 0.38, 6]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.19, 6, 5]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassRook({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.23, 0.30, 0.52, 4]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[0.48, 0.1, 0.48]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      {[[-0.18,-0.18],[-0.18,0.18],[0.18,-0.18],[0.18,0.18]].map(([x,z],i) => (
        <mesh castShadow key={i} position={[x, 0.71, z]}>
          <boxGeometry args={[0.1, 0.14, 0.1]} />
          <GlassMaterial isWhite={isWhite} />
        </mesh>
      ))}
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassKnight({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.20, 0.30, 0.36, 6]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.60, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.30, 0.40]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.76, -0.18]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassBishop({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.10, 0.26, 0.70, 6]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.84, 0]}>
        <sphereGeometry args={[0.10, 5, 4]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassQueen({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.15, 0.28, 0.74, 6]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20, 0.04, 4, 8]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      <mesh castShadow position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <GlassMaterial isWhite={isWhite} />
      </mesh>
      {isSelected && <SelectRing />}
    </group>
  );
}

function GlassKing({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <Base />
      <mesh castShadow position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.78, 6]} />
        <GlassMaterial isWhite={isWhite} />
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

export function RefractionCapture({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
