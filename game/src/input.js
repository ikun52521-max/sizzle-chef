// Sizzle Chef — mouse and keyboard input. Clicks land on pantry bins,
// stove burners, the serve and trash buttons, and the title/results
// buttons; keys mirror the same actions.

import { SCREENS, addToPlate, startCooking, takeFromStove, servePlate, clearPlate, newGame, ingredientById } from './state.js';
import { LAYOUT, pantryBinRect, stoveSlotRect } from './render.js';
import { INGREDIENTS } from './config.js';

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

// One click on the pantry: raw ingredients go to the plate, cookable
// ones go to a free burner.
export function clickPantry(state, index) {
  const def = INGREDIENTS[index];
  if (!def) return;
  if (def.kind === 'cook') {
    const slot = startCooking(state, def.id);
    if (slot === -1) {
      state.message = 'All burners are busy!';
      state.messageKind = 'info';
      state.messageTimer = 2;
    }
  } else {
    if (!addToPlate(state, def.id)) {
      state.message = 'That is already on the plate.';
      state.messageKind = 'info';
      state.messageTimer = 2;
    }
  }
}

export function handleClick(state, canvas, clientX, clientY) {
  const { x, y } = canvasPoint(canvas, clientX, clientY);

  if (state.screen === SCREENS.TITLE) {
    const btn = { x: 480, y: 620, w: 320, h: 72 };
    if (inside(x, y, btn)) return 'start';
    return null;
  }
  if (state.screen === SCREENS.RESULTS) {
    const btn = { x: 480, y: 590, w: 320, h: 60 };
    if (inside(x, y, btn)) return 'next-day';
    return null;
  }
  if (state.screen === SCREENS.PAUSED) {
    return 'resume';
  }
  if (state.screen !== SCREENS.PLAY) return null;

  // Pantry bins.
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (inside(x, y, pantryBinRect(i))) {
      clickPantry(state, i);
      return 'pantry';
    }
  }
  // Stove burners: take a finished item onto the plate.
  for (let i = 0; i < 3; i++) {
    if (inside(x, y, stoveSlotRect(i))) {
      takeFromStove(state, i);
      return 'stove';
    }
  }
  // Serve and trash.
  if (inside(x, y, LAYOUT.serveBtn)) {
    servePlate(state);
    return 'serve';
  }
  if (inside(x, y, LAYOUT.trashBtn)) {
    clearPlate(state);
    state.message = 'Plate cleared.';
    state.messageKind = 'info';
    state.messageTimer = 2;
    return 'trash';
  }
  return null;
}

// Keys: 1-0 pantry, Q/W/E take from burners, Space serve, T trash,
// P pause, Enter start / next day.
export function handleKey(state, key) {
  const k = key.toLowerCase();
  if (state.screen === SCREENS.TITLE) {
    if (key === 'Enter' || key === ' ') return 'start';
    return null;
  }
  if (state.screen === SCREENS.RESULTS) {
    if (key === 'Enter' || key === ' ') return 'next-day';
    return null;
  }
  if (k === 'p') {
    if (state.screen === SCREENS.PLAY) {
      state.screen = SCREENS.PAUSED;
      return 'pause';
    }
    if (state.screen === SCREENS.PAUSED) {
      state.screen = SCREENS.PLAY;
      return 'resume';
    }
    return null;
  }
  if (state.screen !== SCREENS.PLAY) return null;

  const pantryIndex = INGREDIENTS.findIndex((d) => d.key === k);
  if (pantryIndex !== -1) {
    clickPantry(state, pantryIndex);
    return 'pantry';
  }
  if (k === 'q' || k === 'w' || k === 'e') {
    const slot = { q: 0, w: 1, e: 2 }[k];
    takeFromStove(state, slot);
    return 'stove';
  }
  if (key === ' ') {
    servePlate(state);
    return 'serve';
  }
  if (k === 't') {
    clearPlate(state);
    state.message = 'Plate cleared.';
    state.messageKind = 'info';
    state.messageTimer = 2;
    return 'trash';
  }
  if (k === 'r') {
    return 'restart';
  }
  return null;
}

// Start a fresh shift for the given day, keeping the player's score
// across days only inside one run (results screen starts the next day).
export function startDay(day, seed) {
  return newGame(day, seed);
}

export { ingredientById };
