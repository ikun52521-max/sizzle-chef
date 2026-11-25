// Sizzle Chef — game state and rules: orders, the stove, the plate,
// serving, scoring, combos, the shift timer and the day results.
// No drawing here; render.js owns the canvas.

import {
  SHIFT_SECONDS,
  PATIENCE_BASE,
  COOK_TIME,
  BURN_AFTER,
  SERVE_POINTS,
  SERVE_COINS,
  WALKOUT_PENALTY,
  WRONG_SERVE_PENALTY,
  COMBO_WINDOW,
  COMBO_MAX,
  DAY_UNLOCKS,
  INGREDIENTS,
  RECIPES,
  CUSTOMER_NAMES,
  CUSTOMER_COLORS,
  STAR_THRESHOLDS,
} from './config.js';
import { makeRng, pick, intBetween } from './random.js';

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  RESULTS: 'results',
};

export const STOVE_SLOTS = 3;

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

export function newGame(day, seed) {
  const rng = makeRng(seed);
  const unlock = DAY_UNLOCKS[Math.min(day - 1, DAY_UNLOCKS.length - 1)];
  return {
    screen: SCREENS.PLAY,
    day,
    seed,
    rng,
    unlock,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    walkouts: 0,
    wrongServes: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    orders: [],
    nextOrderIn: 2.5,
    nextOrderId: 1,
    plate: [], // ingredient ids currently on the plate, in order added
    stove: [null, null, null], // { id, startedAt, doneAt } per slot
    trash: 0,
    message: '',
    messageTimer: 0,
    messageKind: 'info',
    flashServe: 0,
    customersServedNames: [],
  };
}

export function newTitleState() {
  return {
    screen: SCREENS.TITLE,
    day: 1,
    seed: 20261125,
    rng: makeRng(20261125),
    unlock: DAY_UNLOCKS[0],
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    walkouts: 0,
    wrongServes: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    orders: [],
    nextOrderIn: 2.5,
    nextOrderId: 1,
    plate: [],
    stove: [null, null, null],
    trash: 0,
    message: '',
    messageTimer: 0,
    messageKind: 'info',
    flashServe: 0,
    customersServedNames: [],
  };
}

// --- Orders ---------------------------------------------------------------

export function spawnOrder(state) {
  const recipeId = pick(state.rng, state.unlock.recipes);
  const color = pick(state.rng, CUSTOMER_COLORS);
  const name = pick(state.rng, CUSTOMER_NAMES);
  const patience = PATIENCE_BASE * state.unlock.patience;
  const order = {
    id: state.nextOrderId++,
    recipeId,
    customer: name,
    color,
    patience,
    patienceLeft: patience,
    state: 'waiting', // waiting | served | angry
    servedAt: 0,
  };
  state.orders.push(order);
  return order;
}

export function ordersWaiting(state) {
  return state.orders.filter((o) => o.state === 'waiting');
}

// --- The plate ------------------------------------------------------------

export function plateMatchesOrder(state, order) {
  const recipe = RECIPES[order.recipeId];
  if (state.plate.length !== recipe.needs.length) return false;
  const sortedPlate = state.plate.slice().sort();
  const sortedNeeds = recipe.needs.slice().sort();
  return sortedPlate.every((id, i) => id === sortedNeeds[i]);
}

export function plateMatchesAnyOrder(state) {
  return ordersWaiting(state).find((o) => plateMatchesOrder(state, o)) || null;
}

export function plateHasExtra(state) {
  // True when the plate holds something no waiting order can use.
  const usable = new Set();
  for (const o of ordersWaiting(state)) {
    for (const id of RECIPES[o.recipeId].needs) usable.add(id);
  }
  return state.plate.some((id) => !usable.has(id));
}

// Add a raw ingredient straight to the plate. Cooked items must come
// from the stove instead (see takeFromStove).
export function addToPlate(state, ingredientId) {
  const def = ingredientById(ingredientId);
  if (!def) return false;
  if (def.kind === 'cook') return false; // must be cooked first
  if (state.plate.length >= 5) return false;
  if (state.plate.includes(ingredientId)) return false;
  state.plate.push(ingredientId);
  return true;
}

export function clearPlate(state) {
  state.trash += state.plate.length;
  state.plate = [];
}

// --- The stove ------------------------------------------------------------

export function stoveSlotState(slot, now) {
  if (!slot) return 'empty';
  if (now >= slot.doneAt + BURN_AFTER) return 'burnt';
  if (now >= slot.doneAt) return 'done';
  return 'cooking';
}

