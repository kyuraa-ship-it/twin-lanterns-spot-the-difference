// Every tuning number, colour and layout constant in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size. Each scene panel is 560x480 in scene coordinates.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One scene panel, in scene coordinates (the art is drawn at this size, then scaled). */
export const PANEL = { width: 560, height: 480 };

/** Panel placement on the 1280x720 field. */
export const LAYOUT = {
  topBar: 64,
  panelY: 76,
  panelHeight: 480,
  leftX: 24,
  rightX: 696,
  centreX: 592,
  centreWidth: 104,
  bottomY: 568,
  bottomHeight: 140,
};

export const TIMER = {
  /** Seconds per level. */
  levelSeconds: [150, 150, 180],
  /** A wrong click costs this many seconds. */
  wrongPenalty: 5,
  /** Seconds left at which the timer bar turns red and the tick starts. */
  dangerAt: 30,
  tickAt: 10,
};

export const SCORE = {
  perFind: 100,
  /** Bonus per second left when a level is cleared. */
  timeBonusPerSecond: 5,
  hintCost: 50,
  wrongPenalty: 25,
};

export const HINTS_PER_LEVEL = 3;
export const HINT_SECONDS = 2.5;

/** Stars for a cleared level: 3 needs most of the time left and few misses. */
export const STARS = { three: { timeLeftFraction: 0.4, maxMisses: 2 }, two: { timeLeftFraction: 0.2, maxMisses: 5 } };

export const PALETTE = {
  backdrop: '#171226',
  topBar: '#221a38',
  panelBorder: '#4a3d6e',
  panelA: '#2b2144',
  text: '#f5efe0',
  muted: '#b8aec9',
  gold: '#e8a33d',
  goldBright: '#ffd166',
  teal: '#4fc3b8',
  red: '#e5534b',
  green: '#7bc96f',
  centre: '#241c3a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'twin-lanterns.best';
export const BEST_LEVEL_KEY = 'twin-lanterns.best-level';
