// The three scenes. Every picture is drawn by code, twice: the left panel draws the base
// scene, the right panel draws it again with each difference applied. A difference is one
// small, fair change — an element present on one side only, or a colour that differs —
// with a hit circle (x, y, r) in scene coordinates (560x480). Nothing here is random at
// draw time: decorative scatter uses a seeded generator, so both panels always agree
// except for the differences themselves.

import { PANEL } from './config.js';
import { createRandom } from './random.js';

const W = PANEL.width;
const H = PANEL.height;

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function sparkle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function cloud(ctx, x, y, s, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 16 * s, y - 6 * s, 13 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y, 14 * s, 0, Math.PI * 2);
  ctx.arc(x + 14 * s, y + 6 * s, 14 * s, 0, Math.PI * 2);
  ctx.fill();
}

function bird(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x - 4 * s, y - 7 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 7 * s, x + 9 * s, y);
  ctx.stroke();
}

function starfish(ctx, x, y, r, rot, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const a = rot + (i * Math.PI * 2) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a2) * r * 0.45, y + Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

function flower(ctx, x, y, petal, centre) {
  for (let i = 0; i < 5; i += 1) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    circle(ctx, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, petal);
  }
  circle(ctx, x, y, 5, centre);
}

function scatterStars(ctx, random, count, top, color) {
  for (let i = 0; i < count; i += 1) {
    const x = 20 + random() * (W - 40);
    const y = 12 + random() * top;
    const r = 1 + random() * 2.2;
    sparkle(ctx, x, y, r, color);
  }
}

