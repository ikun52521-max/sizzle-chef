// Sizzle Chef — configuration: ingredients, recipes, customers, tuning.
// Every value here is original to this game.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// How long a shift (one day) lasts, in seconds.
export const SHIFT_SECONDS = 180;

// A customer walks away after this many seconds without their dish.
export const PATIENCE_BASE = 75;

// Cooking times, in seconds, for items that need the stove.
export const COOK_TIME = {
  patty: 6,
  pasta: 8,
  batter: 5,
};

// An item left on the stove this long past done burns.
export const BURN_AFTER = 6;

// Points for serving a dish, before the combo multiplier.
export const SERVE_POINTS = 120;
// Coins paid per served dish.
export const SERVE_COINS = 18;
// Points lost when a customer storms out.
export const WALKOUT_PENALTY = 60;
// Points lost for serving the wrong dish.
export const WRONG_SERVE_PENALTY = 25;

// Combo: each consecutive correct serve within the window adds +1x, capped here.
export const COMBO_WINDOW = 12;
export const COMBO_MAX = 5;

// Days unlock more of the menu and speed the customers up.
export const DAY_UNLOCKS = [
  { day: 1, recipes: ['burger', 'salad'], orderGap: [9, 14], patience: 1.0 },
  { day: 2, recipes: ['burger', 'salad', 'pasta'], orderGap: [8, 12], patience: 0.92 },
  { day: 3, recipes: ['burger', 'salad', 'pasta', 'soup'], orderGap: [7, 11], patience: 0.85 },
  { day: 4, recipes: ['burger', 'salad', 'pasta', 'soup', 'pancakes'], orderGap: [6, 10], patience: 0.78 },
];

// An ingredient the player can grab from the counter.
export const INGREDIENTS = [
  { id: 'bun',      name: 'Bun',      color: '#e8b06a', dark: '#b97f3a', kind: 'raw',  key: '1', shape: 'bun' },
  { id: 'patty',    name: 'Patty',    color: '#8a4b2d', dark: '#5f3018', kind: 'cook', key: '2', shape: 'patty' },
  { id: 'lettuce',  name: 'Lettuce',  color: '#7dc383', dark: '#4d8f57', kind: 'raw',  key: '3', shape: 'leaf' },
  { id: 'tomato',   name: 'Tomato',   color: '#e05252', dark: '#a83232', kind: 'raw',  key: '4', shape: 'tomato' },
  { id: 'cheese',   name: 'Cheese',   color: '#f2c94c', dark: '#c99a1e', kind: 'raw',  key: '5', shape: 'cheese' },
  { id: 'pasta',    name: 'Pasta',    color: '#f0d48a', dark: '#c2a24e', kind: 'cook', key: '6', shape: 'pasta' },
  { id: 'mushroom', name: 'Mushroom', color: '#d9c7b2', dark: '#a68d76', kind: 'raw',  key: '7', shape: 'mushroom' },
  { id: 'batter',   name: 'Batter',   color: '#f5e6c4', dark: '#cbb27e', kind: 'cook', key: '8', shape: 'batter' },
  { id: 'berries',  name: 'Berries',  color: '#9b59b6', dark: '#6c3483', kind: 'raw',  key: '9', shape: 'berries' },
  { id: 'cream',    name: 'Cream',    color: '#fdf6e3', dark: '#d8c9a3', kind: 'raw',  key: '0', shape: 'cream' },
];

// A dish is a set of ingredient ids. Cooked ingredients count only once cooked.
export const RECIPES = {
  burger: {
    name: 'Sunny Burger',
    needs: ['bun', 'patty', 'lettuce', 'tomato'],
    price: 24,
    color: '#e8b06a',
    blurb: 'The house classic. Grill the patty, stack it high.',
  },
  salad: {
    name: 'Garden Salad',
    needs: ['lettuce', 'tomato', 'cheese'],
    price: 16,
    color: '#7dc383',
    blurb: 'Crisp, fresh, no stove required.',
  },
  pasta: {
    name: 'Tomato Pasta',
    needs: ['pasta', 'tomato', 'cheese'],
    price: 22,
    color: '#e05252',
    blurb: 'Boil the pasta, then dress it.',
  },
  soup: {
    name: 'Mushroom Soup',
    needs: ['mushroom', 'cream', 'cheese'],
    price: 20,
    color: '#d9c7b2',
    blurb: 'Slow comfort in a bowl.',
  },
  pancakes: {
    name: 'Berry Pancakes',
    needs: ['batter', 'berries', 'cream'],
    price: 26,
    color: '#9b59b6',
    blurb: 'Golden batter, sweet berries, a cloud of cream.',
  },
};

// The faces on the order tickets, drawn as simple round characters.
export const CUSTOMER_NAMES = [
  'Milo', 'Pip', 'June', 'Theo', 'Ada', 'Noor', 'Finn', 'Lena',
  'Otis', 'Wren', 'Hugo', 'Mabel', 'Ezra', 'Ivy', 'Cole', 'Rosa',
];

export const CUSTOMER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
  '#e67e22', '#fd79a8', '#6c5ce7', '#00b894', '#d63031', '#0984e3',
];

// Stars at the end of a day, by dishes served.
export const STAR_THRESHOLDS = [6, 10, 14];
