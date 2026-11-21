# Twin Lanterns — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/kyuraa-ship-it/twin-lanterns-spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/kyuraa-ship-it/twin-lanterns-spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Two pictures hang side by side. They look the same — they are not. **Twin Lanterns** is
a spot-the-difference game in three original, hand-drawn scenes: **Lighthouse Cove**
(7 differences at dusk by the sea), **Firefly Garden** (8 differences in a night
garden) and **Starlight Market** (9 differences at an evening street market). Every
picture is drawn by code — no borrowed art, no copied game.

Click a difference on either picture to ring it in gold on both. A wrong click costs
5 seconds; hints (3 per level) pulse a ring around one difference you have not found
yet. Clear a scene before the lantern burns down to earn stars, and chase the best
score across all three scenes. Sounds are synthesised live with WebAudio — no audio
files, no network: the whole game runs offline from its own static files.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server. Play with mouse and keyboard:
`H` hint, `P` pause, `M` sound, `R` restart, `1`/`2`/`3` pick a scene.

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  `config.js` (tuning), `scenes.js` (the three pictures and their differences),
  `world.js` (rules and state), `render.js` (drawing and screens), `input.js`,
  `audio.js` (synth sounds), `shots.js` (staged screenshot scenes), `main.js` (loop)
- `screenshots/` — 4 real renders of the game running
- `vendor/makefun-game.ts` — the kit's library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=yogi&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