function skyGradient(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------------------
// Scene 1 — Lighthouse Cove (7 differences, dusk by the sea)
// ---------------------------------------------------------------------------
function drawCove(ctx, _w, _h, on) {
  const random = createRandom(101);
  skyGradient(ctx, [[0, '#3b2a63'], [0.45, '#c65f6e'], [0.62, '#f2a65e'], [1, '#f7cf8a']]);
  // Low sun, half-dipped.
  circle(ctx, 120, 285, 34, '#ffd166');
  circle(ctx, 120, 285, 26, '#ffe9a8');
  scatterStars(ctx, random, 14, 120, 'rgba(255,245,220,0.9)');
  cloud(ctx, 300, 70, 1.1, 'rgba(255,225,200,0.85)');
  cloud(ctx, 480, 110, 0.8, 'rgba(255,210,190,0.8)');
  if (on.has('cloud-puff')) cloud(ctx, 180, 60, 0.9, 'rgba(255,225,200,0.9)');
  // Seagulls.
  bird(ctx, 340, 60, 1, '#2b2144');
  bird(ctx, 370, 82, 0.85, '#2b2144');
  if (!on.has('gull')) bird(ctx, 395, 78, 0.9, '#2b2144');

  // Sea.
  rect(ctx, 0, 300, W, 100, '#2e6f8e');
  rect(ctx, 0, 300, W, 6, '#7fc4d8');
  for (let i = 0; i < 7; i += 1) {
    const y = 318 + i * 11;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 14) ctx.lineTo(x, y + Math.sin((x + i * 40) / 46) * 3);
    ctx.stroke();
  }
  // Sun path on the water.
  ctx.fillStyle = 'rgba(255,209,102,0.35)';
  ctx.beginPath();
  ctx.moveTo(96, 306);
  ctx.lineTo(144, 306);
  ctx.lineTo(168, 398);
  ctx.lineTo(72, 398);
  ctx.closePath();
  ctx.fill();

  // Rocky point and lighthouse (right side).
  ctx.fillStyle = '#5b5470';
  ctx.beginPath();
  ctx.moveTo(400, 400);
  ctx.lineTo(430, 250);
  ctx.lineTo(480, 250);
  ctx.lineTo(520, 400);
  ctx.closePath();
  ctx.fill();
  // Tower: white with red bands.
  ctx.fillStyle = '#f5efe0';
  ctx.beginPath();
  ctx.moveTo(438, 260);
  ctx.lineTo(446, 150);
  ctx.lineTo(470, 150);
  ctx.lineTo(478, 260);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 440, 196, 36, 16, '#e5534b');
  rect(ctx, 443, 232, 30, 14, '#e5534b');
  // Lamp room.
  rect(ctx, 442, 128, 32, 24, '#2b2144');
  circle(ctx, 458, 140, 7, on.has('beacon-window') ? '#3a3348' : '#ffd166');
  ctx.fillStyle = '#2b2144';
  ctx.beginPath();
  ctx.moveTo(438, 128);
  ctx.lineTo(458, 112);
  ctx.lineTo(478, 128);
  ctx.closePath();
  ctx.fill();
  // Light beam sweeping left over the sea.
  ctx.fillStyle = 'rgba(255,225,140,0.20)';
  ctx.beginPath();
  ctx.moveTo(442, 140);
  ctx.lineTo(180, 96);
  ctx.lineTo(180, 190);
  ctx.lineTo(442, 146);
  ctx.closePath();
  ctx.fill();

  // Cottage (left side) on the beach edge.
  rect(ctx, 52, 330, 110, 70, '#e8d9b0');
  ctx.fillStyle = '#b4503f';
  ctx.beginPath();
  ctx.moveTo(44, 332);
  ctx.lineTo(107, 292);
  ctx.lineTo(170, 332);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 66, 356, 22, 26, '#ffd166');
  rect(ctx, 126, 356, 22, 26, '#ffd166');
  if (on.has('cottage-window')) rect(ctx, 96, 356, 14, 18, '#ffd166');
  rect(ctx, 100, 382, 18, 18, '#6b4a2f');
  // Chimney with a curl of smoke.
  rect(ctx, 140, 296, 12, 30, '#8a6f5c');
  ctx.strokeStyle = 'rgba(245,239,224,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(146, 292);
  ctx.quadraticCurveTo(156, 278, 148, 266);
  ctx.quadraticCurveTo(142, 256, 150, 248);
  ctx.stroke();

  // Sailboat mid-sea.
  ctx.fillStyle = '#6b4a2f';
  ctx.beginPath();
  ctx.moveTo(232, 344);
  ctx.lineTo(292, 344);
  ctx.lineTo(282, 360);
  ctx.lineTo(242, 360);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(262, 344);
  ctx.lineTo(262, 296);
  ctx.stroke();
  ctx.fillStyle = '#f5efe0';
  ctx.beginPath();
  ctx.moveTo(262, 298);
  ctx.lineTo(262, 342);
  ctx.lineTo(288, 342);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = on.has('sail-stripe') ? '#4fc3b8' : '#e5534b';
  ctx.beginPath();
  ctx.moveTo(262, 312);
  ctx.lineTo(262, 324);
  ctx.lineTo(278, 324);
  ctx.closePath();
  ctx.fill();

  // Buoy bobbing right of the boat.
  circle(ctx, 330, 368, 10, on.has('buoy') ? '#7bc96f' : '#e5534b');
  rect(ctx, 326, 350, 8, 10, on.has('buoy') ? '#5aa85a' : '#b4503f');
  circle(ctx, 330, 348, 3, '#ffd166');

  // Beach foreground.
  rect(ctx, 0, 400, W, 80, '#e8c98f');
  ctx.fillStyle = 'rgba(190,150,90,0.5)';
  for (let i = 0; i < 26; i += 1) ellipse(ctx, 20 + random() * (W - 40), 410 + random() * 60, 3 + random() * 5, 2, 'rgba(190,150,90,0.5)');
  if (!on.has('starfish')) starfish(ctx, 120, 440, 15, 0.4, '#e87a5d');
  starfish(ctx, 500, 448, 11, 1.2, '#e87a5d');
  // Shells.
  ellipse(ctx, 210, 452, 9, 6, '#f5efe0');
  ellipse(ctx, 330, 430, 8, 5, '#d9a7c7');
  // Crab near the waterline.
  circle(ctx, 460, 418, 9, '#e5534b');
  ctx.strokeStyle = '#e5534b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(452, 414);
  ctx.lineTo(444, 406);
  ctx.moveTo(468, 414);
  ctx.lineTo(476, 406);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Scene 2 — Firefly Garden (8 differences, a night garden)
