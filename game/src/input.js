// Keyboard and pointer input. One-shot presses (confirm, pause, hint, mute, restart) are
// queued as bit flags and taken once by the loop, so a press between two frames is never
// lost and never counted twice. Pointer clicks arrive with their position in field
// coordinates (1280x720 logical), which the caller maps onto panels and buttons.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);
const LEVELS = new Map([['Digit1', 0], ['Digit2', 1], ['Digit3', 2]]);

export function createInput(canvas) {
  let actions = 0;
  let levelPick = -1;
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (LEVELS.has(event.code)) {
      if (!event.repeat) levelPick = LEVELS.get(event.code);
    } else return;
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    clicks.push({
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    });
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The level number key pressed since the last call, or -1. */
    takeLevelPick() {
      const pick = levelPick;
      levelPick = -1;
      return pick;
    },
    /** Pointer clicks since the last call, in field coordinates. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
