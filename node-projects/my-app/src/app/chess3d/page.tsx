'use client';

import { VersionBadge } from '@/components/VersionBadge';
import { ContactShadows, Environment, OrbitControls, Sparkles } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Copy, Users, Wifi, WifiOff } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
// @ts-expect-error - howler does not have TypeScript definitions
import { Howler, Howl } from 'howler';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';

// ── Types ───────────────────────────────────────────────────────────────────

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

type Board = (Piece | null)[][];

type GamePhase = 'lobby' | 'waiting' | 'playing';
type GameStatus = 'waiting' | 'playing' | 'check' | 'checkmate';

interface P2PMessage {
  type: string;
  [key: string]: unknown;
}

// ── Constants ───────────────────────────────────────────────────────────────

const ROOM_PREFIX = 'chess3d-room-';

const INITIAL_BOARD: Board = [
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
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'black' as PlayerColor })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'white' as PlayerColor })),
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

function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Sound Effects ───────────────────────────────────────────────────────────

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine', volume = 0.3) {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + duration);
}

const soundEffects = {
  movePiece: () => {
    playTone(800, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1000, 0.08, 'sine', 0.15), 60);
  },
  capturePiece: () => {
    playTone(400, 0.15, 'square', 0.25);
    setTimeout(() => playTone(600, 0.1, 'square', 0.2), 100);
  },
  check: () => {
    playTone(1200, 0.2, 'sine', 0.3);
    setTimeout(() => playTone(900, 0.2, 'sine', 0.3), 200);
  },
  checkmate: () => {
    [1200, 900, 600].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.3), i * 300);
    });
  },
  gameStart: () => {
    playTone(523, 0.2, 'sine', 0.25); // C5
    setTimeout(() => playTone(659, 0.2, 'sine', 0.25), 150); // E5
    setTimeout(() => playTone(784, 0.4, 'sine', 0.3), 300); // G5
  },
  invalidMove: () => {
    playTone(300, 0.1, 'square', 0.2);
  },
};

let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function startAmbient() {
  if (!audioContext || ambientOsc) return;

  ambientOsc = audioContext.createOscillator();
  ambientGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  ambientOsc.type = 'sine';
  ambientOsc.frequency.value = 60; // Deep bass

  filter.type = 'lowpass';
  filter.frequency.value = 100;

  ambientGain.gain.setValueAtTime(0.08, audioContext.currentTime);

  ambientOsc.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(audioContext.destination);

  ambientOsc.start();
}

function stopAmbient() {
  if (ambientOsc) {
    ambientGain?.gain.exponentialRampToValueAtTime(0.01, audioContext!.currentTime + 1);
    setTimeout(() => {
      ambientOsc?.stop();
      ambientOsc = null;
      ambientGain = null;
    }, 1000);
  }
}

// ── Chess Logic ─────────────────────────────────────────────────────────────

