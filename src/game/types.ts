export interface Cell {
  value: number | null;
  row: number;
  col: number;
}

export interface Board {
  cols: number;
  rows: number;
  cells: Cell[][];
}

export type GamePhase = 'idle' | 'playing' | 'ended';

export interface GameState {
  phase: GamePhase;
  board: Board;
  score: number;
  timeLeft: number;
  selection: Cell[];
  selectionSum: number;
  removingKeys: Set<string>;
}

export const BOARD_COLS = 17;
export const BOARD_ROWS = 10;
export const GAME_DURATION = 120;

export function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`;
}
