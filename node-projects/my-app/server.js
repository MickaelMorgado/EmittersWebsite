const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map();
const wsClients = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getValidMoves(board, pos, checkKingSafety = true) {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves = [];
  const { type, color } = piece;
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  const isOwnPiece = (r, c) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    return board[r][c]?.color === color;
  };

  const isEnemyPiece = (r, c) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const target = board[r][c];
    return target && target.color !== color;
  };

  const isEmpty = (r, c) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    return !board[r][c];
  };

  const addMove = (r, c) => {
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
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
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
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
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
  }

  if (checkKingSafety) {
    return moves.filter((m) => !wouldBeInCheck(board, color, m, pos));
  }

  return moves;
}

function wouldBeInCheck(board, color, move, from) {
  const newBoard = board.map((row) => [...row.map(cell => cell ? { ...cell } : null)]);
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

function findKing(board, color) {
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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create-room', (callback) => {
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (rooms.has(roomCode));

      const initialBoard = createInitialBoard();
      const room = {
        code: roomCode,
        players: [{ id: socket.id, color: 'white', ready: true }],
        board: initialBoard,
        currentTurn: 'white',
        gameStatus: 'waiting',
        spectators: [],
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerColor = 'white';

      console.log(`Room created: ${roomCode} by ${socket.id}`);
      callback({ success: true, roomCode, color: 'white', room });
    });

    socket.on('join-room', (roomCode, callback) => {
      const room = rooms.get(roomCode.toUpperCase());
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.length >= 2) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      const color = room.players[0].color === 'white' ? 'black' : 'white';
      room.players.push({ id: socket.id, color, ready: true });
      room.gameStatus = 'playing';

      socket.join(roomCode.toUpperCase());
      socket.roomCode = roomCode.toUpperCase();
      socket.playerColor = color;

      console.log(`Player ${socket.id} joined room ${roomCode} as ${color}`);

      io.to(roomCode.toUpperCase()).emit('player-joined', {
        players: room.players,
        gameStatus: room.gameStatus,
      });

      io.to(roomCode.toUpperCase()).emit('game-state', {
        board: room.board,
        currentTurn: room.currentTurn,
        gameStatus: room.gameStatus,
      });

      callback({ success: true, roomCode: roomCode.toUpperCase(), color, room });
    });

    socket.on('make-move', (moveData, callback) => {
      const roomCode = socket.roomCode;
      if (!roomCode) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const room = rooms.get(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.gameStatus === 'checkmate' || room.gameStatus === 'ended') {
        callback({ success: false, error: 'Game is over' });
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        callback({ success: false, error: 'Player not found' });
        return;
      }

      if (player.color !== room.currentTurn) {
        callback({ success: false, error: 'Not your turn' });
        return;
      }

      const { from, to } = moveData;
      const piece = room.board[from.row][from.col];
      
      if (!piece || piece.color !== player.color) {
        callback({ success: false, error: 'Invalid piece selection' });
        return;
      }

      const validMoves = getValidMoves(room.board, from);
      const isValidMove = validMoves.some(m => m.row === to.row && m.col === to.col);

      if (!isValidMove) {
        callback({ success: false, error: 'Invalid move' });
        return;
      }

      const newBoard = room.board.map(row => [...row.map(cell => cell ? { ...cell } : null)]);
      const movedPiece = { ...newBoard[from.row][from.col] };
      
      if (movedPiece.type === 'king' || movedPiece.type === 'rook') {
        movedPiece.hasMoved = true;
      }

      if (movedPiece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        if (to.col === 6) {
          const rook = newBoard[from.row][7];
          if (rook) {
            newBoard[from.row][5] = { ...rook, hasMoved: true };
            newBoard[from.row][7] = null;
          }
        } else if (to.col === 2) {
          const rook = newBoard[from.row][0];
          if (rook) {
            newBoard[from.row][3] = { ...rook, hasMoved: true };
            newBoard[from.row][0] = null;
          }
        }
      }

      newBoard[to.row][to.col] = movedPiece;
      newBoard[from.row][from.col] = null;

      const opponent = room.currentTurn === 'white' ? 'black' : 'white';
      const isCheck = isInCheck(newBoard, opponent);
      const isCheckmateResult = isCheck && isCheckmate(newBoard, opponent);

      room.board = newBoard;
      room.currentTurn = opponent;
      room.gameStatus = isCheckmateResult ? 'checkmate' : isCheck ? 'check' : 'playing';

      io.to(roomCode).emit('game-state', {
        board: room.board,
        currentTurn: room.currentTurn,
        gameStatus: room.gameStatus,
        lastMove: { from, to },
      });

      callback({ success: true, gameStatus: room.gameStatus });
    });

    socket.on('leave-room', () => {
      handleDisconnect(socket, io);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      handleDisconnect(socket, io);
    });
  });

  function handleDisconnect(socket, io) {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    
    if (room.players.length === 0) {
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
    } else {
      room.gameStatus = 'waiting';
      io.to(roomCode).emit('player-left', {
        players: room.players,
        gameStatus: room.gameStatus,
      });
    }
  }

  function isInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;

    const opponent = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === opponent) {
          const attacks = getValidMoves(board, { row: r, col: c }, false);
          if (attacks.some(a => a.row === kingPos.row && a.col === kingPos.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function isCheckmate(board, color) {
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

  function createInitialBoard() {
    return [
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
  }

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io + WebSocket server running`);

    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      const clientId = Math.random().toString(36).substring(2, 10);
      wsClients.set(clientId, { ws, roomCode: null });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          handleWebSocketMessage(clientId, msg, ws);
        } catch (e) {
          console.error('Invalid message:', e);
        }
      });

      ws.on('close', () => {
        const client = wsClients.get(clientId);
        if (client?.roomCode) {
          handleWebSocketLeave(clientId, client.roomCode, wss);
        }
        wsClients.delete(clientId);
        console.log('WebSocket client disconnected');
      });
    });
  });

  function handleWebSocketMessage(clientId, msg, ws) {
    const { type, roomCode, ...data } = msg;

    switch (type) {
      case 'create-room':
        let newCode;
        do { newCode = generateRoomCode(); } while (rooms.has(newCode));
        const initialBoard = createInitialBoard();
        const room = {
          code: newCode,
          players: [{ id: clientId, color: 'white', ready: true }],
          board: initialBoard,
          currentTurn: 'white',
          gameStatus: 'waiting',
          spectators: [],
        };
        rooms.set(newCode, room);
        const client = wsClients.get(clientId);
        if (client) client.roomCode = newCode;
        ws.send(JSON.stringify({ type: 'room-created', roomCode: newCode, playerId: clientId }));
        break;

      case 'join-room':
        const joinRoom = rooms.get(roomCode);
        if (!joinRoom) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          return;
        }
        if (joinRoom.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
          return;
        }
        joinRoom.players.push({ id: clientId, color: 'black', ready: true });
        joinRoom.gameStatus = 'playing';
        const jClient = wsClients.get(clientId);
        if (jClient) jClient.roomCode = roomCode;
        
        ws.send(JSON.stringify({ type: 'room-joined', roomCode, players: joinRoom.players, gameStatus: 'playing', board: joinRoom.board }));
        broadcastToRoom(roomCode, { type: 'game-started', board: joinRoom.board }, clientId);
        broadcastToRoom(roomCode, { type: 'player-joined', players: joinRoom.players, gameStatus: 'playing' }, clientId);
        break;

      case 'leave-room':
        handleWebSocketLeave(clientId, roomCode, wss);
        break;

      case 'make-move':
        handleWebSocketMove(clientId, roomCode, data, wss);
        break;
    }
  }

  function handleWebSocketLeave(clientId, roomCode, wss) {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== clientId);
    const client = wsClients.get(clientId);
    if (client) client.roomCode = null;

    if (room.players.length === 0) {
      rooms.delete(roomCode);
    } else {
      room.gameStatus = 'waiting';
      broadcastToRoom(roomCode, { type: 'player-left', players: room.players, gameStatus: 'waiting' });
    }
  }

  function handleWebSocketMove(clientId, roomCode, data, wss) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    const player = room.players.find(p => p.id === clientId);
    if (!player) return;

    const playerColor = player.color;
    if (playerColor !== room.currentTurn) return;

    const { from, to } = data;
    const piece = room.board[from.row]?.[from.col];
    if (!piece || piece.color !== playerColor) return;

    const validMoves = getValidMoves(room.board, from);
    const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);

    if (!isValid) {
      const client = wsClients.get(clientId);
      client?.ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
      return;
    }

    room.board[to.row][to.col] = piece;
    room.board[from.row][from.col] = null;
    room.currentTurn = room.currentTurn === 'white' ? 'black' : 'white';
    
    const opponent = room.currentTurn === 'white' ? 'black' : 'white';
    const isCheck = isInCheck(room.board, opponent);
    room.gameStatus = isCheck ? 'check' : 'playing';

    broadcastToRoom(roomCode, {
      type: 'game-state',
      board: room.board,
      currentTurn: room.currentTurn,
      gameStatus: room.gameStatus,
    });
  }

  function broadcastToRoom(roomCode, msg, excludeClient = null) {
    rooms.get(roomCode)?.players.forEach(p => {
      const client = wsClients.get(p.id);
      if (client && p.id !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(msg));
      }
    });
  }
});