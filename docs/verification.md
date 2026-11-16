# Verification — Token Radar v5

Executed 2026-11-16 in the current single Codex session. This is an implemented local draft, **not a completed or submitted v5 release**. Browser acceptance, new screenshots, remote metadata and local commit are blocked as detailed below. No previously reported pass or skip is relabeled as a new result.

## Mandatory preflight and preserved source

Preflight completed and docs/rebuild-baseline.md was written before source changes. Initial working tree was clean on main at 351ea5afed06aa503a72ddf678a94096c591f380, direct child of submitted v3 83dab02082b430d897ca4ead2c9ec2dbca2fcac8. Snapshot and validated board match the operator-provided earlier-sandbox SHA-256 values and Git blobs. Local-only 65c5f41 and 495e409 are absent as expected, not substituted or recreated. Both histories and the supplied malformed anchor text are explained in the baseline.

The immutable docs/baseline-board.json is byte-identical to the original board. input/snapshot.json, .makefun/freshness.json, .makefun/owner.json and vendor/makefun-board.ts remain unchanged. No data fetches occurred. Keypair presence and mode 600 were checked using stat only; its contents were never printed or copied.

## Commands and actual results

| Command | Actual result |
| --- | --- |
| `node main.ts --input input/snapshot.json --output out` | PASS: 758 protocols, 200 board, 40 watchlist, 160 early, 416 live. Warns that dossier images are legacy, not v5 acceptance captures. |
| `node scripts/model-check.mjs` | PASS: every original non-prose field matches immutable baseline exactly, including all model numbers, ranks, ordering, source records, chains, cohorts and substitution flags. Frozen implied dollars compare as BigInt; every original numeric JSON lexeme is also compared as a normalized exact decimal, no binary64 tolerance. Snapshot, baseline and anchor hashes match. |
| `node scripts/artifact-check.mjs --data-only` | PASS: seven data gates listed below; dossier exactly matches official buildDossier helper. Does not claim screenshot acceptance. |
| `sh scripts/language-check.sh` | PASS: NFC-normalized UTF-8 grep with decoded JSON strings; match/no-match/error exits distinguished. Product HTML/CSS/JS, generated dashboard and decoded data.js/board/dossier strings, model and verification sources, README, handoff and all shipped Markdown docs scanned. Manual prose review found English instructions and labels. |
| `node scripts/determinism-check.mjs` | PASS: two actual main.ts builds; every output path and SHA-256 identical; board also equals out/board.json. No clock/network/random inputs. Detailed hashes in reports/determinism.json. |
| `node --check dashboard/app.js` and script syntax checks | PASS. |
| `git diff --check` | PASS. |
| `node scripts/ui-check.mjs` | BLOCKED before browser tests: `listen EPERM: operation not permitted 127.0.0.1`. No passing browser report or new screenshots. |
| Standalone installed Playwright Chromium launch | BLOCKED: installed chrome-headless-shell exits 127 because `libglib-2.0.so.0` is missing. ldd also reports missing gobject, nspr, nss, gio, atk, dbus, X11/composite/damage/ext/fixes/randr, gbm, xcb, xkbcommon, asound and atspi libraries. No reinstallation performed: it cannot fix the separately denied socket operation. |
| `node scripts/artifact-check.mjs` | FAIL, correctly: expected board.png/detail.png/filtered.png; current files are historical 1-board.jpg/2-detail.jpg/3-filtered.jpg. This is not a passed release gate. |
| `git add README.md` | BLOCKED: `fatal: Unable to create '/home/agent/workspace/token-radar-01/.git/index.lock': Read-only file system`. No commit created. Approval policy is never and .git is explicitly read-only, so no permission bypass attempted. |

Node 22.18.0 and the supplied Playwright 1.65.1 installation were used; no packages or replacement browser were installed. Listening on 0.0.0.0 also failed EPERM; Python socket creation failed EPERM. This establishes a sandbox permission blocker, not a dashboard test failure.

Official kit command, from /home/agent/workspace/token-radar-01-kit:

```sh
node cli/makefun.mjs check --kit . --repo ../token-radar-01 --worktree --json
```

Actual exit 1: `makefun check: git -C: spawnSync git EPERM`.

Required relative-path retry, from repository:

```sh
node ../token-radar-01-kit/cli/makefun.mjs check --kit ../token-radar-01-kit --repo . --worktree --json
```

Actual exit 1, same exact error. The previously reported ok:true / 15 passes / 6 skips belongs to an earlier session and is not this result. Per the operator's explicit instruction this spawn failure does not prevent implementation; operator runs the official check independently afterward. The seven gates below are separate local checks against the official published artifact contract, not a fabricated official-kit pass.

