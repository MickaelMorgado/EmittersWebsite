'use client';

import { VersionBadge } from '@/components/VersionBadge';
import { ContactShadows, Environment, OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────────────────────

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PlayerColor = 'white' | 'black';

interface Position {
  row: number;
  col: number;
}

interface Piece {
  type: PieceType;
  color: PlayerColor;
  hasMoved?: boolean;
}

interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isCastling?: boolean;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
}

// ─── Initial Board ───────────────────────────────────────────────────────────

const INITIAL_BOARD: (Piece | null)[][] = [
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' },
  ],
  Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' },
  ],
];

// ─── Chess Logic (unchanged) ─────────────────────────────────────────────────

function getValidMoves(
  board: (Piece | null)[][],
  pos: Position,
  checkKingSafety: boolean = true
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, color, hasMoved } = piece;
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  const isOwnPiece = (r: number, c: number) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    return board[r][c]?.color === color;
  };

  const isEnemyPiece = (r: number, c: number) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const target = board[r][c];
    return target && target.color !== color;
  };

  const isEmpty = (r: number, c: number) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    return !board[r][c];
  };

  const addMove = (r: number, c: number) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    if (isOwnPiece(r, c)) return false;
    moves.push({ row: r, col: c });
    return isEmpty(r, c);
  };

  if (type === 'pawn') {
    const oneForward = pos.row + direction;
    const twoForward = pos.row + 2 * direction;

    if (isEmpty(oneForward, pos.col)) {
      addMove(oneForward, pos.col);
      if (pos.row === startRow && isEmpty(twoForward, pos.col)) {
        addMove(twoForward, pos.col);
      }
    }

    const captures = [
      { row: pos.row + direction, col: pos.col - 1 },
      { row: pos.row + direction, col: pos.col + 1 },
    ];
    for (const cap of captures) {
      if (isEnemyPiece(cap.row, cap.col)) {
        moves.push(cap);
      }
    }
  }

  if (type === 'rook' || type === 'queen') {
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];
    for (const [dr, dc] of directions) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        if (isOwnPiece(r, c)) break;
        moves.push({ row: r, col: c });
        if (isEnemyPiece(r, c)) break;
        r += dr;
        c += dc;
      }
    }
  }

  if (type === 'bishop' || type === 'queen') {
    const directions = [
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];
    for (const [dr, dc] of directions) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        if (isOwnPiece(r, c)) break;
        moves.push({ row: r, col: c });
        if (isEnemyPiece(r, c)) break;
        r += dr;
        c += dc;
      }
    }
  }

  if (type === 'knight') {
    const jumps = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2],
    ];
    for (const [dr, dc] of jumps) {
      addMove(pos.row + dr, pos.col + dc);
    }
  }

  if (type === 'king') {
    const around = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];
    for (const [dr, dc] of around) {
      addMove(pos.row + dr, pos.col + dc);
    }

    if (!hasMoved) {
      const row = pos.row;
      const kingsideRook = board[row][7];
      if (kingsideRook?.type === 'rook' && kingsideRook.color === color && !kingsideRook.hasMoved) {
        if (isEmpty(row, 5) && isEmpty(row, 6)) {
          moves.push({ row, col: 6 });
        }
      }
      const queensideRook = board[row][0];
      if (queensideRook?.type === 'rook' && queensideRook.color === color && !queensideRook.hasMoved) {
        if (isEmpty(row, 1) && isEmpty(row, 2) && isEmpty(row, 3)) {
          moves.push({ row, col: 2 });
        }
      }
    }
  }

  if (checkKingSafety) {
    return moves.filter((m) => !wouldBeInCheck(board, color, m, pos));
  }

  return moves;
}

