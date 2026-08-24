import { Piece, PieceType, PlayerColor, Position, Move } from './types';

export function getValidMoves(
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
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
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
    for (const [dr, dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) {
      addMove(pos.row + dr, pos.col + dc);
    }
  }

  if (type === 'king') {
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
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

export function findKing(board: (Piece | null)[][], color: PlayerColor): Position | null {
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

export function isCheckmate(board: (Piece | null)[][], color: PlayerColor): boolean {
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

export function isInCheck(board: (Piece | null)[][], color: PlayerColor): boolean {
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

// ─── AI Logic ────────────────────────────────────────────────────────────────

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000,
};

const PAWN_TABLE = [
  [0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],
  [5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],
  [5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0],
];
const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],
  [-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],
  [-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],
  [-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50],
];
const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],
  [-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],
  [-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],
  [-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20],
];
const ROOK_TABLE = [
  [0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],
  [-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],
  [-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0],
];
const QUEEN_TABLE = [
  [-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],
  [-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],
  [0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],
  [-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20],
];
const KING_MIDDLE_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],
  [20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20],
];

function getPieceTable(type: PieceType): number[][] | null {
  switch (type) {
    case 'pawn': return PAWN_TABLE;
    case 'knight': return KNIGHT_TABLE;
    case 'bishop': return BISHOP_TABLE;
    case 'rook': return ROOK_TABLE;
    case 'queen': return QUEEN_TABLE;
    case 'king': return KING_MIDDLE_TABLE;
    default: return null;
  }
}

function evaluateBoard(board: (Piece | null)[][], color: PlayerColor): number {
  let score = 0;
  const opponent = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const table = getPieceTable(piece.type);
      const material = PIECE_VALUES[piece.type];
      const positional = table ? table[piece.color === 'white' ? r : 7 - r][c] : 0;
      score += piece.color === color ? material + positional : -(material + positional);
    }
  }
  if (isInCheck(board, color)) score -= 50;
  if (isInCheck(board, opponent)) score += 50;
  return score;
}

function getAllMoves(board: (Piece | null)[][], color: PlayerColor): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        for (const to of getValidMoves(board, { row: r, col: c })) {
          moves.push({ from: { row: r, col: c }, to, piece, captured: board[to.row][to.col] || undefined });
        }
      }
    }
  }
  return moves;
}

function applyAIMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
  const newBoard = board.map((row) => [...row]);
  newBoard[move.to.row][move.to.col] = { ...newBoard[move.from.row][move.from.col]! };
  newBoard[move.from.row][move.from.col] = null;
  return newBoard;
}

function minimax(
  board: (Piece | null)[][], depth: number, alpha: number, beta: number,
  isMaximizing: boolean, aiColor: PlayerColor
): number {
  if (depth === 0) return evaluateBoard(board, aiColor);
  const currentColor = isMaximizing ? aiColor : (aiColor === 'white' ? 'black' : 'white');
  const moves = getAllMoves(board, currentColor);
  if (moves.length === 0) {
    return isInCheck(board, currentColor) ? (isMaximizing ? -99999 + (3 - depth) : 99999 - (3 - depth)) : 0;
  }
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      maxEval = Math.max(maxEval, minimax(applyAIMove(board, move), depth - 1, alpha, beta, false, aiColor));
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      minEval = Math.min(minEval, minimax(applyAIMove(board, move), depth - 1, alpha, beta, true, aiColor));
      beta = Math.min(beta, minEval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestAIMove(board: (Piece | null)[][], aiColor: PlayerColor): Move | null {
  const moves = getAllMoves(board, aiColor);
  if (moves.length === 0) return null;
  let bestMove: Move | null = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    const score = minimax(applyAIMove(board, move), 3, -Infinity, Infinity, false, aiColor);
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}
