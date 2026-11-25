// Sizzle Chef — every pixel the player sees. Canvas 2D, drawn shapes
// only: no images, no network, no fonts beyond the system sans-serif.

import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, INGREDIENTS, RECIPES, STAR_THRESHOLDS } from './config.js';
import { SCREENS, STOVE_SLOTS, stoveSlotState, plateMatchesAnyOrder, ingredientById } from './state.js';

const INK = '#2b2118';
const CREAM = '#fff8ec';
const PANEL = '#fff3d6';
const PANEL_EDGE = '#e0c48f';
const HEADER_BG = '#3a2a1c';
const ACCENT = '#e2722e';
const GREEN = '#3e9e4d';
const RED = '#d23b2e';

// Layout rectangles, shared by the renderer and the input handler.
export const LAYOUT = {
  header: { x: 0, y: 0, w: CANVAS_W, h: 72 },
  orderBoard: { x: 16, y: 88, w: 284, h: 692 },
  stove: { x: 316, y: 96, w: 648, h: 168 },
  plate: { x: 316, y: 284, w: 648, h: 236 },
  serveBtn: { x: 396, y: 540, w: 220, h: 64 },
  trashBtn: { x: 664, y: 540, w: 220, h: 64 },
  pantry: { x: 980, y: 88, w: 284, h: 692 },
  hintBar: { x: 316, y: 640, w: 648, h: 140 },
};

export function pantryBinRect(index) {
  const cols = 2;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const bw = 128;
  const bh = 118;
  const gapX = 12;
  const gapY = 12;
  return {
    x: LAYOUT.pantry.x + 8 + col * (bw + gapX),
    y: LAYOUT.pantry.y + 44 + row * (bh + gapY),
    w: bw,
    h: bh,
  };
}

export function stoveSlotRect(index) {
  const sw = 180;
  const gap = 44;
  return {
    x: LAYOUT.stove.x + 24 + index * (sw + gap),
    y: LAYOUT.stove.y + 52,
    w: sw,
    h: 96,
  };
}