function wouldBeInCheck(
  board: (Piece | null)[][],
  color: PlayerColor,
  move: Position,
  from: Position
): boolean {
  const newBoard = board.map((row) => [...row]);
  newBoard[move.row][move.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;

  const kingPos = findKing(newBoard, color);
  if (!kingPos) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = newBoard[r][c];
      if (piece && piece.color !== color) {
        const attacks = getValidMoves(newBoard, { row: r, col: c }, false);
        if (attacks.some((a) => a.row === kingPos.row && a.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function findKing(board: (Piece | null)[][], color: PlayerColor): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece?.type === 'king' && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function isCheckmate(board: (Piece | null)[][], color: PlayerColor): boolean {
  if (!isInCheck(board, color)) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, { row: r, col: c });
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

function isInCheck(board: (Piece | null)[][], color: PlayerColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponent = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponent) {
        const attacks = getValidMoves(board, { row: r, col: c }, false);
        if (attacks.some((a) => a.row === kingPos.row && a.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// ─── Glass Pieces ────────────────────────────────────────────────────────────

function GlassPawn({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
        <meshStandardMaterial color="#1a1520" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.14, 0.28, 0.38, 6]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.19, 6, 5]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 24]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GlassRook({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
        <meshStandardMaterial color="#1a1520" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.23, 0.30, 0.52, 4]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[0.48, 0.1, 0.48]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      {([[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]] as [number, number][]).map(([x, z], i) => (
        <mesh castShadow key={i} position={[x, 0.71, z]}>
          <boxGeometry args={[0.1, 0.14, 0.1]} />
          <meshPhysicalMaterial
            color={isWhite ? '#c4d8fa' : '#1a0828'}
            transmission={isWhite ? 0.82 : 0.48}
            roughness={isWhite ? 0.04 : 0.06}
            thickness={0.6}
            ior={1.52}
            metalness={0.02}
            envMapIntensity={2.5}
          />
        </mesh>
      ))}
      {isSelected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 24]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GlassKnight({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
        <meshStandardMaterial color="#1a1520" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.20, 0.30, 0.36, 6]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.60, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.30, 0.40]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.76, -0.18]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 24]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GlassBishop({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
        <meshStandardMaterial color="#1a1520" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.10, 0.26, 0.70, 6]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.84, 0]}>
        <sphereGeometry args={[0.10, 5, 4]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 24]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GlassQueen({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
        <meshStandardMaterial color="#1a1520" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.15, 0.28, 0.74, 6]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20, 0.04, 4, 8]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 24]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GlassKing({ isWhite, isSelected }: { isWhite: boolean; isSelected?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.4, 0.43, 0.05, 6]} />
        <meshStandardMaterial color="#1a1520" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.78, 6]} />
        <meshPhysicalMaterial
          color={isWhite ? '#c4d8fa' : '#1a0828'}
          transmission={isWhite ? 0.82 : 0.48}
          roughness={isWhite ? 0.04 : 0.06}
          thickness={0.6}
          ior={1.52}
          metalness={0.02}
          envMapIntensity={2.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.97, 0]}>
        <boxGeometry args={[0.06, 0.30, 0.06]} />
        <meshStandardMaterial
          color={isWhite ? '#c8a040' : '#7722cc'}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh castShadow position={[0, 1.07, 0]}>
        <boxGeometry args={[0.22, 0.06, 0.06]} />
        <meshStandardMaterial
          color={isWhite ? '#c8a040' : '#7722cc'}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 24]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GlassPiece({ type, color, isSelected }: { type: PieceType; color: PlayerColor; isSelected?: boolean }) {
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

// ─── Ground Fog Particles ────────────────────────────────────────────────────

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

function GroundFog() {
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
        <bufferAttribute attach="attributes-position" array={fogPositions} count={FOG_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#b8a9c4"
        size={0.35}
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Sparkle Dust Particles ──────────────────────────────────────────────────

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

function SparkleDust() {
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
        <bufferAttribute attach="attributes-position" array={sparklePositions} count={SPARKLE_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
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

// ─── Procedural Audio ────────────────────────────────────────────────────────

function playGlassImpact() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1600, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.06, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2800, now);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.06);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.025, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.08);

    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.012;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.015, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(g3).connect(ctx.destination);
    noise.start(now);
  } catch {
    /* audio context not available */
  }
}

let ambientStarted = false;
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function startMedievalAmbiance() {
  if (ambientStarted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.02;
    ambientGain.connect(ctx.destination);

    ambientOsc1 = ctx.createOscillator();
    ambientOsc1.type = 'sine';
    ambientOsc1.frequency.value = 55;
    ambientOsc1.connect(ambientGain);
    ambientOsc1.start();

    ambientOsc2 = ctx.createOscillator();
    ambientOsc2.type = 'sine';
    ambientOsc2.frequency.value = 82.4;
    const g2 = ctx.createGain();
    g2.gain.value = 0.012;
    ambientOsc2.connect(g2).connect(ctx.destination);
    ambientOsc2.start();

    ambientStarted = true;
  } catch {
    /* audio context not available */
  }
}

