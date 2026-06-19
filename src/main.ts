import './styles/main.css';
import { GameEngine } from './game/gameEngine';
import { createScreens } from './ui/screens';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found');
}

const engine = new GameEngine();
createScreens(app, engine);