## Seven explicit data gates

1. board.json satisfies the kit's board schema/structure: snapshot slugs, nonempty names, positive integer ranks/dollars, bounded values, unique identifiers and size below 8 MiB.
2. Exactly 200 rows.
3. Exactly 40 watchlist and 160 early rows; complete watchlist coverage.
4. Exactly six steps per row, each trimmed length 20–600; this also satisfies official 3–12-step gate.
5. Dossier has cover, images, schema and text; bytes match buildDossier. Its current images are **stale v3**, so this structural pass does not imply screenshot acceptance or English visual acceptance.
6. All canonical implied values strictly decrease.
7. All canonical implied values are unique.

Conviction tests cover zero, one and two substitutions, each individual substitution, observed zero growth, distinct-chain deduplication, and the TVL boundary. Real board includes 188 rows with zero substitutions and 12 with one; no real row has two, so the two-substitution case uses a synthetic model-only edge case. No acceptance screenshot or browser data is synthetic. Multi-chain steps select the second distinct chain in source order; single-chain steps repeat on the same chain. Tests preserve all capital/hold boundaries and enforce allocation within the original tier budget.

Language scanning excludes the unchanged raw snapshot, immutable historical baseline board, Git history, the detector pattern itself and actual session transcript. They are provenance, never rendered prose. Source names retain machine identities; the UI creates ASCII display labels. The obsolete historical scripts/implement.py generator was removed so it cannot regenerate the old product. Existing screenshot images are explicitly not claimed to pass English visual review.

## Browser plan and artifacts

scripts/ui-check.mjs serves the actual built output without data interception. Implemented acceptance assertions cover widths 375/768/1024/1440, search and combined filters, reset, empty state, all supported sorts in both directions, conviction rank ties, initial hashes, duplicates/invalid/malformed hashes, unknown/hidden slugs, injection content treated as data, back/forward restoration, search history debounce, dialogs/keyboard/focus, peers, fixed combined KPI/category chart and reduced motion. These assertions are **written but not executed past HTTP startup**, not claimed as passed. Runtime request isolation, console cleanliness, accessible behavior and layout remain unverified in a real browser.

Intended screenshot targets, not produced in this session:

- screenshots/board.png: 1440 × 1000 default board.
- screenshots/detail.png: 1440 × 1000, real multi-chain protocol `steakhouse-financial`, first canonical row with at least two distinct chains.
- screenshots/filtered.png: 1440 × 1000, category Lending and cohort early, nonempty real board.

Historical screenshots/1-board.jpg, screenshots/2-detail.jpg and screenshots/3-filtered.jpg are unchanged prior v3 captures. They are retained only because the existing build requires three images; current dossier faithfully includes them with a build warning. Never represent them as new v5 captures. Once all three genuine PNGs exist, main.ts selects them and removes obsolete output image copies; the successful UI check removes legacy source JPGs. Rebuild afterward to update the dossier. Full artifact check then verifies PNG signatures, 1440 × 1000 dimensions, count and byte caps.

Artifact locations: out/board.json, out/data.js, out/dashboard/index.html, out/dashboard/app.css, out/dashboard/app.js, out/dossier.json, out/screenshots/. reports/model.json, reports/artifacts.json, reports/determinism.json and reports/ui.json hold actual local results; they are ignored transient reports, with this document preserving their meaning.

## Publication and real session record

Repository URL: https://github.com/yx9mio/token-radar-01. No push, init, record, makefun bundle or makefun submit was run. No transcript or source bundle was created. No update to submission 01a1e325-94ac-776f-a053-efd2daf63fef was made; there is no new receipt. Operator explicitly reserved these actions for after review. Existing repository About description is not remotely changed in this network-restricted session; the exact required target is in README.

Local commit: **not created**, because .git is read-only (exact failure above). Working tree contains the implementation and generated artifacts. Original HEAD remains 351ea5afed06aa503a72ddf678a94096c591f380. A normal child commit is intended; history was not rewritten. The operator must make the working tree writable to Git, finish blocked browser verification/screenshots and official check, review changes and create the single authorized commit before release.

Actual harness transcript, observed present during preflight and recording this same session:

`/home/agent/.codex/sessions/2026/11/16/rollout-2026-11-16T11-00-32-01a1e404-0b92-7dd2-9989-12a82cf98c75.jsonl`

Per operator verification the competition takes uploaded transcript bundles, not sealed recordings. No recording API is invoked and no transcript is manufactured or copied into the product. The operator must retain and bundle the complete real session after this final response. The transcript includes the exact tooling failures and successful local checks.
