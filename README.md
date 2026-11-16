[![make.fun competition](https://img.shields.io/badge/make.fun-competition-blue)](https://make.fun/bounty/token-radar-01)
[![make.fun rank](https://img.shields.io/badge/make.fun-rank-blue)](https://make.fun/bounty/token-radar-01/leaderboard)
[![make.fun reward](https://img.shields.io/badge/make.fun-reward%20%241325-green)](https://make.fun/bounty/token-radar-01)

# STRATA / token-radar-01

Offline snapshot radar: 200 protocols không ghi nhận token; separate snapshot market-cap view for 416 token-recorded protocols. No network, forecasting or reward assumptions.

Build with Node 22.18+ (no runtime install):

```sh
node main.ts --input input/snapshot.json --output out
```

Open `out/dashboard/index.html` directly in a browser. The page reads `../data.js` as a local script, without fetch, server or CDN. In the grading container run `node /bot/main.ts`: defaults are `/input/snapshot.json` and `/output`.

- `lib/model.ts`: token semantics, category medians, common valuation function, deterministic ties and category/chain/capital/age-derived six-step plans.
- `dashboard/`: plain HTML/CSS/JavaScript; numeric sort, combined filters, search, reset, empty state, per-row audit and separate live-token view.
- `screenshots/`: three actual final Chromium captures, 1440×900.
- `vendor/makefun-board.ts`: unchanged kit helper.
- `scripts/model-check.mjs`, `scripts/artifact-check.mjs`: model edge cases and local artifact checks.
- `scripts/runtime-check.py`: two clean Docker outputs, read-only source, network none, 1 CPU/1 GiB/64 PID configuration, all-file SHA-256 comparison.
- `scripts/ui-check.mjs`: development-only Playwright tests and real screenshots. Playwright is **not** a runtime dependency. It uses a persistent profile under `tools/`; set `CHROME` to a browser executable. `tools/` and downloaded kit are ignored.

Read `HANDOFF.md` for actual measurements, limitations, kit check and transcript export instructions. Do not submit automatically.
