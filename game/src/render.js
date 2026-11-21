// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred. Each scene is baked once per level
// into two offscreen panels (left: base, right: differences applied); every frame only
// draws those images plus the live markers, HUD and screens on top.
import { FIELD, FONT, LAYOUT, PALETTE, PANEL, TIMER } from './config.js';
import { SCENES } from './scenes.js';
import {
  SCREEN_LEVEL_CLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './world.js';

const PANEL_RECTS = [
  { x: LAYOUT.leftX, y: LAYOUT.panelY, w: PANEL.width, h: PANEL.height },
  { x: LAYOUT.rightX, y: LAYOUT.panelY, w: PANEL.width, h: PANEL.height },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawStar(ctx, x, y, r, fill, outline) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a2) * r * 0.45, y + Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawCheck(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.25, y + s * 0.8);
  ctx.lineTo(x + s, y - s * 0.8);
  ctx.stroke();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const panels = [document.createElement('canvas'), document.createElement('canvas')];
  for (const p of panels) {
    p.width = PANEL.width;
    p.height = PANEL.height;
  }
  let bakedScene = null;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Bake both panels for a scene: left is the base picture, right has the differences. */
  function bake(scene) {
    for (let side = 0; side < 2; side += 1) {
      const ctx = panels[side].getContext('2d');
      const on = side === 1 ? new Set(scene.diffs.map((d) => d.id)) : new Set();
      scene.draw(ctx, PANEL.width, PANEL.height, on);
    }
    bakedScene = scene.id;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${weight ?? ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ?? ''} ${size}px ${FONT}`.trim());
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function drawTopBar(state, scene, muted) {
    context.fillStyle = PALETTE.topBar;
    context.fillRect(0, 0, FIELD.width, LAYOUT.topBar);
    text('TWIN LANTERNS', 24, 40, 28, PALETTE.goldBright, 'left', '700');
    text('spot the difference', 296, 40, 18, PALETTE.muted, 'left');
    text(scene.name, FIELD.width / 2, 40, 22, PALETTE.text, 'center', '600');
    const danger = state.timeLeft <= TIMER.dangerAt;
    text(formatTime(state.timeLeft), FIELD.width - 250, 40, 26, danger ? PALETTE.red : PALETTE.text, 'right', '700');
    text(`Score ${state.score}`, FIELD.width - 130, 40, 20, PALETTE.muted, 'right');
    // Mute button (top-right corner).
    context.fillStyle = '#3a2f56';
    roundRect(context, FIELD.width - 112, 14, 88, 36, 8);
    context.fill();
    text(muted ? 'Muted' : 'Sound', FIELD.width - 68, 38, 16, PALETTE.text, 'center');
  }

  function drawTimerBar(state, scene) {
    const frac = Math.max(0, state.timeLeft / scene.seconds);
    context.fillStyle = '#3a2f56';
    context.fillRect(0, LAYOUT.topBar, FIELD.width, 6);
    context.fillStyle = frac <= 0.2 ? PALETTE.red : frac <= 0.45 ? PALETTE.gold : PALETTE.teal;
    context.fillRect(0, LAYOUT.topBar, FIELD.width * frac, 6);
  }

  function drawPanels(state, scene, now) {
    for (let side = 0; side < 2; side += 1) {
      const r = PANEL_RECTS[side];
      context.save();
      roundRect(context, r.x, r.y, r.w, r.h, 12);
      context.clip();
      context.drawImage(panels[side], r.x, r.y);
      context.restore();
      context.strokeStyle = PALETTE.panelBorder;
      context.lineWidth = 3;
      roundRect(context, r.x, r.y, r.w, r.h, 12);
      context.stroke();
      // Panel tag.
      context.fillStyle = 'rgba(23,18,38,0.75)';
      roundRect(context, r.x + 10, r.y + 10, 34, 26, 6);
      context.fill();
      text(side === 0 ? 'A' : 'B', r.x + 27, r.y + 29, 18, PALETTE.text, 'center', '700');
    }
    drawMarkers(state, scene, now);
  }

  function markerAt(diff, rect, pulse) {
    const cx = rect.x + diff.x;
    const cy = rect.y + diff.y;
    const radius = diff.r + 5 + pulse * 2;
    context.strokeStyle = PALETTE.goldBright;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = 'rgba(232,163,61,0.5)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    context.stroke();
    // Gold check at the ring's top-right.
    const checkX = cx + radius * 0.7;
    const checkY = cy - radius * 0.7;
    context.fillStyle = PALETTE.gold;
    context.beginPath();
    context.arc(checkX, checkY, 11, 0, Math.PI * 2);
    context.fill();
    drawCheck(context, checkX, checkY, 6, '#241c3a');
  }

  function drawMarkers(state, scene, now) {
    for (const diff of scene.diffs) {
      if (!state.found.has(diff.id)) continue;
      const flash = state.flashes.find((f) => f.kind === 'found' && f.x === diff.x && f.y === diff.y);
      const pulse = flash ? (flash.until - state.now) / 1.2 : 0;
      for (const rect of PANEL_RECTS) markerAt(diff, rect, pulse);
    }
    // Hint: a pulsing ring around one unfound difference, on both panels.
    if (state.hint) {
      const diff = scene.diffs.find((d) => d.id === state.hint.diffId);
      if (diff) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 6);
        for (const rect of PANEL_RECTS) {
          const cx = rect.x + diff.x;
          const cy = rect.y + diff.y;
          context.strokeStyle = `rgba(79,195,184,${0.55 + pulse * 0.4})`;
          context.lineWidth = 4;
          context.beginPath();
          context.arc(cx, cy, diff.r + 6 + pulse * 6, 0, Math.PI * 2);
          context.stroke();
        }
      }
    }
    // Wrong-click flashes: a red X where the player clicked, on the panel they clicked.
    for (const flash of state.flashes) {
      if (flash.kind !== 'wrong') continue;
      const age = 1 - (flash.until - state.now) / 0.7;
      const alpha = Math.max(0, 1 - age);
      for (const rect of PANEL_RECTS) {
        const cx = rect.x + flash.x;
        const cy = rect.y + flash.y;
        if (cx < rect.x || cx > rect.x + rect.w || cy < rect.y || cy > rect.y + rect.h) continue;
        context.strokeStyle = `rgba(229,83,75,${alpha})`;
        context.lineWidth = 5;
        context.lineCap = 'round';
        const s = 12;
        context.beginPath();
        context.moveTo(cx - s, cy - s);
        context.lineTo(cx + s, cy + s);
        context.moveTo(cx + s, cy - s);
        context.lineTo(cx - s, cy + s);
        context.stroke();
      }
    }
  }

  function drawCentreColumn(state, scene) {
    const cx = LAYOUT.centreX + LAYOUT.centreWidth / 2;
    const total = scene.diffs.length;
    const found = state.found.size;
    const left = total - found;
    context.fillStyle = PALETTE.centre;
    roundRect(context, LAYOUT.centreX, LAYOUT.panelY, LAYOUT.centreWidth, PANEL.height, 12);
    context.fill();
    text('FOUND', cx, LAYOUT.panelY + 36, 15, PALETTE.muted, 'center', '700');
    text(`${found}`, cx, LAYOUT.panelY + 92, 46, PALETTE.goldBright, 'center', '700');
    text(`of ${total}`, cx, LAYOUT.panelY + 120, 18, PALETTE.text, 'center');
    text(`${left} to go`, cx, LAYOUT.panelY + 152, 17, left === 0 ? PALETTE.green : PALETTE.muted, 'center', '600');
    // Progress dots.
    for (let i = 0; i < total; i += 1) {
      const dx = cx - ((total - 1) * 11) / 2 + i * 11;
      const dy = LAYOUT.panelY + 176;
      context.fillStyle = i < found ? PALETTE.gold : '#3a2f56';
      context.beginPath();
      context.arc(dx, dy, 4, 0, Math.PI * 2);
      context.fill();
    }
    // Hint button.
    const hy = LAYOUT.panelY + 220;
    context.fillStyle = state.hintsLeft > 0 ? '#2e6f6a' : '#3a2f56';
    roundRect(context, LAYOUT.centreX + 10, hy, 84, 64, 10);
    context.fill();
    text('HINT', cx, hy + 26, 17, PALETTE.text, 'center', '700');
    text(`${state.hintsLeft} left  (H)`, cx, hy + 48, 12, PALETTE.muted, 'center');
    // Misses.
    text(`Misses ${state.misses}`, cx, LAYOUT.panelY + 330, 14, PALETTE.muted, 'center');
    // Pause button.
    const py = LAYOUT.panelY + 360;
    context.fillStyle = '#3a2f56';
    roundRect(context, LAYOUT.centreX + 10, py, 84, 44, 10);
    context.fill();
    text('Pause (P)', cx, py + 28, 15, PALETTE.text, 'center');
    // Restart button.
    const ry = LAYOUT.panelY + 416;
    context.fillStyle = '#3a2f56';
    roundRect(context, LAYOUT.centreX + 10, ry, 84, 44, 10);
    context.fill();
    text('Restart (R)', cx, ry + 28, 15, PALETTE.text, 'center');
  }

  function drawBottomBar(state, scene, message, best) {
    const y = LAYOUT.bottomY;
    text(message, FIELD.width / 2, y + 34, 20, PALETTE.text, 'center');
    text(
      `Level ${state.levelIndex + 1} of ${SCENES.length}  ·  ${scene.subtitle}  ·  Click a difference on either picture  ·  Wrong click −${5}s`,
      FIELD.width / 2,
      y + 66,
      15,
      PALETTE.muted,
      'center',
    );
    // Level dots.
    for (let i = 0; i < SCENES.length; i += 1) {
      const dx = FIELD.width / 2 - ((SCENES.length - 1) * 18) / 2 + i * 18;
      context.fillStyle = i < state.levelIndex ? PALETTE.gold : i === state.levelIndex ? PALETTE.goldBright : '#3a2f56';
      context.beginPath();
      context.arc(dx, y + 92, 6, 0, Math.PI * 2);
      context.fill();
    }
    text(`Best score ${best}`, FIELD.width / 2, y + 124, 14, PALETTE.muted, 'center');
  }

  function overlayPanel(title, lines, prompt, stars) {
    context.fillStyle = 'rgba(23,18,38,0.82)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const w = 640;
    const h = 150 + lines.length * 34 + (stars ? 70 : 0) + 70;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = PALETTE.topBar;
    roundRect(context, x, y, w, h, 16);
    context.fill();
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 2;
    roundRect(context, x, y, w, h, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 62, 42, PALETTE.goldBright, 'center', '700');
    if (stars) {
      for (let i = 0; i < 3; i += 1) {
        const sx = FIELD.width / 2 + (i - 1) * 56;
        drawStar(context, sx, y + 118, 22, i < stars ? PALETTE.goldBright : '#3a2f56', i < stars ? PALETTE.gold : null);
      }
    }
    const base = y + (stars ? 152 : 96);
    for (let i = 0; i < lines.length; i += 1) text(lines[i], FIELD.width / 2, base + i * 34, 20, PALETTE.text, 'center');
    text(prompt, FIELD.width / 2, y + h - 30, 19, PALETTE.gold, 'center', '600');
  }

  function drawTitle(state, best) {
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // A faint preview of the first scene behind the title.
    context.save();
    context.globalAlpha = 0.25;
    context.drawImage(panels[0], (FIELD.width - 560) / 2, 150, 560, 480);
    context.restore();
    context.fillStyle = 'rgba(23,18,38,0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('TWIN LANTERNS', FIELD.width / 2, 128, 64, PALETTE.goldBright, 'center', '800');
    text('a spot-the-difference game in three hand-drawn scenes', FIELD.width / 2, 168, 22, PALETTE.text, 'center');
    text('Two pictures hang side by side. They look the same — they are not.', FIELD.width / 2, 210, 18, PALETTE.muted, 'center');
    text('Click every difference you can find before the lantern burns down.', FIELD.width / 2, 236, 18, PALETTE.muted, 'center');
    // Level cards.
    const cardW = 280;
    const gap = 24;
    const totalW = SCENES.length * cardW + (SCENES.length - 1) * gap;
    const startX = (FIELD.width - totalW) / 2;
    for (let i = 0; i < SCENES.length; i += 1) {
      const x = startX + i * (cardW + gap);
      const y = 290;
      context.fillStyle = '#2b2144';
      roundRect(context, x, y, cardW, 150, 14);
      context.fill();
      context.strokeStyle = PALETTE.panelBorder;
      context.lineWidth = 2;
      roundRect(context, x, y, cardW, 150, 14);
      context.stroke();
      text(`${i + 1}`, x + 24, y + 44, 30, PALETTE.goldBright, 'left', '700');
      text(SCENES[i].name, x + 24, y + 78, 21, PALETTE.text, 'left', '600');
      text(`${SCENES[i].diffs.length} differences  ·  ${formatTime(SCENES[i].seconds)}`, x + 24, y + 108, 15, PALETTE.muted, 'left');
      text('Click to play', x + 24, y + 134, 14, PALETTE.teal, 'left');
    }
    text('Press 1, 2 or 3 to pick a scene — or Space to start at the cove', FIELD.width / 2, 486, 17, PALETTE.muted, 'center');
    text('H hint (3 per level)  ·  P pause  ·  M sound  ·  R restart', FIELD.width / 2, 520, 16, PALETTE.muted, 'center');
    text(`Best score ${best}`, FIELD.width / 2, 566, 16, PALETTE.gold, 'center');
  }

  function draw(state, screen, best, ui, now) {
    const scene = SCENES[state.levelIndex];
    if (bakedScene !== scene.id) bake(scene);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    drawTopBar(state, scene, ui.muted);
    drawTimerBar(state, scene);
    drawPanels(state, scene, now);
    drawCentreColumn(state, scene);
    drawBottomBar(state, scene, ui.message, best);
    if (screen === SCREEN_PAUSED) {
      overlayPanel('Paused', ['The lanterns wait for you.'], 'Press P or click to carry on');
    } else if (screen === SCREEN_LEVEL_CLEAR) {
      overlayPanel(
        'Scene complete!',
        [`You found all ${scene.diffs.length} differences in ${scene.name}.`, `Level score ${state.levelScore}  ·  Total ${state.score}`],
        'Press Space for the next scene',
        state.stars,
      );
    } else if (screen === SCREEN_OVER) {
      overlayPanel(
        'Time\u2019s up',
        [
          `You found ${state.found.size} of ${scene.diffs.length} differences in ${scene.name}.`,
          `${scene.diffs.length - state.found.size} are still hiding in the pictures.`,
        ],
        'Press Space to try this scene again',
      );
    } else if (screen === SCREEN_WIN) {
      overlayPanel(
        'You found them all!',
        [
          `Every difference in all three scenes — ${state.totalFound} finds.`,
          `Total score ${state.score}  ·  Best ${Math.max(best, state.score)}`,
        ],
        'Press Space to play again',
        3,
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    draw,
    bake,
    /** Map a field click to a panel and scene coordinates, or null. */
    panelAt(x, y) {
      for (let side = 0; side < 2; side += 1) {
        const r = PANEL_RECTS[side];
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
          return { side, sx: x - r.x, sy: y - r.y };
        }
      }
      return null;
    },
    /** Name the button at a field point, or null. */
    buttonAt(x, y) {
      const cx = LAYOUT.centreX;
      if (x >= cx + 10 && x <= cx + 94) {
        const hy = LAYOUT.panelY + 220;
        if (y >= hy && y <= hy + 64) return 'hint';
        const py = LAYOUT.panelY + 360;
        if (y >= py && y <= py + 44) return 'pause';
        const ry = LAYOUT.panelY + 416;
        if (y >= ry && y <= ry + 44) return 'restart';
      }
      if (x >= FIELD.width - 112 && x <= FIELD.width - 24 && y >= 14 && y <= 50) return 'mute';
      return null;
    },
    /** The level card at a field point on the title screen, or -1. */
    levelCardAt(x, y) {
      const cardW = 280;
      const gap = 24;
      const totalW = SCENES.length * cardW + (SCENES.length - 1) * gap;
      const startX = (FIELD.width - totalW) / 2;
      if (y < 290 || y > 440) return -1;
      for (let i = 0; i < SCENES.length; i += 1) {
        const x0 = startX + i * (cardW + gap);
        if (x >= x0 && x <= x0 + cardW) return i;
      }
      return -1;
    },
  };
}