function getValidMoves(board: Board, pos: Position, checkKingSafety = true): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, color } = piece;
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  const inBounds = (r: number, c: number) => r >= 0 && r <= 7 && c >= 0 && c <= 7;
  const isOwnPiece = (r: number, c: number) => inBounds(r, c) && board[r][c]?.color === color;
  const isEnemyPiece = (r: number, c: number) => {
    if (!inBounds(r, c)) return false;
    const t = board[r][c];
    return t !== null && t.color !== color;
  };
  const isEmpty = (r: number, c: number) => inBounds(r, c) && !board[r][c];

  const addMove = (r: number, c: number) => {
    if (!inBounds(r, c) || isOwnPiece(r, c)) return false;
    moves.push({ row: r, col: c });
    return isEmpty(r, c);
  };

  if (type === 'pawn') {
    const oneF = pos.row + direction;
    if (isEmpty(oneF, pos.col)) {
      addMove(oneF, pos.col);
      const twoF = pos.row + 2 * direction;
      if (pos.row === startRow && isEmpty(twoF, pos.col)) addMove(twoF, pos.col);
    }
    for (const dc of [-1, 1]) {
      if (isEnemyPiece(oneF, pos.col + dc)) moves.push({ row: oneF, col: pos.col + dc });
    }
  }

  if (type === 'rook' || type === 'queen') {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let r = pos.row + dr, c = pos.col + dc;
      while (inBounds(r, c)) {
        if (isOwnPiece(r, c)) break;
        moves.push({ row: r, col: c });
        if (isEnemyPiece(r, c)) break;
        r += dr; c += dc;
      }
    }
  }

  if (type === 'bishop' || type === 'queen') {
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      let r = pos.row + dr, c = pos.col + dc;
      while (inBounds(r, c)) {
        if (isOwnPiece(r, c)) break;
        moves.push({ row: r, col: c });
        if (isEnemyPiece(r, c)) break;
        r += dr; c += dc;
      }
    }
  }

  if (type === 'knight') {
    for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
      addMove(pos.row + dr, pos.col + dc);
    }
  }

  if (type === 'king') {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      addMove(pos.row + dr, pos.col + dc);
    }
    if (!piece.hasMoved) {
      const row = pos.row;
      const ksRook = board[row][7];
      if (ksRook?.type === 'rook' && ksRook.color === color && !ksRook.hasMoved && isEmpty(row, 5) && isEmpty(row, 6)) {
        moves.push({ row, col: 6 });
      }
      const qsRook = board[row][0];
      if (qsRook?.type === 'rook' && qsRook.color === color && !qsRook.hasMoved && isEmpty(row, 1) && isEmpty(row, 2) && isEmpty(row, 3)) {
        moves.push({ row, col: 2 });
      }
    }
  }

  if (checkKingSafety) {
    return moves.filter((m) => !wouldBeInCheck(board, color, m, pos));
  }
  return moves;
}

function wouldBeInCheck(board: Board, color: PlayerColor, move: Position, from: Position): boolean {
  const nb = board.map((row) => [...row]);
  nb[move.row][move.col] = nb[from.row][from.col];
  nb[from.row][from.col] = null;
  const kp = findKing(nb, color);
  if (!kp) return false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = nb[r][c];
      if (p && p.color !== color) {
        if (getValidMoves(nb, { row: r, col: c }, false).some((a) => a.row === kp.row && a.col === kp.col)) return true;
      }
    }
  }
  return false;
}

function findKing(board: Board, color: PlayerColor): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'king' && board[r][c]?.color === color) return { row: r, col: c };
    }
  }
  return null;
}

function isInCheck(board: Board, color: PlayerColor): boolean {
  const kp = findKing(board, color);
  if (!kp) return false;
  const enemy = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === enemy) {
        if (getValidMoves(board, { row: r, col: c }, false).some((a) => a.row === kp.row && a.col === kp.col)) return true;
      }
    }
  }
  return false;
}

function isCheckmate(board: Board, color: PlayerColor): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color && getValidMoves(board, { row: r, col: c }, true).length > 0) return false;
    }
  }
  return true;
}

function applyMove(board: Board, from: Position, to: Position): Board {
  const nb = cloneBoard(board);
  const piece = nb[from.row][from.col];
  if (!piece) return nb;

  // Castling
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    if (to.col === 6) {
      nb[from.row][5] = { ...nb[from.row][7]!, hasMoved: true };
      nb[from.row][7] = null;
    } else if (to.col === 2) {
      nb[from.row][3] = { ...nb[from.row][0]!, hasMoved: true };
      nb[from.row][0] = null;
    }
  }

  nb[to.row][to.col] = { ...piece, hasMoved: true };
  nb[from.row][from.col] = null;

  // Pawn promotion
  if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
    nb[to.row][to.col] = { type: 'queen', color: piece.color, hasMoved: true };
  }

  return nb;
}

// ── 3D Components ───────────────────────────────────────────────────────────

const PIECE_COLORS = { white: '#e8e8e8', black: '#1a1a1a' };

const MODEL_PATHS: Record<PieceType, string> = {
  king: '/3dmodels/chess/King.obj',
  queen: '/3dmodels/chess/Chess.obj', // Using Chess.obj for queen (fallback)
  bishop: '/3dmodels/chess/Bishop.obj',
  knight: '/3dmodels/chess/Chess.obj', // Using Chess.obj for knight (fallback)
  rook: '/3dmodels/chess/Chess.obj', // Using Chess.obj for rook (fallback)
  pawn: '/3dmodels/chess/Pawn.obj',
};

