'use client';

import { VersionBadge } from '@/components/VersionBadge';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing';
import { SMAAPreset } from 'postprocessing';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { Piece, PieceType, PlayerColor, Position, Move, AnimatingMove, INITIAL_BOARD, PIECE_ORDER } from './types';
import { getValidMoves, findKing, isInCheck, isCheckmate, getBestAIMove } from './chess-logic';
import { GlassPiece } from './glass-pieces';
import { GroundFog, SparkleDust } from './particles';
import { playMoveSound, playCaptureSound, playCheckSound, playCheckmateSound } from './audio';
import { ChessBoard } from './board';
import { StartingMenu } from './menu';

// ─── Ambient Audio ───────────────────────────────────────────────────────────

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
  } catch {}
}

function toggleAmbient(on: boolean) {
  if (ambientGain) {
    ambientGain.gain.linearRampToValueAtTime(on ? 0.02 : 0, ambientGain.context.currentTime + 0.5);
  }
}

// ─── Animating Piece ─────────────────────────────────────────────────────────

const BOARD_SIZE = 8;

function AnimatingPiece({ move }: { move: AnimatingMove }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(move.progress);

  const fromX = move.from.col - 3.5;
  const fromZ = move.from.row - 3.5;
  const toX = move.to.col - 3.5;
  const toZ = move.to.row - 3.5;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 3);
    const t = progressRef.current;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const x = fromX + (toX - fromX) * ease;
    const z = fromZ + (toZ - fromZ) * ease;
    const y = 0.05 + Math.sin(Math.PI * t) * 0.8;

    groupRef.current.position.set(x, y, z);
  });

  return (
    <group ref={groupRef} position={[fromX, 0.05, fromZ]}>
      <GlassPiece type={move.piece.type} color={move.piece.color} />
    </group>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Chess3D() {
  const [gameMode, setGameMode] = useState<'menu' | 'ai' | 'pvp'>('menu');
  const [board, setBoard] = useState<(Piece | null)[][]>(INITIAL_BOARD.map(row => [...row]));
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('white');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate'>('playing');
  const [soundOn, setSoundOn] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [capturedWhite, setCapturedWhite] = useState<Piece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<Piece[]>([]);
  const [animatingMove, setAnimatingMove] = useState<AnimatingMove | null>(null);

  const applyMoveToBoard = useCallback(
    (move: Move) => {
      if (animatingMove) return;

      const piece: Piece = { ...board[move.from.row][move.from.col]! };

      let rookFrom: Position | undefined;
      let rookTo: Position | undefined;
      if (piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
        if (move.to.col === 6) {
          rookFrom = { row: move.from.row, col: 7 };
          rookTo = { row: move.from.row, col: 5 };
        } else if (move.to.col === 2) {
          rookFrom = { row: move.from.row, col: 0 };
          rookTo = { row: move.from.row, col: 3 };
        }
      }

      setAnimatingMove({
        from: move.from,
        to: move.to,
        piece,
        captured: move.captured,
        isCastling: rookFrom !== undefined,
        rookFrom,
        rookTo,
        progress: 0,
      });

      setTimeout(() => {
        const newBoard = board.map((r) => [...r]);
        if (piece.type === 'king' || piece.type === 'rook') {
          piece.hasMoved = true;
        }

        if (rookFrom && rookTo) {
          const rook = newBoard[rookFrom.row][rookFrom.col];
          newBoard[rookTo.row][rookTo.col] = { ...rook!, hasMoved: true };
          newBoard[rookFrom.row][rookFrom.col] = null;
        }

        newBoard[move.to.row][move.to.col] = piece;
        newBoard[move.from.row][move.from.col] = null;

        const opponent = currentTurn === 'white' ? 'black' : 'white';
        const check = isInCheck(newBoard, opponent);
        const checkmate = check && isCheckmate(newBoard, opponent);

        if (move.captured) {
          if (currentTurn === 'white') {
            setCapturedWhite(prev => [...prev, move.captured!]);
          } else {
            setCapturedBlack(prev => [...prev, move.captured!]);
          }
        }

        setBoard(newBoard);
        setMoveHistory((prev) => [...prev, move]);
        setSelectedPos(null);
        setValidMoves([]);
        setCurrentTurn(opponent);
        setGameStatus(checkmate ? 'checkmate' : check ? 'check' : 'playing');
        setAnimatingMove(null);

        if (soundOn) {
          if (checkmate) playCheckmateSound();
          else if (check) playCheckSound();
          else if (move.captured) playCaptureSound();
          else playMoveSound();
        }
      }, 350);
    },
    [board, currentTurn, soundOn, animatingMove]
  );

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (animatingMove) return;
      if (gameMode === 'ai' && currentTurn === 'black') return;
      if (aiThinking) return;

      const clickedPiece = board[row][col];
      const isClickedOwnPiece = clickedPiece && clickedPiece.color === currentTurn;

      if (selectedPos && validMoves.some((m) => m.row === row && m.col === col)) {
        const move: Move = {
          from: selectedPos,
          to: { row, col },
          piece: board[selectedPos.row][selectedPos.col]!,
          captured: clickedPiece || undefined,
        };
        applyMoveToBoard(move);
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
    [board, selectedPos, validMoves, currentTurn, gameMode, aiThinking, applyMoveToBoard, animatingMove]
  );

  useEffect(() => {
    if (gameMode !== 'ai' || currentTurn !== 'black' || gameStatus === 'checkmate' || animatingMove) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      const aiMove = getBestAIMove(board, 'black');
      if (aiMove) {
        applyMoveToBoard(aiMove);
      }
      setAiThinking(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [currentTurn, gameMode, board, gameStatus, applyMoveToBoard, animatingMove]);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD.map((row) => [...row]));
    setCurrentTurn('white');
    setSelectedPos(null);
    setValidMoves([]);
    setMoveHistory([]);
    setGameStatus('playing');
    setAiThinking(false);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setAnimatingMove(null);
  }, []);

  const goToMenu = useCallback(() => {
    resetGame();
    setGameMode('menu');
  }, [resetGame]);

  const startGame = useCallback((vsAI: boolean) => {
    resetGame();
    setGameMode(vsAI ? 'ai' : 'pvp');
  }, [resetGame]);

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

  const kingPos = findKing(board, currentTurn);
  const kingInCheck = isInCheck(board, currentTurn) ? kingPos : null;

  const statusLabel = gameStatus === 'checkmate'
    ? (currentTurn === 'white' ? 'Black wins!' : 'White wins!')
    : gameStatus === 'check'
    ? 'Check!'
    : aiThinking
    ? 'AI thinking...'
    : animatingMove
    ? 'Moving...'
    : 'Playing';

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {gameMode === 'menu' && <StartingMenu onSelect={startGame} />}

      {/* HUD */}
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
              <span className="text-white/40">Mode</span>
              <span className="text-white/60 font-medium">
                {gameMode === 'ai' ? 'vs AI' : 'Local'}
              </span>
            </div>
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
                aiThinking ? 'text-yellow-400' :
                'text-emerald-400'
              }`}>
                {statusLabel}
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
              onClick={goToMenu}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-all text-xs font-medium"
            >
              Menu
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

      {/* Captured Pieces - White */}
      <CapturedPieces pieces={capturedWhite} label="White captured" side="right" top="5" />

      {/* Captured Pieces - Black */}
      <CapturedPieces pieces={capturedBlack} label="Black captured" side="right" top="auto" bottom="5" />

      <div className="absolute bottom-5 left-5 z-50 text-white/25 text-xs font-medium">
        {gameMode === 'ai' && currentTurn === 'black' ? 'AI is thinking...' : 'Click a piece to select, click a valid move to move'}
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#080510']} />
        <fog attach="fog" args={['#080510', 14, 30]} />

        <ambientLight color="#ffffff" intensity={.6} />
        <directionalLight
          position={[4, 10, 5]}
          intensity={4}
          color="#fdfefe"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-5.5, 3.5, -5.5]} color="#ece9e5" intensity={1.8} distance={14} decay={2} castShadow />
        <pointLight position={[5.5, 3.5, 5.5]} color="#f5f0ea" intensity={1.8} distance={14} decay={2} castShadow />
        <pointLight position={[0, -0.3, 0]} color="#d9d4de" intensity={0.5} distance={6} decay={2} />

        <GroundFog />
        <SparkleDust />

        <ChessBoard
          board={board}
          selectedPos={selectedPos}
          validMoves={validMoves}
          kingInCheck={kingInCheck}
          animatingMove={animatingMove}
          onSquareClick={handleSquareClick}
        />

        {animatingMove && <AnimatingPiece move={animatingMove} />}

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

        <Environment preset="night" />

        <EffectComposer multisampling={0}>
          <SMAA preset={SMAAPreset.ULTRA} />
          <Bloom
            luminanceThreshold={0.35}
            luminanceSmoothing={0.9}
            intensity={0.65}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <VersionBadge projectName="chess3d" />
    </div>
  );
}

// ─── Captured Pieces Sidebar ─────────────────────────────────────────────────

function CapturedPieces({
  pieces,
  label,
  side,
  top,
  bottom,
}: {
  pieces: Piece[];
  label: string;
  side: 'left' | 'right';
  top?: string;
  bottom?: string;
}) {
  if (pieces.length === 0) return null;

  const sorted = [...pieces].sort((a, b) => PIECE_ORDER[a.type] - PIECE_ORDER[b.type]);

  const pieceSymbol = (p: Piece) => {
    const symbols: Record<PieceType, Record<PlayerColor, string>> = {
      king:   { white: '\u2654', black: '\u265A' },
      queen:  { white: '\u2655', black: '\u265B' },
      rook:   { white: '\u2656', black: '\u265C' },
      bishop: { white: '\u2657', black: '\u265D' },
      knight: { white: '\u2658', black: '\u265E' },
      pawn:   { white: '\u2659', black: '\u265F' },
    };
    return symbols[p.type][p.color];
  };

  return (
    <div
      className={`absolute z-50 bg-[#0d0a14]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-3 text-white shadow-2xl shadow-black/40`}
      style={{
        [side]: '1.25rem',
        top: top ?? 'auto',
        bottom: bottom ?? 'auto',
      }}
    >
      <div className="text-[10px] text-white/40 mb-2 tracking-wide">{label}</div>
      <div className="flex flex-wrap gap-1" style={{ maxWidth: '120px' }}>
        {sorted.map((p, i) => (
          <span
            key={i}
            className="text-lg leading-none"
            style={{ opacity: 0.7, filter: p.color === 'white' ? 'brightness(1.3)' : 'none' }}
          >
            {pieceSymbol(p)}
          </span>
        ))}
      </div>
    </div>
  );
}
