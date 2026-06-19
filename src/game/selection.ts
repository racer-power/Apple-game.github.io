import { areAdjacent } from './board';
import type { Cell } from './types';
import { cellKey } from './types';
import { selectionSum } from './validator';

export class SelectionManager {
  private path: Cell[] = [];
  private active = false;

  start(cell: Cell): boolean {
    if (cell.value === null) {
      return false;
    }

    this.path = [cell];
    this.active = true;
    return true;
  }

  extend(cell: Cell | null): void {
    if (!this.active || !cell || cell.value === null) {
      return;
    }

    const last = this.path[this.path.length - 1];
    if (last.row === cell.row && last.col === cell.col) {
      return;
    }

    const selectedKeys = new Set(this.path.map(cellKey));
    if (selectedKeys.has(cellKey(cell))) {
      return;
    }

    if (!areAdjacent(last, cell)) {
      return;
    }

    this.path.push(cell);
  }

  clear(): void {
    this.path = [];
    this.active = false;
  }

  end(): Cell[] {
    const result = [...this.path];
    this.path = [];
    this.active = false;
    return result;
  }

  getPath(): Cell[] {
    return [...this.path];
  }

  getSum(): number {
    return selectionSum(this.path);
  }

  isActive(): boolean {
    return this.active;
  }
}
