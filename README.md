# sizzle-chef

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ikun52521-max/sizzle-chef/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ikun52521-max/sizzle-chef/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle Chef is a fast little cooking game: take orders from the order board, cook patties, pasta and batter on a three-burner stove, build each dish on the plate, and serve it before the customer's patience runs out. Three-minute shifts, five dishes to master, combos for serving in a row, and a new day with a bigger menu and faster customers after every shift.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser and click **START YOUR SHIFT**.

Mouse and keyboard: click pantry bins to add ingredients (cookable ones go to the stove first), click a finished burner to move it to the plate, Space to serve, T to trash the plate, P to pause. Keys 1–0 pick pantry items, Q/W/E take from the burners.

## How it is built

- `game/` — the playable game as static files (plain Canvas 2D, no assets, no network)
- `game/src/config.js` — ingredients, recipes, days and tuning
- `game/src/state.js` — orders, the stove, the plate, serving and scoring
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — mouse and keyboard
- `game/src/shots.js` — staged states for the screenshots
- `game/src/main.js` — boot and main loop
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's game library, copied from the kit unchanged

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
