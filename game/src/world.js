// The game's rules and state, with no drawing and no browser in it: which level is open,
// which differences are found, the timer, the score, hints and misses. step() advances
// one fixed step and returns what happened as bit flags, so the caller can react without
// the world knowing about screens or sound. The world keeps its own clock (state.now,
// in seconds); flashes and hints are stamped against it.
import { HINT_SECONDS, HINTS_PER_LEVEL, SCORE, TIMER } from './config.js';
import { SCENES } from './scenes.js';

export const EVENT_FIND = 1;
export const EVENT_WRONG = 2;
export const EVENT_TIME_UP = 4;
export const EVENT_LEVEL_CLEAR = 8;
export const EVENT_TICK = 16;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createWorld() {
  const state = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    found: new Set(),
    misses: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hint: null, // { diffId, until } on the world's clock
    timeLeft: SCENES[0].seconds,
    score: 0,
    levelScore: 0,
    flashes: [], // { x, y, kind, until } on the world's clock
    lastTickSecond: -1,
    stars: 0,
    totalFound: 0,
    now: 0,
  };

  function scene() {
    return SCENES[state.levelIndex];
  }

  function startLevel(index) {
    state.levelIndex = index;
    state.found = new Set();
    state.misses = 0;
    state.hintsLeft = HINTS_PER_LEVEL;
    state.hint = null;
    state.flashes = [];
    state.timeLeft = scene().seconds;
    state.levelScore = 0;
    state.lastTickSecond = -1;
    state.stars = 0;
    state.screen = SCREEN_PLAY;
  }

  function toTitle() {
    state.screen = SCREEN_TITLE;
  }

  /** Click at scene coordinates (x, y) on either panel. Returns an event flag. */
  function clickAt(x, y) {
    if (state.screen !== SCREEN_PLAY) return 0;
    for (const diff of scene().diffs) {
      if (state.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      const reach = diff.r + 6;
      if (dx * dx + dy * dy <= reach * reach) {
        state.found.add(diff.id);
        state.totalFound += 1;
        state.score += SCORE.perFind;
        state.levelScore += SCORE.perFind;
        state.flashes.push({ x: diff.x, y: diff.y, kind: 'found', until: state.now + 1.2 });
        if (state.found.size === scene().diffs.length) {
          const bonus = Math.round(state.timeLeft) * SCORE.timeBonusPerSecond;
          state.score += bonus;
          state.levelScore += bonus;
          state.stars = starsFor(state.timeLeft / scene().seconds, state.misses);
          state.screen = state.levelIndex === SCENES.length - 1 ? SCREEN_WIN : SCREEN_LEVEL_CLEAR;
          return EVENT_FIND | EVENT_LEVEL_CLEAR;
        }
        return EVENT_FIND;
      }
    }
    state.misses += 1;
    state.timeLeft = Math.max(0, state.timeLeft - TIMER.wrongPenalty);
    state.score = Math.max(0, state.score - SCORE.wrongPenalty);
    state.levelScore = Math.max(0, state.levelScore - SCORE.wrongPenalty);
    state.flashes.push({ x, y, kind: 'wrong', until: state.now + 0.7 });
    if (state.timeLeft <= 0) {
      state.screen = SCREEN_OVER;
      return EVENT_WRONG | EVENT_TIME_UP;
    }
    return EVENT_WRONG;
  }

  function starsFor(timeFraction, misses) {
    if (timeFraction >= 0.4 && misses <= 2) return 3;
    if (timeFraction >= 0.2 && misses <= 5) return 2;
    return 1;
  }

  /** Spend a hint: reveal a random unfound difference for a few seconds. */
  function useHint() {
    if (state.screen !== SCREEN_PLAY || state.hintsLeft <= 0) return null;
    const remaining = scene().diffs.filter((d) => !state.found.has(d.id));
    if (remaining.length === 0) return null;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - SCORE.hintCost);
    state.levelScore = Math.max(0, state.levelScore - SCORE.hintCost);
    state.hint = { diffId: pick.id, until: state.now + HINT_SECONDS };
    return pick;
  }

  /** One fixed step (dt seconds). Returns event flags. */
  function step(dt) {
    let events = 0;
    state.now += dt;
    if (state.screen === SCREEN_PLAY) {
      state.timeLeft -= dt;
      const whole = Math.ceil(state.timeLeft);
      if (state.timeLeft <= TIMER.tickAt && whole !== state.lastTickSecond && whole > 0) {
        state.lastTickSecond = whole;
        events |= EVENT_TICK;
      }
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.screen = SCREEN_OVER;
        events |= EVENT_TIME_UP;
      }
    }
    if (state.hint && state.now >= state.hint.until) state.hint = null;
    state.flashes = state.flashes.filter((f) => state.now < f.until);
    return events;
  }

  return { state, scene, startLevel, toTitle, clickAt, useHint, step };
}
