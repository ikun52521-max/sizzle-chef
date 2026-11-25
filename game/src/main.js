// Sizzle Chef — boot and main loop. Wires the canvas, the state, the
// input and the renderer together, and honours ?shot=1..4 for the
// staged screenshot states (see shots.js).

import { CANVAS_W, CANVAS_H } from './config.js';
import { SCREENS, newGame, newTitleState, update } from './state.js';
import { render } from './render.js';
import { handleClick, handleKey, startDay } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const shotParam = parseInt(params.get('shot') || '', 10);
const staged = Number.isInteger(shotParam) ? stageShot(shotParam) : null;

let state = staged || newTitleState();
let day = 1;

// Freeze the clock for staged shots so the screenshot is stable.
const frozen = !!staged;

function startShift(nextDay) {
  day = nextDay;
  state = newGame(day, 20261125 + day * 131);
  // A couple of customers are already waiting when the shift starts.
  state.nextOrderIn = 1.5;
}

canvas.addEventListener('click', (event) => {
  const action = handleClick(state, canvas, event.clientX, event.clientY);
  if (action === 'start') startShift(1);
  else if (action === 'next-day') startShift(day >= 4 ? 1 : day + 1);
  else if (action === 'resume') state.screen = SCREENS.PLAY;
});

window.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault();
  const action = handleKey(state, event.key);
  if (action === 'start') startShift(1);
  else if (action === 'next-day') startShift(day >= 4 ? 1 : day + 1);
  else if (action === 'restart') startShift(day);
  else if (action === 'pause') state.screen = SCREENS.PAUSED;
  else if (action === 'resume') state.screen = SCREENS.PLAY;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) update(state, dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose the live state for play-testing from the console.
window.__sizzle = {
  get state() {
    return state;
  },
  startShift,
};