export function startCooking(state, ingredientId) {
  const def = ingredientById(ingredientId);
  if (!def || def.kind !== 'cook') return -1;
  const free = state.stove.findIndex((s) => s === null);
  if (free === -1) return -1;
  const now = state.elapsed;
  state.stove[free] = {
    id: ingredientId,
    startedAt: now,
    doneAt: now + COOK_TIME[ingredientId],
  };
  return free;
}

export function takeFromStove(state, slotIndex) {
  const slot = state.stove[slotIndex];
  if (!slot) return null;
  const status = stoveSlotState(slot, state.elapsed);
  if (status === 'burnt') {
    state.stove[slotIndex] = null;
    state.trash += 1;
    setMessage(state, 'Burnt! Tossed in the bin.', 'bad');
    return 'burnt';
  }
  if (status !== 'done') return null; // still cooking
  if (state.plate.length >= 5) return null;
  if (state.plate.includes(slot.id)) return null;
  state.plate.push(slot.id);
  state.stove[slotIndex] = null;
  return slot.id;
}

// --- Serving --------------------------------------------------------------

export function servePlate(state) {
  if (state.plate.length === 0) {
    setMessage(state, 'The plate is empty — add ingredients first.', 'info');
    return null;
  }
  const order = plateMatchesAnyOrder(state);
  if (!order) {
    state.wrongServes += 1;
    state.score = Math.max(0, state.score - WRONG_SERVE_PENALTY);
    state.combo = 0;
    state.comboTimer = 0;
    setMessage(state, 'No order matches this plate!', 'bad');
    return 'wrong';
  }
  const recipe = RECIPES[order.recipeId];
  const comboBefore = state.combo;
  state.combo = Math.min(state.combo + 1, COMBO_MAX);
  state.comboTimer = COMBO_WINDOW;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;
  const points = SERVE_POINTS * state.combo + recipe.price * 2;
  state.score += points;
  state.coins += SERVE_COINS + recipe.price;
  state.served += 1;
  state.customersServedNames.push(order.customer);
  order.state = 'served';
  order.servedAt = state.elapsed;
  state.plate = [];
  state.flashServe = 0.6;
  setMessage(
    state,
    `Served ${recipe.name} to ${order.customer}! +${points} pts`,
    'good',
  );
  return { order, points, combo: state.combo, comboBefore };
}

// --- Messages -------------------------------------------------------------

export function setMessage(state, text, kind) {
  state.message = text;
  state.messageKind = kind || 'info';
  state.messageTimer = 3;
}

// --- The clock ------------------------------------------------------------

export function update(state, dt) {
  if (state.screen !== SCREENS.PLAY) return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.flashServe > 0) state.flashServe -= dt;
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  // New orders arrive on a schedule while the shift runs.
  if (state.timeLeft > 0) {
    state.nextOrderIn -= dt;
    if (state.nextOrderIn <= 0 && ordersWaiting(state).length < 4) {
      spawnOrder(state);
      const gap = state.unlock.orderGap;
      state.nextOrderIn = intBetween(state.rng, gap[0], gap[1]);
    }
  }

  // Customers lose patience; an empty patience bar walks out.
  for (const order of state.orders) {
    if (order.state !== 'waiting') continue;
    order.patienceLeft -= dt;
    if (order.patienceLeft <= 0) {
      order.state = 'angry';
      state.walkouts += 1;
      state.score = Math.max(0, state.score - WALKOUT_PENALTY);
      state.combo = 0;
      state.comboTimer = 0;
      setMessage(state, `${order.customer} walked out hungry! -${WALKOUT_PENALTY} pts`, 'bad');
    }
  }
  // Keep only recent history so the ticket rail stays tidy.
  state.orders = state.orders.filter(
    (o) => o.state === 'waiting' || state.elapsed - (o.servedAt || 0) < 1.2,
  );

  if (state.timeLeft <= 0) {
    state.screen = SCREENS.RESULTS;
  }
}

export function starsEarned(state) {
  let stars = 0;
  for (const t of STAR_THRESHOLDS) if (state.served >= t) stars += 1;
  return stars;
}

export function daySummary(state) {
  return {
    day: state.day,
    score: state.score,
    coins: state.coins,
    served: state.served,
    walkouts: state.walkouts,
    wrongServes: state.wrongServes,
    bestCombo: state.bestCombo,
    stars: starsEarned(state),
  };
}
