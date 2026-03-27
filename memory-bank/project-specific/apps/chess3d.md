# 3D Chess

Multiplayer 3D Chess game built with Three.js and React Three Fiber.

## Overview

A fully interactive 3D chess game featuring valid move validation, turn-based gameplay, check/checkmate detection, and castling support. Two players can play on the same screen.

## Key Features

- **3D Board Rendering**: Beautiful wooden-styled chess board with Three.js
- **3D Chess Pieces**: All 6 piece types (king, queen, rook, bishop, knight, pawn) with distinct 3D models
- **Move Validation**: Full chess rules including pawn movement, knight jumps, sliding pieces, and king moves
- **Check/Checkmate Detection**: Automatically detects when king is in check or game is over
- **Castling**: Supports both kingside and queenside castling
- **Move History**: Tracks all moves made in the game
- **Turn Indicator**: Clear display of current player's turn
- **New Game**: Reset button to start a fresh game

## Technical Details

- **Frontend**: Next.js, React Three Fiber, Three.js
- **Rendering**: Uses Three.js primitives for piece geometries
- **Board State**: 8x8 2D array representing piece positions
- **Move Logic**: Comprehensive validation including preventing moves that leave king in check
- **Location**: `node-projects/my-app/src/app/chess3d/`

## Controls

- **Left Click**: Select a piece or click a valid move square
- **Orbit**: Right-click drag to rotate camera
- **Zoom**: Scroll wheel to zoom in/out

## How to Play

1. White pieces move first.
2. Click on a piece to select it (valid moves will be highlighted in green).
3. Click on a highlighted square to move the piece.
4. The game automatically detects check and checkmate conditions.
5. Click "New Game" to restart at any time.
