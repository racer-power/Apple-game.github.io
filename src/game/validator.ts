import type { Cell } from './types';

export function selectionSum(cells: Cell[]): number {
  return cells.reduce((sum, cell) => sum + (cell.value ?? 0), 0);
}

export function isValidRemoval(cells: Cell[]): boolean {
  if (cells.length === 0) {
    return false;
  }

  return selectionSum(cells) === 10;
}
