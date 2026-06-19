import type { Cell, GameState } from '../game/types';
import { cellKey } from '../game/types';
import type { GameEngine } from '../game/gameEngine';
import appleImg from '../assets/apple.svg';

interface CellElements {
  root: HTMLElement;
  image: HTMLImageElement;
  number: HTMLSpanElement;
}

export function createBoardView(
  container: HTMLElement,
  engine: GameEngine,
): () => void {
  const boardEl = document.createElement('div');
  boardEl.className = 'board';
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', '사과 게임 보드');

  const sumBadge = document.createElement('div');
  sumBadge.className = 'selection-sum';
  sumBadge.hidden = true;

  container.appendChild(sumBadge);
  container.appendChild(boardEl);

  let dragging = false;

  const cellFromTarget = (target: EventTarget | null): Cell | null => {
    if (!(target instanceof Element)) {
      return null;
    }

    const cellEl = target.closest<HTMLElement>('.apple-cell');
    if (!cellEl) {
      return null;
    }

    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return null;
    }

    const state = engine.getState();
    return state.board.cells[row]?.[col] ?? null;
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (engine.getState().phase !== 'playing') {
      return;
    }

    const cell = cellFromTarget(event.target);
    if (!cell || cell.value === null) {
      return;
    }

    event.preventDefault();
    boardEl.setPointerCapture(event.pointerId);
    dragging = true;
    engine.beginSelection(cell);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragging) {
      return;
    }

    if (event.pointerType === 'mouse' && event.buttons === 0) {
      return;
    }

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cell = cellFromTarget(element);
    engine.extendSelection(cell);
  };

  const finishPointer = () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    engine.endSelection();
  };

  const handlePointerUp = () => {
    finishPointer();
  };

  const handlePointerCancel = () => {
    dragging = false;
    engine.cancelSelection();
  };

  boardEl.addEventListener('pointerdown', handlePointerDown, { passive: false });
  boardEl.addEventListener('pointermove', handlePointerMove);
  boardEl.addEventListener('pointerup', handlePointerUp);
  boardEl.addEventListener('pointercancel', handlePointerCancel);
  boardEl.addEventListener('contextmenu', (event) => event.preventDefault());

  let cellElements: CellElements[][] | null = null;

  const ensureGrid = (state: GameState) => {
    const { board } = state;
    boardEl.style.setProperty('--board-cols', String(board.cols));

    if (
      cellElements &&
      cellElements.length === board.rows &&
      cellElements[0]?.length === board.cols
    ) {
      return;
    }

    boardEl.innerHTML = '';
    cellElements = [];

    for (let row = 0; row < board.rows; row++) {
      const rowElements: CellElements[] = [];
      for (let col = 0; col < board.cols; col++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'apple-cell';
        cellEl.dataset.row = String(row);
        cellEl.dataset.col = String(col);
        cellEl.setAttribute('role', 'gridcell');

        const image = document.createElement('img');
        image.className = 'apple-image';
        image.src = appleImg;
        image.alt = '';
        image.draggable = false;

        const number = document.createElement('span');
        number.className = 'apple-number';

        cellEl.append(image, number);
        boardEl.appendChild(cellEl);
        rowElements.push({ root: cellEl, image, number });
      }
      cellElements.push(rowElements);
    }
  };

  const updateBoard = (state: GameState) => {
    ensureGrid(state);

    const { board, selection, removingKeys } = state;
    const selectedKeys = new Set(selection.map(cellKey));

    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const cell = board.cells[row][col];
        const key = cellKey(cell);
        const { root: cellEl, image, number } = cellElements![row][col];

        cellEl.classList.toggle('selected', selectedKeys.has(key));
        cellEl.classList.toggle('removing', removingKeys.has(key));

        if (cell.value === null) {
          number.textContent = '';
          image.hidden = true;
          cellEl.classList.add('empty');
          cellEl.setAttribute('aria-hidden', 'true');
          cellEl.removeAttribute('aria-label');
        } else {
          number.textContent = String(cell.value);
          image.hidden = false;
          cellEl.classList.remove('empty');
          cellEl.removeAttribute('aria-hidden');
          cellEl.setAttribute('aria-label', `사과 ${cell.value}`);
        }
      }
    }
  };

  const unsubscribe = engine.subscribe((state) => {
    updateBoard(state);
    renderSelectionSum(sumBadge, state);
  });

  return () => {
    unsubscribe();
    boardEl.removeEventListener('pointerdown', handlePointerDown);
    boardEl.removeEventListener('pointermove', handlePointerMove);
    boardEl.removeEventListener('pointerup', handlePointerUp);
    boardEl.removeEventListener('pointercancel', handlePointerCancel);
    sumBadge.remove();
    boardEl.remove();
  };
}

function renderSelectionSum(badge: HTMLElement, state: GameState): void {
  if (state.selection.length === 0) {
    badge.hidden = true;
    return;
  }

  badge.hidden = false;
  badge.textContent = `합: ${state.selectionSum}`;
  badge.classList.toggle('valid', state.selectionSum === 10);
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export function renderHud(
  scoreEl: HTMLElement,
  timerEl: HTMLElement,
  state: GameState,
): void {
  scoreEl.textContent = String(state.score);
  timerEl.textContent = formatTime(state.timeLeft);
  timerEl.classList.toggle('urgent', state.timeLeft <= 10 && state.phase === 'playing');
}