function toggleAmbient(on: boolean) {
  if (ambientGain) {
    ambientGain.gain.linearRampToValueAtTime(on ? 0.02 : 0, ambientGain.context.currentTime + 0.5);
  }
}

// ─── Glass Board Square ──────────────────────────────────────────────────────

function ChessBoardSquare({
  row,
  col,
  isLight,
  hasPiece,
  isSelected,
  isValidMove,
  onClick,
}: {
  row: number;
  col: number;
  isLight: boolean;
  hasPiece: boolean;
  isSelected?: boolean;
  isValidMove?: boolean;
  onClick?: () => void;
}) {
  return (
    <group position={[col - 3.5, 0, row - 3.5]} onClick={onClick}>
      <mesh receiveShadow>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhysicalMaterial
          color={isLight ? '#b8c8d8' : '#1a1028'}
          transmission={isLight ? 0.35 : 0.15}
          roughness={isLight ? 0.12 : 0.06}
          thickness={0.5}
          ior={1.45}
          metalness={0.02}
          envMapIntensity={1.8}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.44, 0.48, 32]} />
          <meshBasicMaterial color="#ffdd44" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {isValidMove && (
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[hasPiece ? 0.22 : 0.10, 12, 8]} />
          <meshPhysicalMaterial
            color={hasPiece ? '#cc2222' : '#aaffaa'}
            transmission={hasPiece ? 0.55 : 0.65}
            roughness={0.08}
            thickness={0.3}
            ior={1.4}
            metalness={0.01}
            envMapIntensity={2.0}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Board Frame ─────────────────────────────────────────────────────────────

function BoardFrame() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.12, 0]}>
        <boxGeometry args={[8.6, 0.25, 8.6]} />
        <meshStandardMaterial color="#0d0a12" roughness={0.55} metalness={0.8} envMapIntensity={1.2} />
      </mesh>
      <mesh receiveShadow position={[0, -0.28, 0]}>
        <boxGeometry args={[9.0, 0.08, 9.0]} />
        <meshStandardMaterial color="#1a1030" roughness={0.7} metalness={0.6} />
      </mesh>
      <pointLight position={[0, -0.1, 0]} color="#221144" intensity={0.6} distance={10} decay={2} />
    </group>
  );
}

// ─── Full Board ──────────────────────────────────────────────────────────────

