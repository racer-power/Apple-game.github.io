import { createBoard, removeCells } from './board';
import { SelectionManager } from './selection';
import type { Cell, GameState } from './types';
import {
  BOARD_COLS,
  BOARD_ROWS,
  GAME_DURATION,
  cellKey,
} from './types';
import { isValidRemoval } from './validator';

type Listener = (state: GameState) => void;

export class GameEngine {
  private state: GameState;
  private timerId: number | null = null;
  private listeners = new Set<Listener>();
  private selectionManager = new SelectionManager();

  constructor() {
    this.state = this.createInitialState();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): GameState {
    return this.state;
  }

  start(): void {
    this.stopTimer();
    this.selectionManager.clear();
    this.state = {
      phase: 'playing',
      board: createBoard(BOARD_COLS, BOARD_ROWS),
      score: 0,
      timeLeft: GAME_DURATION,
      selection: [],
      selectionSum: 0,
      removingKeys: new Set(),
    };
    this.emit();
    this.timerId = window.setInterval(() => this.tick(), 1000);
  }

  retry(): void {
    this.start();
  }

  goHome(): void {
    this.stopTimer();
    this.selectionManager.clear();
    this.state = this.createInitialState();
    this.emit();
  }

  beginSelection(cell: Cell): boolean {
    if (this.state.phase !== 'playing') {
      return false;
    }

    const started = this.selectionManager.start(cell);
    if (started) {
      this.syncSelection();
    }
    return started;
  }

  extendSelection(cell: Cell | null): void {
    if (this.state.phase !== 'playing' || !this.selectionManager.isActive()) {
      return;
    }

    this.selectionManager.extend(cell);
    this.syncSelection();
  }

  endSelection(): void {
    if (this.state.phase !== 'playing') {
      return;
    }

    const selected = this.selectionManager.end();
    this.syncSelection();

    if (selected.length === 0) {
      return;
    }

    if (isValidRemoval(selected)) {
      void this.removeSelection(selected);
      return;
    }

    this.syncSelection();
  }

  cancelSelection(): void {
    this.selectionManager.clear();
    this.syncSelection();
  }

  private async removeSelection(cells: Cell[]): Promise<void> {
    const removingKeys = new Set(cells.map(cellKey));
    this.state = {
      ...this.state,
      removingKeys,
      selection: [],
      selectionSum: 0,
    };
    this.emit();

    await new Promise((resolve) => window.setTimeout(resolve, 220));

    removeCells(this.state.board, cells);
    this.state = {
      ...this.state,
      score: this.state.score + cells.length,
      removingKeys: new Set(),
    };
    this.emit();
  }

  private tick(): void {
    if (this.state.phase !== 'playing') {
      return;
    }

    const timeLeft = this.state.timeLeft - 1;
    if (timeLeft <= 0) {
      this.selectionManager.clear();
      this.state = {
        ...this.state,
        phase: 'ended',
        timeLeft: 0,
        selection: [],
        selectionSum: 0,
        removingKeys: new Set(),
      };
      this.stopTimer();
      this.emit();
      return;
    }

    this.state = { ...this.state, timeLeft };
    this.emit();
  }

  private syncSelection(): void {
    const selection = this.selectionManager.getPath();
    this.state = {
      ...this.state,
      selection,
      selectionSum: this.selectionManager.getSum(),
    };
    this.emit();
  }

  private createInitialState(): GameState {
    return {
      phase: 'idle',
      board: createBoard(BOARD_COLS, BOARD_ROWS),
      score: 0,
      timeLeft: GAME_DURATION,
      selection: [],
      selectionSum: 0,
      removingKeys: new Set(),
    };
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
