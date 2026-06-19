import type { GameEngine } from '../game/gameEngine';
import { createBoardView, renderHud } from './boardView';
import appleImg from '../assets/apple.svg';

export function createScreens(root: HTMLElement, engine: GameEngine): void {
  root.innerHTML = `
    <main class="app">
      <section class="screen screen-start" data-screen="start">
        <div class="panel">
          <h1>
            <img class="title-apple" src="${appleImg}" alt="" />
            사과게임
          </h1>
          <p class="description">
            인접한 사과를 드래그해서 숫자 합이 <strong>10</strong>이 되면 사라집니다.
            <br />120초 안에 최대한 많이 없애 보세요!
          </p>
          <ul class="rules">
            <li>마우스 드래그 또는 손가락 터치 드래그로 선택</li>
            <li>상하좌우로만 연결 가능 (대각선 불가)</li>
            <li>제거한 사과 개수 = 점수</li>
          </ul>
          <button type="button" class="btn btn-primary" data-action="start">게임 시작</button>
        </div>
      </section>

      <section class="screen screen-game hidden" data-screen="game">
        <header class="hud">
          <div class="hud-item">
            <span class="hud-label">점수</span>
            <span class="hud-value" id="score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">남은 시간</span>
            <span class="hud-value" id="timer">2:00</span>
          </div>
        </header>
        <div class="board-wrap" id="board-wrap"></div>
      </section>

      <section class="screen screen-end hidden" data-screen="end">
        <div class="panel">
          <h1>게임 종료!</h1>
          <p class="final-score-label">최종 점수</p>
          <p class="final-score" id="final-score">0</p>
          <div class="actions">
            <button type="button" class="btn btn-primary" data-action="retry">다시 하기</button>
            <button type="button" class="btn btn-secondary" data-action="home">처음으로</button>
          </div>
        </div>
      </section>
    </main>
  `;

  const startScreen = root.querySelector<HTMLElement>('[data-screen="start"]')!;
  const gameScreen = root.querySelector<HTMLElement>('[data-screen="game"]')!;
  const endScreen = root.querySelector<HTMLElement>('[data-screen="end"]')!;
  const boardWrap = root.querySelector<HTMLElement>('#board-wrap')!;
  const scoreEl = root.querySelector<HTMLElement>('#score')!;
  const timerEl = root.querySelector<HTMLElement>('#timer')!;
  const finalScoreEl = root.querySelector<HTMLElement>('#final-score')!;

  let destroyBoardView: (() => void) | null = null;

  const showScreen = (phase: 'idle' | 'playing' | 'ended') => {
    startScreen.classList.toggle('hidden', phase !== 'idle');
    gameScreen.classList.toggle('hidden', phase !== 'playing');
    endScreen.classList.toggle('hidden', phase !== 'ended');
  };

  root.querySelector('[data-action="start"]')?.addEventListener('click', () => {
    engine.start();
  });

  root.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
    engine.retry();
  });

  root.querySelector('[data-action="home"]')?.addEventListener('click', () => {
    engine.goHome();
  });

  engine.subscribe((state) => {
    showScreen(state.phase);
    renderHud(scoreEl, timerEl, state);
    finalScoreEl.textContent = String(state.score);

    if (state.phase === 'playing' && !destroyBoardView) {
      destroyBoardView = createBoardView(boardWrap, engine);
    }

    if (state.phase !== 'playing' && destroyBoardView) {
      destroyBoardView();
      destroyBoardView = null;
      boardWrap.innerHTML = '';
    }
  });
}