function ChessBoard({
  board,
  selectedPos,
  validMoves,
  onSquareClick,
}: {
  board: (Piece | null)[][];
  selectedPos: Position | null;
  validMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
}) {
  return (
    <group>
      <BoardFrame />
      {Array(8).fill(null).map((_, row) =>
        Array(8).fill(null).map((_, col) => {
          const isLight = (row + col) % 2 === 1;
          const piece = board[row][col];
          const isSelected = selectedPos?.row === row && selectedPos?.col === col;
          const isValidMove = validMoves.some((m) => m.row === row && m.col === col);

          return (
            <group key={`${row}-${col}`}>
              <ChessBoardSquare
                row={row}
                col={col}
                isLight={isLight}
                hasPiece={!!piece}
                isSelected={isSelected}
                isValidMove={isValidMove}
                onClick={() => onSquareClick(row, col)}
              />
              {piece && (
                <group position={[col - 3.5, 0.05, row - 3.5]}>
                  <group
                    onClick={(e) => {
                      e.stopPropagation();
                      onSquareClick(row, col);
                    }}
                  >
                    <GlassPiece
                      type={piece.type}
                      color={piece.color}
                      isSelected={isSelected}
                    />
                  </group>
                </group>
              )}
            </group>
          );
        })
      )}
    </group>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Chess3D() {
  const [board, setBoard] = useState<(Piece | null)[][]>(INITIAL_BOARD.map(row => [...row]));
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('white');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate'>('playing');
  const [soundOn, setSoundOn] = useState(true);

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      const clickedPiece = board[row][col];
      const isClickedOwnPiece = clickedPiece && clickedPiece.color === currentTurn;

      if (selectedPos && validMoves.some((m) => m.row === row && m.col === col)) {
        const move: Move = {
          from: selectedPos,
          to: { row, col },
          piece: board[selectedPos.row][selectedPos.col]!,
          captured: clickedPiece || undefined,
        };

        const newBoard = board.map((r) => [...r]);
        const piece: Piece = { ...newBoard[selectedPos.row][selectedPos.col]! };

        if (piece.type === 'king' || piece.type === 'rook') {
          piece.hasMoved = true;
        }

        if (piece.type === 'king' && Math.abs(col - selectedPos.col) === 2) {
          if (col === 6) {
            const rook = newBoard[row][7];
            newBoard[row][5] = { ...rook!, hasMoved: true };
            newBoard[row][7] = null;
            move.isCastling = true;
          } else if (col === 2) {
            const rook = newBoard[row][0];
            newBoard[row][3] = { ...rook!, hasMoved: true };
            newBoard[row][0] = null;
            move.isCastling = true;
          }
        }

        newBoard[row][col] = piece;
        newBoard[selectedPos.row][selectedPos.col] = null;

        const opponent = currentTurn === 'white' ? 'black' : 'white';
        const isCheck = isInCheck(newBoard, opponent);

        setBoard(newBoard);
        setMoveHistory((prev) => [...prev, move]);
        setSelectedPos(null);
        setValidMoves([]);
        setCurrentTurn(opponent);
        setGameStatus(isCheck ? (isCheckmate(newBoard, opponent) ? 'checkmate' : 'check') : 'playing');

        if (soundOn) playGlassImpact();
        return;
      }

      if (isClickedOwnPiece) {
        setSelectedPos({ row, col });
        setValidMoves(getValidMoves(board, { row, col }));
        return;
      }

      setSelectedPos(null);
      setValidMoves([]);
    },
    [board, selectedPos, validMoves, currentTurn, soundOn]
  );

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD.map((row) => [...row]));
    setCurrentTurn('white');
    setSelectedPos(null);
    setValidMoves([]);
    setMoveHistory([]);
    setGameStatus('playing');
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      toggleAmbient(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (soundOn) startMedievalAmbiance();
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* ── HUD ── */}
      <div className="absolute top-5 left-5 z-50">
        <div className="bg-[#0d0a14]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.06] text-white shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/[0.08]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m8 12 3-8 2 4 3-4 2 8"/>
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-wide">Glass Chess</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-6">
              <span className="text-white/40">Turn</span>
              <span className={`font-bold ${currentTurn === 'white' ? 'text-blue-200' : 'text-purple-300'}`}>
                {currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-white/40">Status</span>
              <span className={`font-bold ${
                gameStatus === 'checkmate' ? 'text-red-400' :
                gameStatus === 'check' ? 'text-orange-400' :
                'text-emerald-400'
              }`}>
                {gameStatus === 'checkmate' ? 'Checkmate' :
                 gameStatus === 'check' ? 'Check' : 'Playing'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-white/40">Moves</span>
              <span className="text-white/80">{moveHistory.length}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-all text-xs font-medium"
            >
              <RotateCcw size={13} />
              Reset
            </button>
            <button
              onClick={toggleSound}
              className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-all text-xs"
              title={soundOn ? 'Mute ambient' : 'Unmute ambient'}
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 z-50 text-white/25 text-xs font-medium">
        Click a piece to select, click a valid move to move
      </div>

      {/* ── 3D Canvas ── */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#080510']} />
        <fog attach="fog" args={['#080510', 14, 30]} />

        {/* Lighting */}
        <ambientLight color="#6644aa" intensity={0.35} />
        <directionalLight
          position={[4, 10, 5]}
          intensity={0.9}
          color="#dde4ff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-5.5, 3.5, -5.5]} color="#ffaa44" intensity={1.8} distance={14} decay={2} castShadow />
        <pointLight position={[5.5, 3.5, 5.5]} color="#ffaa44" intensity={1.8} distance={14} decay={2} castShadow />
        <pointLight position={[0, -0.3, 0]} color="#220044" intensity={0.5} distance={6} decay={2} />

        {/* Fog */}
        <GroundFog />
        <SparkleDust />

        {/* Board */}
        <ChessBoard
          board={board}
          selectedPos={selectedPos}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
        />

        <ContactShadows
          position={[0, -0.35, 0]}
          opacity={0.45}
          scale={20}
          blur={2.5}
          far={6}
          color="#0d0520"
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.1}
        />

        {/* Environment map for glass reflections */}
        <Environment preset="night" />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.35}
            luminanceSmoothing={0.9}
            intensity={0.65}
            mipmapBlur
          />
          <ChromaticAberration offset={new THREE.Vector2(0.0008, 0.0008)} />
          <Vignette offset={0.3} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <VersionBadge projectName="chess3d" />
    </div>
  );
}