async function loadModel(path: string): Promise<THREE.Group> {
  const loader = new OBJLoader();
  const encoded = encodeURI(path);
  const response = await fetch(encoded);
  if (!response.ok) throw new Error(`Failed to load model: ${path} (${response.status})`);
  const text = await response.text();
  return loader.parse(text);
}

function ChessPieceModel({ type, color }: { type: PieceType; color: PlayerColor }) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let mounted = true;
    loadModel(MODEL_PATHS[type])
      .then((m) => {
        if (!mounted) return;
        m.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({
              color: PIECE_COLORS[color],
              roughness: 0.3,
              metalness: 0.2,
            });
          }
        });
        setModel(m);
      })
      .catch((err) => console.error(`Failed to load ${type}:`, err));
    return () => { mounted = false; };
  }, [type, color]);

  if (!model) return null;
  return <primitive object={model.clone(true)} scale={0.135} />;
}

function ChessPiece({
  type, color, isSelected, onClick,
}: {
  type: PieceType; color: PlayerColor; isSelected?: boolean; onClick?: () => void;
}) {
  return (
    <group onClick={onClick} position={[0, 0.1, 0]}>
      <Suspense fallback={null}>
        <ChessPieceModel type={type} color={color} />
      </Suspense>
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 32]} />
          <meshBasicMaterial color="#f4d03f" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function ChessBoardSquare({
  row, col, isLight, hasPiece, isSelected, isValidMove, onClick,
}: {
  row: number; col: number; isLight: boolean; hasPiece: boolean;
  isSelected?: boolean; isValidMove?: boolean; onClick?: () => void;
}) {
  const squareColor = isLight ? '#1e293b' : '#0f172a';
  const hoverGlow = isSelected || isValidMove;
  return (
    <group position={[col - 3.5, 0, row - 3.5]} onClick={onClick}>
      <mesh receiveShadow>
        <boxGeometry args={[1, 0.12, 1]} />
        <meshStandardMaterial
          color={isSelected ? '#fbbf24' : isValidMove ? (isLight ? '#22c55e' : '#16a34a') : squareColor}
          roughness={0.25}
          metalness={0.35}
          emissive={hoverGlow ? (isSelected ? '#fbbf24' : '#22c55e') : '#000000'}
          emissiveIntensity={hoverGlow ? 0.25 : 0.05}
        />
      </mesh>
      {isValidMove && (
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 32]} />
          <meshStandardMaterial
            color={hasPiece ? '#ef4444' : '#e2e8f0'}
            transparent
            opacity={hasPiece ? 0.95 : 0.75}
            roughness={0.05}
            metalness={0.8}
            emissive={hasPiece ? '#ef4444' : '#e2e8f0'}
            emissiveIntensity={hasPiece ? 0.5 : 0.3}
          />
        </mesh>
      )}
    </group>
  );
}