// ---------------------------------------------------------------------------
function drawGarden(ctx, _w, _h, on) {
  const random = createRandom(202);
  skyGradient(ctx, [[0, '#0e1f3d'], [0.55, '#1d3a5f'], [1, '#2c5d4f']]);
  scatterStars(ctx, random, 26, 170, 'rgba(255,250,220,0.95)');
  // Moon with a crater.
  circle(ctx, 470, 70, 36, '#f5efe0');
  circle(ctx, 470, 70, 30, '#fffbe8');
  if (!on.has('moon-crater')) {
    circle(ctx, 458, 60, 6, '#d9d2b8');
    circle(ctx, 480, 80, 4, '#d9d2b8');
  }
  // Distant trees.
  for (const [x, h] of [[30, 90], [90, 120], [520, 100], [560, 80]]) {
    ctx.fillStyle = '#16301f';
    ctx.beginPath();
    ctx.moveTo(x - 26, 300);
    ctx.lineTo(x, 300 - h);
    ctx.lineTo(x + 26, 300);
    ctx.closePath();
    ctx.fill();
  }
  // Ground.
  rect(ctx, 0, 300, W, 180, '#2c5d3a');
  rect(ctx, 0, 300, W, 8, '#3d7a4e');
  // Winding path.
  ctx.fillStyle = '#cbb98a';
  ctx.beginPath();
  ctx.moveTo(120, 480);
  ctx.quadraticCurveTo(180, 380, 150, 300);
  ctx.lineTo(210, 300);
  ctx.quadraticCurveTo(250, 380, 210, 480);
  ctx.closePath();
  ctx.fill();

  // Mushroom house (left-centre).
  ellipse(ctx, 200, 300, 74, 12, '#5a4632');
  ctx.fillStyle = '#f5e6c8';
  ctx.beginPath();
  ctx.moveTo(150, 300);
  ctx.lineTo(150, 240);
  ctx.quadraticCurveTo(200, 222, 250, 240);
  ctx.lineTo(250, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(128, 246);
  ctx.quadraticCurveTo(200, 150, 272, 246);
  ctx.quadraticCurveTo(200, 268, 128, 246);
  ctx.closePath();
  ctx.fill();
  circle(ctx, 170, 205, 12, '#f5efe0');
  circle(ctx, 215, 195, 9, '#f5efe0');
  circle(ctx, 238, 222, 8, '#f5efe0');
  if (on.has('mushroom-spot')) circle(ctx, 192, 220, 7, '#f5efe0');
  // Round door and window, warmly lit.
  ctx.fillStyle = '#6b4a2f';
  ctx.beginPath();
  ctx.arc(200, 300, 20, Math.PI, 0);
  ctx.fill();
  rect(ctx, 180, 280, 40, 20, '#6b4a2f');
  circle(ctx, 232, 268, 9, '#ffd166');
  circle(ctx, 232, 268, 5, '#ffe9a8');

  // Hanging lantern from a branch (right of the house).
  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, 150);
  ctx.lineTo(300, 168);
  ctx.stroke();
  ctx.fillStyle = '#e8a33d';
  ctx.beginPath();
  ctx.moveTo(288, 168);
  ctx.lineTo(312, 168);
  ctx.lineTo(306, 196);
  ctx.lineTo(294, 196);
  ctx.closePath();
  ctx.fill();
  circle(ctx, 300, 182, 7, on.has('lantern') ? '#3a3348' : '#ffe9a8');
  if (!on.has('lantern')) {
    const glow = ctx.createRadialGradient(300, 182, 4, 300, 182, 40);
    glow.addColorStop(0, 'rgba(255,233,168,0.30)');
    glow.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(300, 182, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pond (bottom-right) with lily pads.
  ellipse(ctx, 430, 430, 96, 40, '#1d4a6b');
  ellipse(ctx, 430, 428, 88, 34, '#2e6f8e');
  ellipse(ctx, 396, 428, 22, 8, '#3d7a4e');
  ellipse(ctx, 458, 436, 20, 7, '#3d7a4e');
  if (on.has('lily')) ellipse(ctx, 430, 424, 18, 6, '#4c9a5e');
  // Frog on a pad.
  if (!on.has('frog')) {
    ellipse(ctx, 380, 414, 18, 12, '#7bc96f');
    circle(ctx, 370, 402, 6, '#7bc96f');
    circle(ctx, 390, 402, 6, '#7bc96f');
    circle(ctx, 370, 400, 2.4, '#1d2b1d');
    circle(ctx, 390, 400, 2.4, '#1d2b1d');
  }

  // Flowers along the path.
  flower(ctx, 96, 350, '#e87a9d', '#ffd166');
  flower(ctx, 260, 340, '#b388e8', '#ffd166');
  flower(ctx, 330, 400, on.has('flower-color') ? '#b388e8' : '#e5534b', '#ffd166');
  flower(ctx, 350, 360, '#f5efe0', '#e8a33d');
  flower(ctx, 70, 430, '#ffd166', '#e5534b');
  flower(ctx, 520, 340, '#e87a9d', '#ffd166');
  // Snail on the path.
  if (!on.has('snail')) {
    ellipse(ctx, 150, 424, 12, 8, '#c98a5e');
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(150, 420, 7, Math.PI, 0);
    ctx.stroke();
    circle(ctx, 140, 416, 2, '#1d2b1d');
  }
  // Fireflies.
  for (const [x, y] of [[70, 130], [250, 120], [340, 210], [500, 200], [420, 300]]) {
    circle(ctx, x, y, 7, 'rgba(255,233,120,0.18)');
    circle(ctx, x, y, 3, '#ffe978');
  }
  if (!on.has('firefly')) {
    circle(ctx, 90, 90, 8, 'rgba(255,233,120,0.2)');
    circle(ctx, 90, 90, 3.5, '#ffe978');
  }
}

// ---------------------------------------------------------------------------
// Scene 3 — Starlight Market (9 differences, an evening street market)
// ---------------------------------------------------------------------------
function drawMarket(ctx, _w, _h, on) {
  const random = createRandom(303);
  skyGradient(ctx, [[0, '#241a4a'], [0.5, '#5b2a63'], [1, '#8a4a5e']]);
  scatterStars(ctx, random, 20, 130, 'rgba(255,245,220,0.9)');
  if (!on.has('star')) sparkle(ctx, 500, 55, 7, '#fff6c9');
  sparkle(ctx, 60, 40, 5, '#fff6c9');
  // Moon.
  circle(ctx, 280, 60, 26, '#f5efe0');
  circle(ctx, 272, 54, 5, '#d9d2b8');
  // Bunting strings across the street.
  ctx.strokeStyle = '#3a2a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.quadraticCurveTo(280, 140, 560, 96);
  ctx.stroke();
  const flagColors = ['#e5534b', '#ffd166', '#4fc3b8', '#b388e8'];
  for (let i = 0; i < 12; i += 1) {
    // The seventh flag hangs on the right panel only, in gold.
    if (i === 6 && !on.has('bunting')) continue;
    const t = (i + 0.5) / 12;
    const x = t * 560;
    const y = 96 + Math.sin(t * Math.PI) * 30 + 12;
    ctx.fillStyle = i === 6 ? '#ffd166' : flagColors[i % 4];
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 4);
    ctx.lineTo(x + 9, y - 4);
    ctx.lineTo(x, y + 12);
    ctx.closePath();
    ctx.fill();
  }
  // Paper lantern string (upper right).
  ctx.strokeStyle = '#3a2a4a';
  ctx.beginPath();
  ctx.moveTo(330, 60);
  ctx.lineTo(470, 60);
  ctx.stroke();
  for (const [x, lit] of [[350, true], [400, true], [450, true]]) {
    const isTarget = x === 350;
    const onState = isTarget ? !on.has('lantern-string') : lit;
    circle(ctx, x, 82, 11, onState ? '#ffd166' : '#5a4a6e');
    circle(ctx, x, 82, 6, onState ? '#ffe9a8' : '#4a3d5e');
  }

  // Street.
  rect(ctx, 0, 330, W, 150, '#6b5a72');
  rect(ctx, 0, 330, W, 6, '#8a7a92');
  for (let i = 0; i < 4; i += 1) rect(ctx, 40 + i * 140, 420, 60, 6, 'rgba(245,239,224,0.4)');

  // Stall 1 (left): fruit stall with striped awning.
  drawStall(ctx, 40, 210, '#e5534b');
  // Crate of apples.
  rect(ctx, 150, 400, 64, 26, '#8a6f4e');
  for (const [x, y] of [[160, 396], [176, 392], [192, 396], [168, 384], [186, 384]]) {
    circle(ctx, x, y, 7, on.has('apple') ? '#7bc96f' : '#e5534b');
  }
  // Stall sign: a painted moon on the fruit stall's counter.
  circle(ctx, 95, 315, 10, '#f5efe0');
  if (on.has('sign')) sparkle(ctx, 95, 315, 6, '#ffd166');

  // Stall 2 (centre): tea stall, gold-striped awning.
  drawStall(ctx, 240, 200, on.has('awning-stripe') ? '#4fc3b8' : '#e8a33d');
  // Teapot and cups on the counter.
  circle(ctx, 280, 296, 10, '#4fc3b8');
  rect(ctx, 288, 292, 8, 4, '#4fc3b8');
  circle(ctx, 306, 300, 6, '#f5efe0');
  circle(ctx, 322, 300, 6, '#f5efe0');
  if (!on.has('coin')) circle(ctx, 300, 300, 5, '#ffd166');

  // Stall 3 (right): toy stall.
  drawStall(ctx, 420, 210, '#b388e8');
  // Balloon tied to the stall.
  if (!on.has('balloon')) {
    ctx.strokeStyle = '#3a2a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 210);
    ctx.quadraticCurveTo(86, 150, 80, 96);
    ctx.stroke();
    ellipse(ctx, 80, 78, 16, 20, '#e5534b');
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.moveTo(74, 96);
    ctx.lineTo(86, 96);
    ctx.lineTo(80, 104);
    ctx.closePath();
    ctx.fill();
  }

  // Cat sitting on a crate by stall 3.
  ellipse(ctx, 420, 400, 26, 10, '#3a3348');
  circle(ctx, 420, 384, 14, '#3a3348');
  ctx.fillStyle = '#3a3348';
  ctx.beginPath();
  ctx.moveTo(408, 376);
  ctx.lineTo(412, 362);
  ctx.lineTo(418, 374);
  ctx.closePath();
  ctx.moveTo(424, 374);
  ctx.lineTo(430, 362);
  ctx.lineTo(434, 376);
  ctx.closePath();
  ctx.fill();
  // Tail: up on the left panel, curled down on the right.
  ctx.strokeStyle = '#3a3348';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (on.has('cat-tail')) {
    ctx.moveTo(442, 398);
    ctx.quadraticCurveTo(456, 406, 448, 416);
  } else {
    ctx.moveTo(442, 398);
    ctx.quadraticCurveTo(458, 388, 452, 372);
  }
  ctx.stroke();
  circle(ctx, 415, 382, 2, '#ffd166');
  circle(ctx, 425, 382, 2, '#ffd166');
}

function drawStall(ctx, x, y, awning) {
  // Counter.
  rect(ctx, x, y + 90, 110, 40, '#7a5a3a');
  rect(ctx, x, y + 90, 110, 8, '#9a7a52');
  // Posts.
  rect(ctx, x + 4, y + 20, 6, 74, '#5a4632');
  rect(ctx, x + 100, y + 20, 6, 74, '#5a4632');
  // Striped awning.
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? awning : '#f5efe0';
    ctx.beginPath();
    ctx.moveTo(x - 6 + i * 24, y);
    ctx.lineTo(x + 18 + i * 24, y);
    ctx.lineTo(x + 14 + i * 24, y + 22);
    ctx.lineTo(x - 2 + i * 24, y + 22);
    ctx.closePath();
    ctx.fill();
  }
  rect(ctx, x - 6, y + 20, 122, 5, '#4a3220');
}

