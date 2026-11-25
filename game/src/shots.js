// Sizzle Chef — staged states for the screenshots. Each shot is a real
// render of the game's own code: the same state the game builds while
// playing, frozen at a chosen moment with a fixed seed so the shot is
// reproducible. ?shot=1..4 in the page URL picks one; no parameter
// means the normal title screen.

import { SCREENS, newGame, newTitleState, spawnOrder, startCooking, setMessage } from './state.js';
import { RECIPES } from './config.js';

// Shot 1: a busy mid-game kitchen — orders on the board, ingredients
// on the counter, a burger mid-assembly, a patty on the stove, timer running.
export function stageShot1() {
  const state = newGame(1, 7);
  state.elapsed = 42;
  state.timeLeft = 180 - 42;
  state.score = 340;
  state.coins = 52;
  state.combo = 2;
  state.comboTimer = 8;
  state.plate = ['bun', 'lettuce'];
  spawnOrder(state);
  spawnOrder(state);
  state.orders[0].recipeId = 'burger';
  state.orders[0].customer = 'Milo';
  state.orders[0].patienceLeft = 48;
  state.orders[1].recipeId = 'salad';
  state.orders[1].customer = 'June';
  state.orders[1].patienceLeft = 62;
  startCooking(state, 'patty');
  state.stove[0].startedAt = 42 - 4;
  state.stove[0].doneAt = 42 + 2;
  setMessage(state, 'Patty almost ready — grab it when it dings!', 'info');
  state.messageTimer = 99;
  return state;
}

// Shot 2: a plate ready to serve — the burger is complete, the serve
// button glows, the matching ticket is on top.
export function stageShot2() {
  const state = newGame(2, 21);
  state.elapsed = 96;
  state.timeLeft = 180 - 96;
  state.score = 890;
  state.coins = 131;
  state.combo = 3;
  state.comboTimer = 10;
  state.served = 7;
  state.plate = ['bun', 'patty', 'lettuce', 'tomato'];
  spawnOrder(state);
  state.orders[0].recipeId = 'burger';
  state.orders[0].customer = 'Theo';
  state.orders[0].patienceLeft = 30;
  spawnOrder(state);
  state.orders[1].recipeId = 'pasta';
  state.orders[1].customer = 'Ada';
  state.orders[1].patienceLeft = 55;
  startCooking(state, 'pasta');
  state.stove[0].startedAt = 96 - 3;
  state.stove[0].doneAt = 96 + 5;
  setMessage(state, 'Burger complete — serve it now!', 'good');
  state.messageTimer = 99;
  return state;
}

// Shot 3: the title screen.
export function stageShot3() {
  return newTitleState();
}

// Shot 4: the end-of-day results with stars.
export function stageShot4() {
  const state = newGame(1, 99);
  state.elapsed = 180;
  state.timeLeft = 0;
  state.screen = SCREENS.RESULTS;
  state.score = 1420;
  state.coins = 214;
  state.served = 11;
  state.walkouts = 1;
  state.bestCombo = 4;
  state.combo = 0;
  return state;
}

export function stageShot(n) {
  if (n === 1) return stageShot1();
  if (n === 2) return stageShot2();
  if (n === 3) return stageShot3();
  if (n === 4) return stageShot4();
  return null;
}

// The recipe names, for the dossier's outline and the help text.
export function recipeList() {
  return Object.entries(RECIPES).map(([id, r]) => `${r.name} (${id})`);
}
