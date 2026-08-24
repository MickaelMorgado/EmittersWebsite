'use client';

import * as THREE from 'three';
import { GlassPiece } from './glass-pieces';
import { useMarbleTextures } from './marble';
import { Piece, Position } from './types';

const BOARD_SIZE = 8;

function ChessBoardSquare({
  row,
  col,
  isLight,
  isCheck,
  lightTex,
  darkTex,
  onClick,
}: {
  row: number;
  col: number;
  isLight: boolean;
  isCheck?: boolean;
  lightTex: THREE.CanvasTexture;
  darkTex: THREE.CanvasTexture;
  onClick?: () => void;
}) {
  return (
    <group position={[col - 3.5, 0, row - 3.5]} onClick={onClick}>
      <mesh receiveShadow>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhysicalMaterial
          map={isLight ? lightTex : darkTex}
          color={isCheck ? '#ff3333' : isLight ? '#e0e4f0' : '#1a1028'}
          transmission={isCheck ? 0.3 : isLight ? 0.25 : 0.15}
          roughness={isCheck ? 0.1 : isLight ? 0.15 : 0.08}
          thickness={0.5}
          ior={1.45}
          metalness={0.02}
          envMapIntensity={1.8}
        />
      </mesh>
    </group>
  );
}

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
    </group>
  );
}

export function ChessBoard({
  board,
  kingInCheck,
  animatingMove,
  onSquareClick,
}: {
  board: (Piece | null)[][];
  selectedPos?: Position | null;
  validMoves?: Position[];
  kingInCheck: Position | null;
  animatingMove?: { from: Position; to: Position; progress: number } | null;
  onSquareClick: (row: number, col: number) => void;
}) {
  const { lightTex, darkTex } = useMarbleTextures();

  return (
    <group>
      <BoardFrame />
      {Array(8).fill(null).map((_, row) =>
        Array(8).fill(null).map((_, col) => {
          const isLight = (row + col) % 2 === 1;
          const piece = board[row][col];
          const isCheck = kingInCheck?.row === row && kingInCheck?.col === col;

          let showPiece = true;

          if (animatingMove) {
            if (animatingMove.from.row === row && animatingMove.from.col === col) {
              showPiece = false;
            }
            if (animatingMove.to.row === row && animatingMove.to.col === col) {
              showPiece = false;
            }
          }

          return (
            <group key={`${row}-${col}`}>
              <ChessBoardSquare
                row={row}
                col={col}
                isLight={isLight}
                isCheck={isCheck}
                lightTex={lightTex}
                darkTex={darkTex}
                onClick={() => onSquareClick(row, col)}
              />
              {showPiece && piece && (
                <group position={[col - 3.5, 0.05, row - 3.5]}>
                  <group onClick={(e) => { e.stopPropagation(); onSquareClick(row, col); }}>
                    <GlassPiece type={piece.type} color={piece.color} />
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
