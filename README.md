[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/c/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/yx9mio/token-radar-01/rank.svg)](https://make.fun/c/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/yx9mio/token-radar-01/reward.svg)](https://make.fun/c/token-radar-01)

# Token Radar

Offline token research dashboard with frozen valuation rankings, transparent methodology, and English farm plans.

Explore 200 pre-token protocols (40 watchlist, 160 early) and a separate view of 416 recorded-token protocols. Search, filter, sort, inspect exact model inputs, compare eligible live peers and review six conditional farm steps. No wallet connection, external requests, live prices or new market data.

**Verification status:** the v5 implementation is a local draft pending browser acceptance. The sandbox denies local HTTP listening and Chromium lacks shared libraries. The three existing JPG screenshots are historical v3 evidence, not v5 acceptance captures; generated dossier images are consequently stale. The required PNG screenshots are not claimed to exist. See docs/verification.md for actual results and blockers.

## Local build and run

Node 22.18.0 or later; no runtime dependencies or install step:

```sh
node main.ts --input input/snapshot.json --output out
python3 -m http.server 8000 --directory out
```

Open http://localhost:8000/dashboard/index.html. Directly opening out/dashboard/index.html also uses the local data.js script; no fetch is needed. The grading entrypoint remains main.ts with defaults /input/snapshot.json and /output.

```sh
node scripts/model-check.mjs
node scripts/artifact-check.mjs --data-only
sh scripts/language-check.sh
node scripts/ui-check.mjs
node scripts/artifact-check.mjs
node scripts/determinism-check.mjs
```

The browser check uses existing tools/node_modules/playwright and its default installed Chromium. It serves the actual out directory, tests four widths and real navigation/data, and captures screenshots/board.png, screenshots/detail.png and screenshots/filtered.png at 1440 × 1000. After successful capture, rebuild to include those images and rerun artifact verification. It never intercepts or substitutes dashboard data. Until then, the full artifact check correctly fails on the missing acceptance screenshots.

Determinism check builds twice and compares every output file byte for byte, including board.json. Output order and ages are frozen. Reports are written under reports/ (locally ignored). Official kit check, run from the kit directory:

```sh
node cli/makefun.mjs check --kit . --repo ../token-radar-01 --worktree --json
```

If that cannot spawn Git, the repository-relative retry is:

```sh
node ../token-radar-01-kit/cli/makefun.mjs check --kit ../token-radar-01-kit --repo . --worktree --json
```

## Frozen source and model

Snapshot: input/snapshot.json, unchanged. Reference time: 2026-11-14 UTC; fetched 2026-11-14T01:18:33.201Z from DefiLlama. It contains 758 protocol records and 40 watchlist slug references. Full checksums and source facts are in docs/rebuild-baseline.md. docs/baseline-board.json is an immutable byte copy of the validated 200-row board at 351ea5a; its source prose is retained solely for preservation verification and is never rendered.

Implied value = TVL × category or fallback multiple × growth × maturity.

- Eligible peers have a recorded token and finite, positive market cap and TVL; no CEX/version restriction applies. Category names match exactly; null becomes Unclassified. An even median averages the central two ratios.
- Multiple = clamp(category median market-cap/TVL if n ≥ 3, otherwise whole-market median, 0.05, 0.60). This snapshot has 128 eligible peers and whole-market median 0.21380325885644053.
- Growth = 1 + clamp(change_7d ?? 0, -60, 120) / 100 × 0.5. Input is percentage points; missing/nonfinite growth substitutes zero and is flagged. Observed zero is valid data.
- Age = max(0, floor((as_of UTC midnight - listed_at UTC midnight) / 86400000)). Missing/invalid calendar dates substitute 365 days. Maturity = 0.6 + min(age, 1095) / 1095 × 0.4, bounded by 0.6 and 1.0.
- Full JavaScript numeric precision is retained. Raw dollars = max(1, Math.round(TVL × multiple × growth × maturity)). Sort descending, ties by slug code-unit order; traverse upward making the minimum dollar adjustments for strict decrease, recorded separately. This baseline needs no adjustments. Assign fixed rank i+1. Display rounding never changes stored values.

No chain factor enters valuation. Every original numeric field, source input, chain/category membership, cohort, implied value and model rank is checked exactly against the baseline; frozen dollars use BigInt equality, never floating-point tolerance. Canonical order is preserved.

Capital tiers: TVL ≥ $5B uses $250; ≥ $1B uses $150; ≥ $100M uses $100; otherwise $50. Age <180 days holds 60 days; 180–365 holds 45 days; >365 holds 30 days. Younger protocols deliberately receive longer guidance. The second position is a smaller allocation within this total budget, on the second distinct source chain if available, otherwise the same chain. Asset support, access and fees must be verified.

## Conviction and navigation

Conviction = clamp(60 + categoryBonus + observationAdjustment + chainBonus + tvlBonus, 0, 100). Category multiple with n ≥ 3 adds 15. With s substitutions among age and growth, observations add 10 when s = 0, otherwise subtract 10 × s. Two distinct chains add 5. TVL ≥ $100M adds 10. This is data support, not investment success probability. Sorting ties use immutable model rank ascending.

Hash keys: q, cat, chain, cohort, view (pretoken/live), sort (implied/tvl/change7d/age/conviction), dir (asc/desc), slug. Defaults are omitted and values percent encoded. Live view uses implied sorting for market cap and does not offer conviction. Unknown keys are ignored, first duplicate wins, invalid filters fall back to unrestricted, and invalid sorts fall back to implied descending. An unknown slug displays Protocol not found. Valid slugs open even behind filters. Search updates after 250 ms and replaces history; other actions and dialogs support back/forward navigation.

## Ten model limitations

1. Risk Curators TVL may duplicate underlying vaults/protocols and inflate implied value. Raw total TVL is not independent assets.
2. Protocol versions may share a token. The version filter applies only to early rows.
3. Medians and clamps reduce outliers; they do not establish a causal relationship from TVL to token value.
4. Categories with few comparables use a fallback. Low n means limited evidence, not a calibrated confidence score.
5. TVL is not revenue. The snapshot lacks fees/revenue, and the model does not use them.
6. Growth is clamped from -60% to +120%; the snapshot includes an outlier near +4,448.47%. Missing growth uses 0% and is flagged.
7. Pre-token means no token was recorded in the snapshot; it does not prove a protocol has no token.
8. Implied value is a model proxy, not actual market cap, FDV, token price or an airdrop prediction.
9. Gas is an offline assumption: Ethereum $2–20 per transaction; chains named Arbitrum, Optimism, Base, Polygon, BSC, Avalanche or Solana $0.01–1; others/unknown $0.10–5. Verify these estimates. Rewards, pools, assets and access are unverified. Bridge/swap/protocol fees are unknown; capital and loss risk are separate from gas.
10. Age is UTC days from listed_at to as_of, not founding age; missing/invalid age uses 365 days and negative age is clamped to zero. Plans reuse the same capital rather than adding it six times.

## Artifacts and provenance

- out/board.json, out/data.js, out/dashboard/, out/screenshots/, out/dossier.json are kit-designated generated locations.
- dashboard/ contains plain HTML/CSS/JavaScript; vendor/makefun-board.ts remains byte-identical to the official helper.
- [Board screenshot](screenshots/board.png), [detail screenshot](screenshots/detail.png), [filtered screenshot](screenshots/filtered.png): required capture targets; currently unavailable due tooling failures, not replaced by fabricated images.
- [Baseline](docs/rebuild-baseline.md) records both histories: published v3 83dab02 → baseline 351ea5a; operator-verified local-only 495e409 → 65c5f41 → db029aa. Snapshot, board and anchor blobs match across the two histories; ancestry differs. Anchor bytes and ownership claim remain unchanged.
- The new local commit extends baseline 351ea5afed06aa503a72ddf678a94096c591f380; its exact ID is in the final session report and `git log -1`. No history is rewritten.
- The real session transcript path and all measured results are in docs/verification.md. The operator will bundle the session after review. No bundle, push, init, record or submit is run here.

Repository: https://github.com/yx9mio/token-radar-01. Existing submission: 01a1e325-94ac-776f-a053-efd2daf63fef. Deadline: 2026-12-14T10:00:00Z; prizes $1,000 first / $1,325 total; entry fee $0. Existing .makefun/owner.json is retained; no full wallet is inferred from D8BEXSQ5. Authorized keypair stays outside the repository.

Repository About target (remote update pending): `Offline token research dashboard with frozen valuation rankings, transparent methodology, and English farm plans.`