function ChessBoard({
  board, selectedPos, validMoves, onSquareClick,
}: {
  board: Board; selectedPos: Position | null; validMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
}) {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[8.6, 0.35, 8.6]} />
        <meshStandardMaterial color="#0a0e27" roughness={0.25} metalness={0.6} emissive="#2e1b4b" emissiveIntensity={0.08} />
      </mesh>
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[8.2, 0.06, 8.2]} />
        <meshStandardMaterial color="#0f1219" roughness={0.15} metalness={0.8} emissive="#1a1a3f" emissiveIntensity={0.1} />
      </mesh>
      {Array(8).fill(null).map((_, row) =>
        Array(8).fill(null).map((_, col) => {
          const isLight = (row + col) % 2 === 1;
          const piece = board[row][col];
          const isSel = selectedPos?.row === row && selectedPos?.col === col;
          const isVM = validMoves.some((m) => m.row === row && m.col === col);
          return (
            <group key={`${row}-${col}`}>
              <ChessBoardSquare
                row={row} col={col} isLight={isLight} hasPiece={!!piece}
                isSelected={isSel} isValidMove={isVM}
                onClick={() => onSquareClick(row, col)}
              />
              {piece && (
                <group position={[col - 3.5, 0, row - 3.5]}>
                  <ChessPiece type={piece.type} color={piece.color} isSelected={isSel} />
                </group>
              )}
            </group>
          );
        })
      )}
    </group>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function Chess3D() {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
  const [error, setError] = useState('');

  const [board, setBoard] = useState<Board>(() => cloneBoard(INITIAL_BOARD));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('white');
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');

  // Role: 'host' manages authoritative game state, 'guest' sends move requests
  const [role, setRole] = useState<'host' | 'guest' | null>(null);

  // Refs to track current game state for the host's message handler (avoids stale closures)
  const boardRef = useRef(board);
  const currentTurnRef = useRef(currentTurn);
  boardRef.current = board;
  currentTurnRef.current = currentTurn;

  // ── Send message to peer ──────────────────────────────────────────────
  const sendToPeer = useCallback((msg: P2PMessage) => {
    const conn = connRef.current;
    if (conn?.open) {
      conn.send(msg);
    }
  }, []);

  // ── Handle incoming messages ──────────────────────────────────────────
  const handleMessage = useCallback((msg: P2PMessage, isHost: boolean) => {
    switch (msg.type) {
      case 'game-start': {
        setBoard(cloneBoard(INITIAL_BOARD));
        setCurrentTurn('white');
        setGameStatus('playing');
        setPhase('playing');
        soundEffects.gameStart();
        startAmbient();
        break;
      }
      case 'game-state': {
        setBoard(msg.board as Board);
        setCurrentTurn(msg.currentTurn as PlayerColor);
        setGameStatus(msg.gameStatus as GameStatus);
        setSelectedPos(null);
        setValidMoves([]);
        break;
      }
      case 'move-request': {
        if (!isHost) break;
        const from = msg.from as Position;
        const to = msg.to as Position;

        // Read current state from refs (always fresh)
        const curBoard = boardRef.current;
        const curTurn = currentTurnRef.current;

        const piece = curBoard[from.row]?.[from.col];
        if (!piece || piece.color !== 'black' || curTurn !== 'black') break;

        const moves = getValidMoves(curBoard, from, true);
        if (!moves.some((m) => m.row === to.row && m.col === to.col)) break;

        const newBoard = applyMove(curBoard, from, to);
        const nextTurn: PlayerColor = 'white';

        // Check if capture
        const wasCapture = curBoard[to.row][to.col] !== null;
        if (wasCapture) {
          soundEffects.capturePiece();
        } else {
          soundEffects.movePiece();
        }

        let status: GameStatus = 'playing';
        if (isInCheck(newBoard, nextTurn)) {
          status = isCheckmate(newBoard, nextTurn) ? 'checkmate' : 'check';
          if (status === 'checkmate') {
            setTimeout(() => soundEffects.checkmate(), 100);
          } else {
            setTimeout(() => soundEffects.check(), 100);
          }
        } else if (isCheckmate(newBoard, nextTurn)) {
          status = 'checkmate';
          setTimeout(() => soundEffects.checkmate(), 100);
        }

        setBoard(newBoard);
        setCurrentTurn(nextTurn);
        setGameStatus(status);
        setSelectedPos(null);
        setValidMoves([]);

        sendToPeer({ type: 'game-state', board: newBoard, currentTurn: nextTurn, gameStatus: status });
        break;
      }
    }
  }, [sendToPeer]);

  // ── Setup connection handlers ─────────────────────────────────────────
  const setupConnection = useCallback((conn: DataConnection, isHost: boolean) => {
    connRef.current = conn;

    conn.on('open', () => {
      setConnected(true);
      setError('');

      if (isHost) {
        // Host starts the game
        const freshBoard = cloneBoard(INITIAL_BOARD);
        setBoard(freshBoard);
        setCurrentTurn('white');
        setGameStatus('playing');
        setPhase('playing');
        conn.send({ type: 'game-start' });
        // Small delay so guest processes game-start first
        setTimeout(() => {
          conn.send({ type: 'game-state', board: freshBoard, currentTurn: 'white', gameStatus: 'playing' });
        }, 100);
      }
    });

    conn.on('data', (data) => {
      handleMessage(data as P2PMessage, isHost);
    });

    conn.on('close', () => {
      setConnected(false);
      setPhase('lobby');
      setError('Opponent disconnected');
      connRef.current = null;
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      setError('Connection error: ' + err.message);
    });
  }, [handleMessage]);

  // ── Read room code from URL on mount ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setJoinCode(room.toUpperCase());
    }
  }, []);

  // ── Cleanup peer on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      connRef.current?.close();
      peerRef.current?.destroy();
    };
  }, []);

  // ── Create Room (Host) ────────────────────────────────────────────────
  const createRoom = useCallback(() => {
    setError('');
    const code = generateRoomCode();
    const peerId = ROOM_PREFIX + code;

    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      setRoomCode(code);
      setRole('host');
      setPlayerColor('white');
      setPhase('waiting');

      // Update URL so it's shareable
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.replaceState({}, '', url.toString());
    });

    peer.on('connection', (conn) => {
      setupConnection(conn, true);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        setError('Room code taken, try again');
        peer.destroy();
      } else {
        setError('Connection error: ' + err.message);
      }
    });
  }, [setupConnection]);

  // ── Join Room (Guest) ─────────────────────────────────────────────────
  const joinRoom = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError('');

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      setRoomCode(code);
      setRole('guest');
      setPlayerColor('black');
      setPhase('waiting');

      const conn = peer.connect(ROOM_PREFIX + code, { reliable: true });
      setupConnection(conn, false);

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.replaceState({}, '', url.toString());
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'peer-unavailable') {
        setError('Room not found. Make sure your friend created the game first.');
      } else {
        setError('Connection error: ' + err.message);
      }
    });
  }, [joinCode, setupConnection]);

  // ── Auto-join if URL has room code ────────────────────────────────────
  const autoJoinAttempted = useRef(false);
  useEffect(() => {
    if (autoJoinAttempted.current) return;
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && phase === 'lobby') {
      autoJoinAttempted.current = true;
      setJoinCode(room.toUpperCase());
      // Small delay to let state settle
      setTimeout(() => {
        const code = room.trim().toUpperCase();
        setError('');
        const peer = new Peer();
        peerRef.current = peer;
        peer.on('open', () => {
          setRoomCode(code);
          setRole('guest');
          setPlayerColor('black');
          setPhase('waiting');
          const conn = peer.connect(ROOM_PREFIX + code, { reliable: true });
          setupConnection(conn, false);
        });
        peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (err.type === 'peer-unavailable') {
            setError('Room not found. Make sure your friend created the game first.');
            setPhase('lobby');
          } else {
            setError('Connection error: ' + err.message);
          }
        });
      }, 500);
    }
  }, [phase, setupConnection]);

  // ── Leave Room ────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    stopAmbient();
    connRef.current?.close();
    peerRef.current?.destroy();
    connRef.current = null;
    peerRef.current = null;
    setPhase('lobby');
    setRoomCode('');
    setRole(null);
    setConnected(false);
    setBoard(cloneBoard(INITIAL_BOARD));
    setCurrentTurn('white');
    setGameStatus('waiting');
    setSelectedPos(null);
    setValidMoves([]);
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // ── Copy share link ───────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    navigator.clipboard.writeText(url.toString());
  }, [roomCode]);

  // ── Handle square click ───────────────────────────────────────────────
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (phase !== 'playing' || gameStatus === 'checkmate') return;
      if (currentTurn !== playerColor) return;

      const clickedPiece = board[row][col];

      // If a piece is selected and clicking a valid move
      if (selectedPos && validMoves.some((m) => m.row === row && m.col === col)) {
        if (role === 'host') {
          // Host applies move directly
          const newBoard = applyMove(board, selectedPos, { row, col });
          const nextTurn: PlayerColor = currentTurn === 'white' ? 'black' : 'white';

          // Check if capture
          const wasCapture = board[row][col] !== null;
          if (wasCapture) {
            soundEffects.capturePiece();
          } else {
            soundEffects.movePiece();
          }

          let status: GameStatus = 'playing';
          if (isInCheck(newBoard, nextTurn)) {
            status = isCheckmate(newBoard, nextTurn) ? 'checkmate' : 'check';
            if (status === 'checkmate') {
              setTimeout(() => soundEffects.checkmate(), 100);
            } else {
              setTimeout(() => soundEffects.check(), 100);
            }
          } else if (isCheckmate(newBoard, nextTurn)) {
            status = 'checkmate';
            setTimeout(() => soundEffects.checkmate(), 100);
          }

          setBoard(newBoard);
          setCurrentTurn(nextTurn);
          setGameStatus(status);
          setSelectedPos(null);
          setValidMoves([]);

          sendToPeer({ type: 'game-state', board: newBoard, currentTurn: nextTurn, gameStatus: status });
        } else {
          // Guest sends move request to host
          sendToPeer({ type: 'move-request', from: selectedPos, to: { row, col } });
          setSelectedPos(null);
          setValidMoves([]);
        }
        return;
      }

      // Select own piece
      if (clickedPiece && clickedPiece.color === playerColor) {
        setSelectedPos({ row, col });
        setValidMoves(getValidMoves(board, { row, col }));
        return;
      }

      setSelectedPos(null);
      setValidMoves([]);
    },
    [board, selectedPos, validMoves, currentTurn, playerColor, phase, gameStatus, role, sendToPeer]
  );

  const isMyTurn = currentTurn === playerColor;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen relative bg-[#0a0a0f]">
      {/* ── Lobby ── */}
      {phase === 'lobby' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/60 via-black/50 to-black/70 backdrop-blur-xl">
          <div className="bg-white/10 border border-white/20 rounded-3xl p-10 w-full max-w-md shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="p-4 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-2xl border border-indigo-400/30 backdrop-blur-sm">
                  <Users className="w-8 h-8 text-indigo-300" />
                </div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">3D Chess</h1>
              </div>

              <p className="text-center text-white/50 text-sm mb-8 font-light">
                Browser-to-browser P2P • Ultra Fast Gameplay
              </p>

              <div className="space-y-4">
                <button
                  onClick={createRoom}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 hover:shadow-2xl"
                >
                  Create Game
                </button>

                <div className="relative flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-white/40 text-xs tracking-widest uppercase font-semibold">or join</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    maxLength={4}
                    className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 text-center text-lg font-mono uppercase focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                  />
                  <button
                    onClick={joinRoom}
                    disabled={joinCode.length < 3}
                    className="px-7 py-3.5 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/40 backdrop-blur-sm border border-indigo-400/30"
                  >
                    Join
                  </button>
                </div>

                {error && <p className="text-red-300 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl py-2.5">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Waiting ── */}
      {phase === 'waiting' && !connected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white/10 border border-white/20 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden w-96">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${role === 'host' ? 'animate-pulse' : 'animate-spin'} bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30`}>
                <Users className={`w-8 h-8 ${role === 'host' ? 'text-indigo-400' : 'text-purple-400'}`} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {role === 'host' ? '⏳ Waiting for opponent' : '🔗 Connecting...'}
              </h2>
              {role === 'host' && (
                <>
                  <p className="text-white/60 text-sm mb-5 font-light">Share this code with your friend:</p>
                  <div className="flex items-center justify-center gap-3 mb-6 bg-white/10 border border-indigo-400/30 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-[0.5rem]">{roomCode}</span>
                  </div>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 mx-auto px-5 py-3 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all text-indigo-100 text-sm font-semibold border border-indigo-400/30 shadow-lg hover:shadow-indigo-500/30 backdrop-blur-sm"
                  >
                    <Copy size={16} /> Copy Link
                  </button>
                </>
              )}
              <div className="flex items-center justify-center gap-3 mt-7 mb-6 bg-white/5 border border-white/10 rounded-xl p-3">
                <span className={`w-4 h-4 rounded-full ${playerColor === 'white' ? 'bg-white shadow-lg' : 'bg-gray-800 border-2 border-white/30'}`} />
                <span className="text-white/70 text-sm font-medium">You are <span className="font-bold text-white">{playerColor.toUpperCase()}</span></span>
              </div>
              {error && <p className="text-red-300 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl py-2.5">{error}</p>}
              <button onClick={leaveRoom} className="text-white/50 hover:text-white text-sm transition-colors font-medium">
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Playing HUD ── */}
      {phase === 'playing' && (
        <div className="absolute top-4 left-4 z-50 space-y-2">
          <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 text-white shadow-2xl relative overflow-hidden max-w-xs">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="font-semibold text-sm text-green-300">P2P Connected</span>
              </div>

              <div className="space-y-3 text-sm mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">You</span>
                  <span className={`font-bold text-lg ${playerColor === 'white' ? 'text-white' : 'text-gray-700'}`}>
                    {playerColor === 'white' ? '⚪' : '⚫'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Turn</span>
                  <span className={`font-bold text-lg ${currentTurn === 'white' ? 'text-white' : 'text-gray-700'}`}>
                    {currentTurn === 'white' ? '⚪' : '⚫'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Status</span>
                  <span className={`font-bold px-3 py-1 rounded-lg text-xs ${
                    gameStatus === 'checkmate' ? 'bg-red-500/20 text-red-300' : gameStatus === 'check' ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {gameStatus === 'checkmate' ? '♔ Checkmate' : gameStatus === 'check' ? '⚠ Check' : '▶ Playing'}
                  </span>
                </div>
              </div>

              <div className={`text-center py-3 rounded-xl mb-5 font-bold transition-all ${
                isMyTurn
                  ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/30'
                  : 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border border-yellow-500/30'
              }`}>
                {gameStatus === 'checkmate'
                  ? (currentTurn === playerColor ? '💔 You Lost' : '👑 You Win!')
                  : isMyTurn ? "🎯 Your Turn!" : "⏳ Opponent's Turn"}
              </div>

              <button onClick={leaveRoom} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all duration-300 text-xs font-semibold border border-white/10 hover:border-white/20">
                Exit Game
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl p-3.5 rounded-2xl border border-white/20 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3 text-sm">
              <span className="text-white/60 font-medium">Room Code:</span>
              <span className="font-mono font-bold text-indigo-300 text-lg tracking-widest">{roomCode}</span>
              <button onClick={copyLink} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Copy link">
                <Copy size={14} className="text-indigo-300 hover:text-indigo-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-50 text-white/50 text-xs">
        {phase === 'playing'
          ? gameStatus === 'checkmate'
            ? 'Game over'
            : isMyTurn ? 'Your turn — click a piece to move' : 'Waiting for opponent'
          : ''}
      </div>

      {/* ── 3D Canvas ── */}
      <Canvas shadows camera={{ position: [0, 12, 10], fov: 40 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#050508']} />
        <fog attach="fog" args={['#050508', 12, 35]} />

        <ambientLight intensity={0.15} color="#4a5568" />
        <directionalLight
          position={[8, 15, 8]} intensity={0.8} color="#e2e8f0"
          castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-far={40} shadow-camera-left={-12} shadow-camera-right={12}
          shadow-camera-top={12} shadow-camera-bottom={-12}
        />
        <spotLight
          position={[-10, 20, -5]} angle={0.3} penumbra={0.5}
          intensity={1.5} color="#6366f1" castShadow
        />
        <spotLight
          position={[10, 15, 5]} angle={0.4} penumbra={0.6}
          intensity={0.8} color="#8b5cf6" castShadow
        />
        <pointLight position={[0, -3, 0]} intensity={0.3} color="#1e1b4b" />

        <Sparkles count={150} scale={20} size={1.5} speed={0.3} opacity={0.15} color="#818cf8" />

        <ContactShadows position={[0, -0.16, 0]} opacity={0.7} scale={25} blur={3} far={8} />

        <ChessBoard
          board={board}
          selectedPos={phase === 'playing' ? selectedPos : null}
          validMoves={phase === 'playing' ? validMoves : []}
          onSquareClick={handleSquareClick}
        />

        <OrbitControls
          enableDamping dampingFactor={0.05}
          minDistance={6} maxDistance={25}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={phase !== 'playing'}
          autoRotateSpeed={0.5}
        />
        <Environment preset="night" />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.1}
            height={300}
            intensity={0.6}
            radius={0.5}
          />
        </EffectComposer>
      </Canvas>

      <VersionBadge projectName="chess3d" />
    </div>
  );
}
