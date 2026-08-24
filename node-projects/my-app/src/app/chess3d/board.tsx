'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Piece, Position } from './types';
import { GlassPiece } from './glass-pieces';

const BOARD_SIZE = 8;

function ChessBoardSquare({
  row,
  col,
  isLight,
  isSelected,
  isValidMove,
  isCheck,
  hasPiece,
  onClick,
}: {
  row: number;
  col: number;
  isLight: boolean;
  isSelected?: boolean;
  isValidMove?: boolean;
  isCheck?: boolean;
  hasPiece: boolean;
  onClick?: () => void;
}) {
  return (
    <group position={[col - 3.5, 0, row - 3.5]} onClick={onClick}>
      <mesh receiveShadow>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhysicalMaterial
          color={isCheck ? '#ff3333' : isLight ? '#b8c8d8' : '#1a1028'}
          transmission={isCheck ? 0.3 : isLight ? 0.35 : 0.15}
          roughness={isCheck ? 0.1 : isLight ? 0.12 : 0.06}
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

export function ChessBoard({
  board,
  selectedPos,
  validMoves,
  kingInCheck,
  animatingMove,
  onSquareClick,
}: {
  board: (Piece | null)[][];
  selectedPos: Position | null;
  validMoves: Position[];
  kingInCheck: Position | null;
  animatingMove?: { from: Position; to: Position; progress: number } | null;
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
          const isCheck = kingInCheck?.row === row && kingInCheck?.col === col;

          let showPiece = true;
          let pieceX = col - 3.5;
          let pieceZ = row - 3.5;

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
                isSelected={isSelected}
                isValidMove={isValidMove}
                isCheck={isCheck}
                hasPiece={!!piece}
                onClick={() => onSquareClick(row, col)}
              />
              {showPiece && piece && (
                <group position={[pieceX, 0.05, pieceZ]}>
                  <group onClick={(e) => { e.stopPropagation(); onSquareClick(row, col); }}>
                    <GlassPiece type={piece.type} color={piece.color} isSelected={isSelected} />
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