// ---------------------------------------------------------------------------
// Scene catalogue
// ---------------------------------------------------------------------------
export const SCENES = [
  {
    id: 'cove',
    name: 'Lighthouse Cove',
    subtitle: 'Dusk by the sea — 7 differences',
    seconds: 150,
    draw: drawCove,
    diffs: [
      { id: 'gull', label: 'a seagull', x: 395, y: 78, r: 18 },
      { id: 'beacon-window', label: 'the lighthouse lamp', x: 458, y: 140, r: 14 },
      { id: 'cottage-window', label: 'a cottage window', x: 103, y: 365, r: 15 },
      { id: 'sail-stripe', label: 'the sail stripe', x: 270, y: 318, r: 20 },
      { id: 'buoy', label: 'the buoy', x: 330, y: 362, r: 15 },
      { id: 'starfish', label: 'a starfish', x: 120, y: 440, r: 16 },
      { id: 'cloud-puff', label: 'a little cloud', x: 180, y: 60, r: 22 },
    ],
  },
  {
    id: 'garden',
    name: 'Firefly Garden',
    subtitle: 'A night garden — 8 differences',
    seconds: 150,
    draw: drawGarden,
    diffs: [
      { id: 'firefly', label: 'a firefly', x: 90, y: 90, r: 14 },
      { id: 'moon-crater', label: 'a moon crater', x: 458, y: 60, r: 15 },
      { id: 'mushroom-spot', label: 'a mushroom spot', x: 192, y: 220, r: 13 },
      { id: 'flower-color', label: 'a tulip', x: 330, y: 400, r: 16 },
      { id: 'snail', label: 'a snail', x: 150, y: 420, r: 17 },
      { id: 'lily', label: 'a lily pad', x: 430, y: 424, r: 17 },
      { id: 'lantern', label: 'the lantern flame', x: 300, y: 182, r: 14 },
      { id: 'frog', label: 'a frog', x: 380, y: 410, r: 18 },
    ],
  },
  {
    id: 'market',
    name: 'Starlight Market',
    subtitle: 'An evening market — 9 differences',
    seconds: 180,
    draw: drawMarket,
    diffs: [
      { id: 'balloon', label: 'a balloon', x: 80, y: 82, r: 18 },
      { id: 'cat-tail', label: 'the cat\u2019s tail', x: 448, y: 392, r: 18 },
      { id: 'awning-stripe', label: 'an awning stripe', x: 290, y: 210, r: 20 },
      { id: 'apple', label: 'an apple', x: 176, y: 392, r: 14 },
      { id: 'lantern-string', label: 'a paper lantern', x: 350, y: 82, r: 14 },
      { id: 'star', label: 'a bright star', x: 500, y: 55, r: 14 },
      { id: 'bunting', label: 'a bunting flag', x: 303, y: 138, r: 14 },
      { id: 'coin', label: 'a coin', x: 300, y: 300, r: 12 },
      { id: 'sign', label: 'the stall sign', x: 95, y: 315, r: 16 },
    ],
  },
];
