export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PlayerColor = 'white' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  color: PlayerColor;
  hasMoved?: boolean;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isCastling?: boolean;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
}

export interface AnimatingMove {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isCastling?: boolean;
  rookFrom?: Position;
  rookTo?: Position;
  progress: number;
}

export const PIECE_ORDER: Record<PieceType, number> = {
  queen: 0, rook: 1, bishop: 2, knight: 3, pawn: 4, king: 5,
};

export const INITIAL_BOARD: (Piece | null)[][] = [
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
