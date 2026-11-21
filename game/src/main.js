// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between six screens: title, play, paused, level clear, time up
// and win. Sounds play on finds, wrong clicks, hints and wins.
//
// ?shot=cover|level2|hint|win stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import {
  createWorld,
  EVENT_FIND,
  EVENT_LEVEL_CLEAR,
  EVENT_TICK,
  EVENT_TIME_UP,
  EVENT_WRONG,
  SCREEN_LEVEL_CLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_HINT,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { SCENES } from './scenes.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);

let message = 'Two pictures, one story — find what changed.';
let best = readBest();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function announce(text) {
  status.textContent = text;
  message = text;
}

function runShot(name) {
  const staged = stageShot(name, world, world.state.now);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, staged.screen, best, { message: staged.message, muted: audio.muted }, world.state.now);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;

  function startLevel(index) {
    world.startLevel(index);
    screen = SCREEN_PLAY;
    announce(`Level ${index + 1}: ${SCENES[index].name}. Find ${SCENES[index].diffs.length} differences!`);
  }

  function toTitle() {
    world.toTitle();
    screen = SCREEN_TITLE;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce('Twin Lanterns. Press Space or click a scene to start.');
  }

  function handleClick(click) {
    audio.unlock();
    const button = renderer.buttonAt(click.x, click.y);
    if (button === 'mute') {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
      return;
    }
    if (screen === SCREEN_TITLE) {
      const level = renderer.levelCardAt(click.x, click.y);
      if (level >= 0) {
        audio.click();
        startLevel(level);
      }
      return;
    }
    if (button === 'hint' && screen === SCREEN_PLAY) {
      const pick = world.useHint();
      if (pick) {
        audio.hint();
        announce(`Hint: something changed near ${pick.label}…`);
      }
      return;
    }
    if (button === 'pause' && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
      return;
    }
    if (button === 'restart' && screen === SCREEN_PLAY) {
      audio.click();
      startLevel(world.state.levelIndex);
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (screen === SCREEN_LEVEL_CLEAR) {
      audio.click();
      startLevel(world.state.levelIndex + 1);
      return;
    }
    if (screen === SCREEN_OVER) {
      audio.click();
      startLevel(world.state.levelIndex);
      return;
    }
    if (screen === SCREEN_WIN) {
      audio.click();
      toTitle();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const panel = renderer.panelAt(click.x, click.y);
    if (!panel) return;
    const events = world.clickAt(panel.sx, panel.sy);
    if (events & EVENT_FIND) {
      audio.find();
      const found = world.state.found.size;
      const total = world.scene().diffs.length;
      if (events & EVENT_LEVEL_CLEAR) {
        audio.win();
        screen = world.state.screen;
        if (world.state.score > best) {
          best = world.state.score;
          saveBest(best);
        }
        announce(
          screen === SCREEN_WIN
            ? 'You found them all — every difference in every scene!'
            : `Scene complete! All ${total} differences found.`,
        );
      } else {
        announce(`Found ${found} of ${total} — ${total - found} still hiding.`);
      }
    } else if (events & EVENT_WRONG) {
      audio.wrong();
      if (events & EVENT_TIME_UP) {
        screen = SCREEN_OVER;
        announce(`Time's up! You found ${world.state.found.size} of ${world.scene().diffs.length}.`);
      } else {
        announce('Not quite — that costs 5 seconds.');
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const levelPick = input.takeLevelPick();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (levelPick >= 0 && screen === SCREEN_TITLE) {
      audio.click();
      startLevel(levelPick);
      return;
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startLevel(0);
      else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (screen === SCREEN_LEVEL_CLEAR) startLevel(world.state.levelIndex + 1);
      else if (screen === SCREEN_OVER) startLevel(world.state.levelIndex);
      else if (screen === SCREEN_WIN) toTitle();
    }
    if (actions & ACTION_PAUSE && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      const pick = world.useHint();
      if (pick) {
        audio.hint();
        announce(`Hint: something changed near ${pick.label}…`);
      }
    }
    if (actions & ACTION_RESTART && screen === SCREEN_PLAY) startLevel(world.state.levelIndex);
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP);
    if (events & EVENT_TICK) audio.tick();
    if (events & EVENT_TIME_UP) {
      screen = SCREEN_OVER;
      announce(`Time's up! You found ${world.state.found.size} of ${world.scene().diffs.length}.`);
    }
  }

  let accumulator = 0;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    for (const click of input.takeClicks()) handleClick(click);
    if (screen === SCREEN_PLAY || screen === SCREEN_TITLE) {
      while (accumulator >= STEP && (screen === SCREEN_PLAY || screen === SCREEN_TITLE)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    // The renderer reads the world's screen for overlays; keep it in step.
    world.state.screen = screen;
    renderer.draw(world.state, screen, best, { message, muted: audio.muted }, world.state.now);
  }

  // Leaving the tab pauses a running game rather than letting the timer run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Twin Lanterns. Press Space or click a scene to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
