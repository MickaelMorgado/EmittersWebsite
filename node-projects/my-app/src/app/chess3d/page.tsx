'use client';

import { VersionBadge } from '@/components/VersionBadge';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { RotateCcw, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

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
  const backRank = color === 'white' ? 0 : 7;

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

const PIECE_COLORS = {
  white: '#f0f0f0',
  black: '#2a2a2a',
};

function ChessPiece({
  type,
  color,
  isSelected,
  onClick,
}: {
  type: PieceType;
  color: PlayerColor;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const baseColor = PIECE_COLORS[color];
  const accentColor = color === 'white' ? '#1a1a1a' : '#d4af37';

  return (
    <group onClick={onClick}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.6, 16]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.2} />
      </mesh>

      {type === 'king' && (
        <mesh castShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshStandardMaterial color={accentColor} roughness={0.2} metalness={0.4} />
        </mesh>
      )}
      {type === 'queen' && (
        <mesh castShadow position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.2} metalness={0.4} />
        </mesh>
      )}
      {type === 'rook' && (
        <mesh castShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.4, 4]} />
          <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.2} />
        </mesh>
      )}
      {type === 'bishop' && (
        <mesh castShadow position={[0, 0.75, 0]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshStandardMaterial color={accentColor} roughness={0.2} metalness={0.4} />
        </mesh>
      )}
      {type === 'knight' && (
        <group position={[0, 0.65, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.3, 0.4]} />
            <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 0.2, -0.1]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.15, 0.25, 0.15]} />
            <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      )}
      {type === 'pawn' && (
        <mesh castShadow position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.2} />
        </mesh>
      )}

      {isSelected && (
        <mesh position={[0, 0.05, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

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
  const color = isLight ? '#f0d9b5' : '#b58863';

  return (
    <group position={[col - 3.5, 0, row - 3.5]} onClick={onClick}>
      <mesh receiveShadow>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial
          color={isSelected ? '#ffff00' : isValidMove ? (isLight ? '#7fc97f' : '#4d8f4d') : color}
          roughness={0.8}
        />
      </mesh>

      {isValidMove && (
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial
            color={hasPiece ? '#ff4444' : '#ffffff'}
            transparent
            opacity={hasPiece ? 0.8 : 0.4}
          />
        </mesh>
      )}
    </group>
  );
}

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
  const selectedIsLight = selectedPos
    ? (selectedPos.row + selectedPos.col) % 2 === 1
    : false;

  return (
    <group>
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[8.2, 0.2, 8.2]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>

      {Array(8)
        .fill(null)
        .map((_, row) =>
          Array(8)
            .fill(null)
            .map((_, col) => {
              const isLight = (row + col) % 2 === 1;
              const piece = board[row][col];
              const isSelected =
                selectedPos?.row === row && selectedPos?.col === col;
              const isValidMove = validMoves.some(
                (m) => m.row === row && m.col === col
              );

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
                    <group position={[col - 3.5, 0, row - 3.5]}>
                      <ChessPiece
                        type={piece.type}
                        color={piece.color}
                        isSelected={isSelected}
                      />
                    </group>
                  )}
                </group>
              );
            })
        )}
    </group>
  );
}

export default function Chess3D() {
  const [board, setBoard] = useState<(Piece | null)[][]>(INITIAL_BOARD.map(row => [...row]));
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('white');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate'>('playing');

  const selectedPiece = selectedPos
    ? board[selectedPos.row][selectedPos.col]
    : null;

  const isPlayersTurn = useCallback(
    (color: PlayerColor) => {
      return color === currentTurn;
    },
    [currentTurn]
  );

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      const clickedPiece = board[row][col];
      const isClickedOwnPiece =
        clickedPiece && clickedPiece.color === currentTurn;

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

        return;
      }

      if (isClickedOwnPiece) {
        setSelectedPos({ row, col });
        const moves = getValidMoves(board, { row, col });
        setValidMoves(moves);
        return;
      }

      setSelectedPos(null);
      setValidMoves([]);
    },
    [board, selectedPos, validMoves, currentTurn]
  );

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD.map((row) => [...row]));
    setCurrentTurn('white');
    setSelectedPos(null);
    setValidMoves([]);
    setMoveHistory([]);
    setGameStatus('playing');
  }, []);

  const isKingInCheck = useMemo(
    () => isInCheck(board, currentTurn),
    [board, currentTurn]
  );

  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} />
            <span className="font-semibold text-sm">3D Chess</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Turn:</span>
              <span
                className={`font-bold ${
                  currentTurn === 'white' ? 'text-white' : 'text-gray-300'
                }`}
              >
                {currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Status:</span>
              <span
                className={`font-bold ${
                  gameStatus === 'checkmate'
                    ? 'text-red-500'
                    : gameStatus === 'check'
                    ? 'text-orange-500'
                    : 'text-green-500'
                }`}
              >
                {gameStatus === 'checkmate'
                  ? 'Checkmate!'
                  : gameStatus === 'check'
                  ? 'Check!'
                  : 'Playing'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Moves:</span>
              <span className="text-white">{moveHistory.length}</span>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
          >
            <RotateCcw size={14} />
            New Game
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-50 text-white/50 text-xs">
        Click a piece to select, click a valid move to move
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 8, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.3} />

        <ContactShadows
          position={[0, -0.15, 0]}
          opacity={0.5}
          scale={20}
          blur={2}
          far={5}
        />

        <ChessBoard
          board={board}
          selectedPos={selectedPos}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.1}
        />

        <Environment preset="city" />
      </Canvas>

      <VersionBadge projectName="chess3d" />
    </div>
  );
}
