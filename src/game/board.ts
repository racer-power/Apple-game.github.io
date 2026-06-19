import type { Board, Cell } from './types';

export function createBoard(cols: number, rows: number): Board {
  const cells: Cell[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      rowCells.push({
        value: Math.floor(Math.random() * 9) + 1,
        row,
        col,
      });
    }
    cells.push(rowCells);
  }

  return { cols, rows, cells };
}

export function getCell(board: Board, row: number, col: number): Cell | null {
  if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) {
    return null;
  }
  return board.cells[row][col];
}

export function areAdjacent(a: Cell, b: Cell): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function getNeighbors(board: Board, cell: Cell): Cell[] {
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const neighbors: Cell[] = [];

  for (const [rowOffset, colOffset] of directions) {
    const neighbor = getCell(board, cell.row + rowOffset, cell.col + colOffset);
    if (neighbor && neighbor.value !== null) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

export function removeCells(board: Board, cells: Cell[]): void {
  for (const cell of cells) {
    const target = getCell(board, cell.row, cell.col);
    if (target) {
      target.value = null;
    }
  }
}
