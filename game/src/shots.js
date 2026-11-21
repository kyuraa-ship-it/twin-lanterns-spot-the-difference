// The screenshot scenes behind ?shot=cover|level2|hint|win. Each one sets the world to
// a real mid-game state (found differences, time left, a hint ringing) using the same
// rules a player would reach, so the frame is what a real game looks like and the same
// seed always gives the same frame. main.js paints the staged scene twice, then sets
// window.__shotReady for the screenshot.
import { SCENES } from './scenes.js';
import { SCREEN_LEVEL_CLEAR, SCREEN_PLAY } from './world.js';

/**
 * Set `world` to the named scene and return the screen to draw and the message line.
 * `now` is the world's clock, in seconds.
 */
export function stageShot(name, world, now) {
  const state = world.state;
  if (name === 'level2') {
    world.startLevel(1);
    state.timeLeft = 121;
    for (const id of ['firefly', 'moon-crater']) state.found.add(id);
    state.score = 200;
    state.levelScore = 200;
    state.totalFound = 2;
    return { screen: SCREEN_PLAY, message: 'Found a firefly! +100' };
  }
  if (name === 'hint') {
    world.startLevel(1);
    state.timeLeft = 74;
    for (const id of ['firefly', 'moon-crater', 'mushroom-spot', 'flower-color', 'snail']) state.found.add(id);
    state.score = 500;
    state.levelScore = 500;
    state.totalFound = 5;
    state.hintsLeft = 2;
    state.hint = { diffId: 'lantern', until: now + 60 };
    return { screen: SCREEN_PLAY, message: 'Hint: look near the lantern…' };
  }
  if (name === 'win') {
    world.startLevel(0);
    const scene = SCENES[0];
    for (const diff of scene.diffs) state.found.add(diff.id);
    state.timeLeft = 96;
    state.score = 700 + Math.round(96) * 5;
    state.levelScore = state.score;
    state.totalFound = scene.diffs.length;
    state.stars = 3;
    state.screen = SCREEN_LEVEL_CLEAR;
    return {
      screen: SCREEN_LEVEL_CLEAR,
      message: `You found all ${scene.diffs.length} differences in ${scene.name}.`,
    };
  }
  // cover (default): the cove, three found, four still hiding, plenty of time.
  world.startLevel(0);
  state.timeLeft = 98;
  for (const id of ['gull', 'beacon-window', 'starfish']) state.found.add(id);
  state.score = 300;
  state.levelScore = 300;
  state.totalFound = 3;
  return { screen: SCREEN_PLAY, message: 'Found a starfish! +100' };
}