export function orderTicketRect(index) {
  return {
    x: LAYOUT.orderBoard.x + 12,
    y: LAYOUT.orderBoard.y + 48 + index * 158,
    w: LAYOUT.orderBoard.w - 24,
    h: 146,
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, rect, fill, edge) {
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = edge;
  ctx.stroke();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.font = `${weight || 700} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- Ingredient icons -----------------------------------------------------

export function drawIngredientIcon(ctx, shape, cx, cy, size, color, dark) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(2, size * 0.06);
  const s = size;
  if (shape === 'bun') {
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-s * 0.42, s * 0.08, s * 0.84, s * 0.14);
    ctx.fillStyle = '#f7e3b0';
    ctx.beginPath();
    ctx.arc(-s * 0.16, -s * 0.16, s * 0.05, 0, Math.PI * 2);
    ctx.arc(s * 0.14, -s * 0.2, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'patty') {
    roundRect(ctx, -s * 0.46, -s * 0.16, s * 0.92, s * 0.34, s * 0.14);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(s * 0.3, 0);
    ctx.stroke();
  } else if (shape === 'leaf') {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.44, s * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.3, s * 0.14);
    ctx.quadraticCurveTo(s * 0.5, s * 0.3, s * 0.56, s * 0.42);
    ctx.stroke();
  } else if (shape === 'tomato') {
    ctx.beginPath();
    ctx.arc(0, s * 0.06, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3e9e4d';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(-s * 0.12, -s * 0.44);
    ctx.lineTo(s * 0.02, -s * 0.34);
    ctx.lineTo(s * 0.14, -s * 0.44);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'cheese') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.44, s * 0.3);
    ctx.lineTo(s * 0.44, s * 0.3);
    ctx.lineTo(s * 0.44, -s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(-s * 0.1, s * 0.08, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.2, s * 0.16, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'pasta') {
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, i * s * 0.26);
      ctx.bezierCurveTo(-s * 0.15, i * s * 0.26 - s * 0.2, s * 0.15, i * s * 0.26 + s * 0.2, s * 0.4, i * s * 0.26);
      ctx.stroke();
    }
  } else if (shape === 'mushroom') {
    ctx.beginPath();
    ctx.arc(0, -s * 0.08, s * 0.42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(-s * 0.12, -s * 0.08, s * 0.24, s * 0.42);
    ctx.strokeRect(-s * 0.12, -s * 0.08, s * 0.24, s * 0.42);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-s * 0.16, -s * 0.22, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.12, -s * 0.3, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'batter') {
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.46, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.36, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8b06a';
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'berries') {
    const spots = [[-0.2, -0.12], [0.18, -0.18], [0, 0.14], [-0.28, 0.18], [0.26, 0.16]];
    for (const [dx, dy] of spots) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-s * 0.24, -s * 0.18, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // cream: a soft swirl
    ctx.beginPath();
    ctx.ellipse(0, s * 0.12, s * 0.44, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, s * 0.08);
    ctx.quadraticCurveTo(0, -s * 0.42, s * 0.16, -s * 0.34);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.12, -s * 0.05, s * 0.08);
    ctx.fill();
  }
  ctx.restore();
}

// --- Customer faces -------------------------------------------------------

function drawCustomerFace(ctx, cx, cy, r, color, mood) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.stroke();
  ctx.fillStyle = '#2b2118';
  const eyeY = cy - r * 0.15;
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, eyeY, r * 0.1, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.35, eyeY, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (mood === 'angry') {
    ctx.moveTo(cx - r * 0.4, cy + r * 0.5);
    ctx.lineTo(cx + r * 0.4, cy + r * 0.3);
  } else if (mood === 'happy') {
    ctx.arc(cx, cy + r * 0.1, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(cx, cy + r * 0.35, r * 0.3, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

// --- Header ---------------------------------------------------------------

function drawHeader(ctx, state) {
  const h = LAYOUT.header;
  ctx.fillStyle = HEADER_BG;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(h.x, h.y + h.h - 5, h.w, 5);

  // Logo: a little flame + the name.
  ctx.save();
  ctx.translate(34, 36);
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(14, -2, 10, 8);
  ctx.quadraticCurveTo(6, 16, 0, 16);
  ctx.quadraticCurveTo(-6, 16, -10, 8);
  ctx.quadraticCurveTo(-14, -2, 0, -16);
  ctx.fill();
  ctx.restore();
  text(ctx, 'SIZZLE CHEF', 58, 30, 30, '#fff8ec', 800);
  text(ctx, `DAY ${state.day}`, 58, 56, 14, '#ffb347', 700);

  // Score and coins.
  text(ctx, 'SCORE', 330, 24, 13, '#c9a886', 700);
  text(ctx, String(state.score), 330, 50, 26, '#ffffff', 800);
  text(ctx, 'COINS', 470, 24, 13, '#c9a886', 700);
  text(ctx, `◉ ${state.coins}`, 470, 50, 26, '#f2c94c', 800);

  // Combo badge.
  if (state.combo > 1) {
    const cw = 150;
    roundRect(ctx, 640, 16, cw, 40, 20);
    ctx.fillStyle = '#e2722e';
    ctx.fill();
    text(ctx, `COMBO x${state.combo}`, 640 + cw / 2, 37, 18, '#ffffff', 800, 'center');
  } else {
    text(ctx, 'Serve dishes in a row', 640, 30, 14, '#a98f6f', 600);
    text(ctx, 'to build a combo', 640, 50, 14, '#a98f6f', 600);
  }

  // Shift timer.
  const timeColor = state.timeLeft <= 30 ? '#ff6b5e' : '#fff8ec';
  text(ctx, 'SHIFT', 1060, 24, 13, '#c9a886', 700);
  text(ctx, formatTime(state.timeLeft), 1060, 50, 26, timeColor, 800);
  const barW = 150;
  const frac = state.timeLeft / SHIFT_SECONDS;
  roundRect(ctx, 1150, 26, barW, 18, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  roundRect(ctx, 1150, 26, Math.max(18, barW * frac), 18, 9);
  ctx.fillStyle = state.timeLeft <= 30 ? '#ff6b5e' : '#3e9e4d';
  ctx.fill();
}

// --- Order board ----------------------------------------------------------

function drawOrderBoard(ctx, state) {
  const b = LAYOUT.orderBoard;
  panel(ctx, b, PANEL, PANEL_EDGE);
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 26, 20, INK, 800);
  text(ctx, `${state.served} served`, b.x + b.w - 16, b.y + 26, 14, '#8a6f4d', 700, 'right');

  const waiting = state.orders.filter((o) => o.state === 'waiting');
  if (waiting.length === 0) {
    text(ctx, 'No orders yet —', b.x + b.w / 2, b.y + 120, 16, '#8a6f4d', 600, 'center');
    text(ctx, 'customers are on', b.x + b.w / 2, b.y + 146, 16, '#8a6f4d', 600, 'center');
    text(ctx, 'their way in!', b.x + b.w / 2, b.y + 172, 16, '#8a6f4d', 600, 'center');
  }
  waiting.slice(0, 4).forEach((order, i) => drawTicket(ctx, order, orderTicketRect(i)));

  // Walkout tally at the bottom of the board.
  if (state.walkouts > 0) {
    text(ctx, `Walkouts: ${state.walkouts}`, b.x + 16, b.y + b.h - 22, 14, RED, 700);
  }
}

function drawTicket(ctx, order, rect) {
  const recipe = RECIPES[order.recipeId];
  const frac = Math.max(0, order.patienceLeft / order.patience);
  const urgent = frac < 0.35;
  panel(ctx, rect, urgent ? '#ffe3de' : '#ffffff', urgent ? '#d23b2e' : '#d8c49a');
  drawCustomerFace(ctx, rect.x + 34, rect.y + 36, 22, order.color, urgent ? 'angry' : 'waiting');
  text(ctx, order.customer, rect.x + 66, rect.y + 28, 17, INK, 800);
  text(ctx, recipe.name, rect.x + 66, rect.y + 54, 19, recipe.color === '#d9c7b2' ? '#8a6f4d' : recipe.color, 800);
  text(ctx, `$${recipe.price}`, rect.x + rect.w - 14, rect.y + 28, 16, '#8a6f4d', 800, 'right');

  // The dish's ingredients as small icons in a row.
  recipe.needs.forEach((id, i) => {
    const def = ingredientById(id);
    const cx = rect.x + 40 + i * 52;
    const cy = rect.y + 92;
    drawIngredientIcon(ctx, def.shape, cx, cy, 38, def.color, def.dark);
    text(ctx, def.name, cx, cy + 28, 11, '#6b543a', 600, 'center');
  });

  // Patience bar.
  const barX = rect.x + 14;
  const barY = rect.y + rect.h - 14;
  const barW = rect.w - 28;
  roundRect(ctx, barX, barY, barW, 8, 4);
  ctx.fillStyle = '#e8dcc2';
  ctx.fill();
  roundRect(ctx, barX, barY, Math.max(8, barW * frac), 8, 4);
  ctx.fillStyle = urgent ? RED : '#3e9e4d';
  ctx.fill();
}

// --- Stove ----------------------------------------------------------------

function drawStove(ctx, state) {
  const s = LAYOUT.stove;
  panel(ctx, s, '#4a4a52', '#33333a');
  text(ctx, 'STOVE — click a burner to take a finished item', s.x + 16, s.y + 26, 15, '#e8e2d5', 700);
  for (let i = 0; i < STOVE_SLOTS; i++) {
    const rect = stoveSlotRect(i);
    const slot = state.stove[i];
    const status = stoveSlotState(slot, state.elapsed);
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fillStyle = status === 'burnt' ? '#3a1512' : '#2c2c33';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = status === 'done' ? '#7dc383' : '#55555e';
    ctx.stroke();
    if (!slot) {
      text(ctx, 'empty burner', rect.x + rect.w / 2, rect.y + 40, 14, '#8a8a94', 600, 'center');
      text(ctx, 'cook from the pantry', rect.x + rect.w / 2, rect.y + 64, 12, '#6a6a74', 600, 'center');
    } else {
      const def = ingredientById(slot.id);
      const frac = Math.min(1, (state.elapsed - slot.startedAt) / (slot.doneAt - slot.startedAt));
      // Flame glow while cooking.
      if (status === 'cooking') {
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(state.elapsed * 8 + i);
        ctx.fillStyle = '#ff8c42';
        ctx.beginPath();
        ctx.ellipse(rect.x + rect.w / 2, rect.y + 58, 56, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      drawIngredientIcon(ctx, def.shape, rect.x + rect.w / 2, rect.y + 34, 50, def.color, def.dark);
      text(ctx, def.name, rect.x + rect.w / 2, rect.y + 68, 13, '#e8e2d5', 700, 'center');
      // Progress ring / bar.
      const barW = rect.w - 32;
      roundRect(ctx, rect.x + 16, rect.y + rect.h - 14, barW, 8, 4);
      ctx.fillStyle = '#55555e';
      ctx.fill();
      roundRect(ctx, rect.x + 16, rect.y + rect.h - 14, Math.max(8, barW * frac), 8, 4);
      ctx.fillStyle = status === 'burnt' ? RED : status === 'done' ? '#7dc383' : '#ffb347';
      ctx.fill();
      if (status === 'done') {
        text(ctx, 'READY!', rect.x + rect.w / 2, rect.y + 18, 13, '#7dc383', 800, 'center');
      } else if (status === 'burnt') {
        text(ctx, 'BURNT!', rect.x + rect.w / 2, rect.y + 18, 13, '#ff6b5e', 800, 'center');
      }
    }
  }
}

// --- Plate and serving ----------------------------------------------------

function drawPlateArea(ctx, state) {
  const p = LAYOUT.plate;
  panel(ctx, p, PANEL, PANEL_EDGE);
  text(ctx, 'YOUR PLATE — build the dish here', p.x + 16, p.y + 26, 15, '#8a6f4d', 700);
  const match = plateMatchesAnyOrder(state);
  const ready = !!match;

  // The plate itself: a big white ellipse.
  const cx = p.x + 180;
  const cy = p.y + 128;
  ctx.save();
  if (ready) {
    ctx.shadowColor = '#7dc383';
    ctx.shadowBlur = 24 + 8 * Math.sin(state.elapsed * 5);
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 78, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ready ? '#3e9e4d' : '#d8c49a';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 112, 54, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#e8dcc2';
  ctx.stroke();
  ctx.restore();

  if (state.plate.length === 0) {
    text(ctx, 'Empty plate', cx, cy, 16, '#b3a284', 600, 'center');
  } else {
    state.plate.forEach((id, i) => {
      const def = ingredientById(id);
      const angle = -Math.PI / 2 + (i - (state.plate.length - 1) / 2) * 0.55;
      const ix = cx + Math.cos(angle) * 62;
      const iy = cy + Math.sin(angle) * 34;
      drawIngredientIcon(ctx, def.shape, ix, iy, 52, def.color, def.dark);
    });
  }

  // Recipe checklist on the right of the plate.
  const waiting = state.orders.filter((o) => o.state === 'waiting');
  const rx = p.x + 380;
  text(ctx, 'WHAT THEY WANT', rx, p.y + 30, 13, '#8a6f4d', 800);
  if (waiting.length === 0) {
    text(ctx, 'No open orders.', rx, p.y + 62, 15, '#6b543a', 600);
  } else {
    waiting.slice(0, 3).forEach((order, i) => {
      const recipe = RECIPES[order.recipeId];
      const y = p.y + 62 + i * 52;
      const done = recipe.needs.filter((id) => state.plate.includes(id)).length;
      text(ctx, `${order.customer} — ${recipe.name}`, rx, y, 15, INK, 700);
      if (done === recipe.needs.length) {
        text(ctx, `✓ ${done}/${recipe.needs.length} on the plate — ready to serve`, rx, y + 20, 13, GREEN, 800);
      } else {
        text(ctx, `${done}/${recipe.needs.length} on the plate`, rx, y + 20, 13, '#8a6f4d', 600);
      }
    });
  }

  // Serve + trash buttons.
  drawButton(ctx, LAYOUT.serveBtn, ready ? '#3e9e4d' : '#9a8a72', ready ? 'SERVE  (Space)' : 'SERVE  (Space)', ready);
  drawButton(ctx, LAYOUT.trashBtn, '#8a6f4d', 'TRASH PLATE  (T)', false);

  // Message line.
  if (state.messageTimer > 0 && state.message) {
    const color = state.messageKind === 'good' ? GREEN : state.messageKind === 'bad' ? RED : '#6b543a';
    text(ctx, state.message, p.x + p.w / 2, p.y + p.h - 14, 16, color, 700, 'center');
  }
}

function drawButton(ctx, rect, color, label, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 18, '#ffffff', 800, 'center');
}

// --- Pantry ---------------------------------------------------------------

function drawPantry(ctx, state) {
  const b = LAYOUT.pantry;
  panel(ctx, b, PANEL, PANEL_EDGE);
  text(ctx, 'PANTRY — click to add', b.x + 16, b.y + 26, 17, INK, 800);
  INGREDIENTS.forEach((def, i) => {
    const rect = pantryBinRect(i);
    const onPlate = state.plate.includes(def.id);
    const cooking = state.stove.some((s) => s && s.id === def.id);
    panel(ctx, rect, onPlate ? '#e6f4e6' : '#ffffff', onPlate ? GREEN : '#d8c49a');
    drawIngredientIcon(ctx, def.shape, rect.x + rect.w / 2, rect.y + 42, 56, def.color, def.dark);
    text(ctx, def.name, rect.x + rect.w / 2, rect.y + 84, 14, INK, 700, 'center');
    text(ctx, def.kind === 'cook' ? 'needs stove' : 'ready to plate', rect.x + rect.w / 2, rect.y + 102, 11, '#8a6f4d', 600, 'center');
    text(ctx, `[${def.key}]`, rect.x + rect.w - 8, rect.y + 14, 11, '#b3a284', 700, 'right');
    if (cooking) {
      text(ctx, 'on stove', rect.x + 8, rect.y + 14, 11, '#e2722e', 800);
    }
  });
}

// --- Hint bar -------------------------------------------------------------

function drawHintBar(ctx) {
  const b = LAYOUT.hintBar;
  panel(ctx, b, '#f7ecd2', PANEL_EDGE);
  text(ctx, 'HOW TO PLAY', b.x + 16, b.y + 26, 15, INK, 800);
  const lines = [
    '1. Read the order tickets on the left.',
    '2. Click pantry ingredients — cookable ones (patty, pasta, batter) go to the stove first.',
    '3. Click a finished burner to move it to your plate.',
    '4. When the plate matches a ticket, hit SERVE before patience runs out.',
    'Keys: 1–0 pantry · Q W E take from burners · Space serve · T trash · P pause',
  ];
  lines.forEach((line, i) => text(ctx, line, b.x + 16, b.y + 50 + i * 18, 14, '#6b543a', 600));
}

// --- Title ----------------------------------------------------------------

function drawTitle(ctx, state) {
  // Warm kitchen backdrop.
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? '#43301f' : '#3a2a1c';
    ctx.fillRect(0, i * 70, CANVAS_W, 34);
  }
  // Big sign.
  roundRect(ctx, 240, 120, 800, 240, 24);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = ACCENT;
  ctx.stroke();
  text(ctx, 'SIZZLE CHEF', CANVAS_W / 2, 210, 84, INK, 800, 'center');
  text(ctx, 'a fast little cooking game', CANVAS_W / 2, 268, 24, '#8a6f4d', 600, 'center');
  text(ctx, 'Take orders · Cook · Plate · Serve — before the shift ends', CANVAS_W / 2, 312, 19, '#6b543a', 700, 'center');

  // Sample dish parade.
  const parade = ['burger', 'salad', 'pasta', 'soup', 'pancakes'];
  parade.forEach((id, i) => {
    const recipe = RECIPES[id];
    const cx = 240 + i * 200;
    const cy = 470;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40, 86, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    recipe.needs.slice(0, 3).forEach((ing, j) => {
      const def = ingredientById(ing);
      drawIngredientIcon(ctx, def.shape, cx + (j - 1) * 44, cy + 10 - j * 6, 46, def.color, def.dark);
    });
    text(ctx, recipe.name, cx, cy + 84, 16, '#fff8ec', 700, 'center');
    text(ctx, `$${recipe.price}`, cx, cy + 108, 14, '#f2c94c', 700, 'center');
  });

  // Start button.
  const btn = { x: CANVAS_W / 2 - 160, y: 620, w: 320, h: 72 };
  drawButton(ctx, btn, ACCENT, 'START YOUR SHIFT', true);
  text(ctx, 'or press Enter · 3-minute shifts · 5 dishes to master', CANVAS_W / 2, 724, 15, '#c9a886', 600, 'center');
}

// --- Results --------------------------------------------------------------

function drawResults(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.92)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  roundRect(ctx, 340, 110, 600, 570, 24);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = ACCENT;
  ctx.stroke();
  text(ctx, `DAY ${state.day} DONE!`, CANVAS_W / 2, 168, 40, INK, 800, 'center');
  const stars = (() => {
    let n = 0;
    for (const t of STAR_THRESHOLDS) if (state.served >= t) n += 1;
    return n;
  })();
  for (let i = 0; i < 3; i++) {
    const cx = CANVAS_W / 2 + (i - 1) * 90;
    ctx.save();
    ctx.translate(cx, 232);
    ctx.fillStyle = i < stars ? '#f2c94c' : '#d8c9a3';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
      const r = k % 2 === 0 ? 34 : 15;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const rows = [
    ['Score', String(state.score)],
    ['Dishes served', String(state.served)],
    ['Coins earned', `◉ ${state.coins}`],
    ['Best combo', `x${state.bestCombo}`],
    ['Walkouts', String(state.walkouts)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 310 + i * 44;
    text(ctx, label, 420, y, 20, '#6b543a', 700);
    text(ctx, value, 860, y, 22, INK, 800, 'right');
  });
  text(ctx, `Next: Day ${state.day + 1} — more dishes, faster customers`, CANVAS_W / 2, 560, 17, '#8a6f4d', 700, 'center');
  const btn = { x: CANVAS_W / 2 - 160, y: 590, w: 320, h: 60 };
  drawButton(ctx, btn, ACCENT, state.day >= 4 ? 'PLAY AGAIN' : 'NEXT DAY', true);
  text(ctx, 'or press Enter', CANVAS_W / 2, 668, 14, '#8a6f4d', 600, 'center');
}

// --- Paused ---------------------------------------------------------------

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,33,24,0.75)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 20, 56, '#fff8ec', 800, 'center');
  text(ctx, 'Press P or click anywhere to keep cooking', CANVAS_W / 2, CANVAS_H / 2 + 40, 18, '#e8dcc2', 600, 'center');
}

// --- Kitchen backdrop -----------------------------------------------------

function drawKitchenBackdrop(ctx) {
  // Tiled wall.
  ctx.fillStyle = '#f3e2c2';
  ctx.fillRect(0, 72, CANVAS_W, CANVAS_H - 72);
  ctx.strokeStyle = '#e0cba0';
  ctx.lineWidth = 1;
  for (let y = 72; y < CANVAS_H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 72);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  // Wooden counter strip behind the stove and plate.
  ctx.fillStyle = '#a4713e';
  ctx.fillRect(300, 84, 664, 540);
  ctx.fillStyle = '#8f5f31';
  ctx.fillRect(300, 84, 664, 10);
}

// --- Root -----------------------------------------------------------------

export function render(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.screen === SCREENS.TITLE) {
    drawTitle(ctx, state);
    return;
  }
  drawKitchenBackdrop(ctx);
  drawHeader(ctx, state);
  drawOrderBoard(ctx, state);
  drawStove(ctx, state);
  drawPlateArea(ctx, state);
  drawPantry(ctx, state);
  drawHintBar(ctx);
  if (state.screen === SCREENS.RESULTS) {
    drawResults(ctx, state);
  } else if (state.screen === SCREENS.PAUSED) {
    drawPaused(ctx);
  }
}
