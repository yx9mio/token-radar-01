# Rebuild baseline — mandatory preflight

Recorded before implementation on 2026-11-16 in the one active Codex session. Working tree was clean, branch main, HEAD `351ea5afed06aa503a72ddf678a94096c591f380`. No AGENTS.md was found. Sources: repository files, Git objects/history, installed kit CLI help and competition.yaml; operator-verified facts in this session's task where explicitly indicated.

## Provenance

Published history root: `11fd8927b2bd5f382e8221496582f23fc3aaf03c`. Submitted v3 `83dab02082b430d897ca4ead2c9ec2dbca2fcac8` exists and is the direct parent of HEAD. HEAD adds only `input/snapshot.json` and `out/board.json`. Its model/methodology are those of submitted v3. The anchor existed earlier in the published history (commit cfcd3b7).

Operator verified a separate, never-pushed sandbox history: root `495e409d884ce9701e79f76a15c6cb8e3fae6954`, then `65c5f41`, then `db029aa`, which force-added the validated snapshot and board. The root and 65c5f41 are absent here, verified with git cat-file; that is expected, not missing provenance. The TASK's longer repeated `...15e79f76...` anchor identifier is a transcription error; the correct sandbox root is the operator-verified identifier above. The two histories share the same freshness blob and validated artifact bytes, not Git ancestry. Do not recreate either history.

Verified blobs: snapshot `498d260b550f11e2bef3817ac8a70407a30480ac`; board `8263cd606eba78aa88273a8e3f542983babafb3f`; freshness `064ea8a21939c91f15e13b8e67cf6e601c7aedcb`. These match the operator's earlier-sandbox evidence. The existing history supports a normal child commit.

| Path | SHA-256 before implementation |
| --- | --- |
| input/snapshot.json | 42a71213519479f3a180cc5010cbbf6bd18a2447fa0ad29e4c5122b6c9184393 |
| out/board.json | 5559d303b7127d94e0f00ad4e66deef6b129a35b8115446054f741c1ffc85e88 |
| .makefun/freshness.json | 792210e1c0b0613a01280eb8a41acb8ef323c7f6a8507d8191f0829e61dc67ba |

Freshness SHA-256 also matches submitted v3. Round 34002550; drand quicknet chain `52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971`. Wallet content is retained unchanged, not reproduced here. Existing `.makefun/owner.json` has the kit-required {wallet: address} schema and is preserved, not inferred from short identifier D8BEXSQ5. Authorized keypair exists at `/home/agent/.makefun/keypair.json`, mode 600; contents never read into product artifacts.

## Recovered implementation and artifact contract

`lib/model.ts`: parseSnapshot, ageDays, comparables, multipleFor, score, plan, buildRadar. `dashboard/index.html`: authoritative existing methodology and ten limitations. `main.ts`: entrypoint. `vendor/makefun-board.ts`: unmodified official dossier helper. Output locations: `out/board.json`, `out/data.js`, `out/dashboard/`, `out/screenshots/`, `out/dossier.json`. Grading defaults /input/snapshot.json and /output. Dossier required keys cover, images, schema, text.

Snapshot object keys: as_of, source, floor_usd, protocols, watchlist. 758 protocols; watchlist is 40 slug references into that array, not 40 additional records. Reference date `2026-11-14`; source `DefiLlama https://api.llama.fi/protocols, fetched 2026-11-14T01:18:33.201Z`; floor_usd 50000000. Live set is derived, not separately fetched: 416 records failing isPreToken. isPreToken requires mcap_usd === null AND gecko_id === null AND symbol === null.

Immutable baseline is the exact committed `351ea5a:out/board.json` (200 complete rows), to be preserved as `docs/baseline-board.json` before generating new output. It includes every stable slug, cohort, rank, source input, substitution flag and numeric model field. Frozen checks compare against this full artifact using exact integer/decimal equality, never a tolerance.

## Exact model behavior

Eligible peers: !isPreToken(p), Number.isFinite(p.mcap_usd), p.mcap_usd > 0, Number.isFinite(p.tvl_usd), p.tvl_usd > 0. No CEX, version or early filter applies to peers. 128 eligible records; whole-market median 0.21380325885644053. Category matching is case-sensitive exact string equality, with null mapped to Unclassified. Median sorts ascending numerically; even count uses arithmetic mean of the two central numbers. Category median when n >= 3; otherwise whole-market median. Final multiple `clamp(raw,.05,.60)`.

Exact growth expression: `const growth=clamp(p.change_7d??0,-60,120), gm=1+growth/100*.5`. Input units are percentage points of 7-day TVL change. Clamp endpoints -60 and 120; factor range 0.7 to 1.6. Missing/nonfinite parsed change becomes null and substitutes 0%; growth_substituted is p.change_7d === null. Observed zero is not substituted.

Exact maturity expression: `observed=ageDays(asOf,p.listed_at), age=observed??365`; `mm=.6+Math.min(age,1095)/1095*.4`. ageDays uses valid YYYY-MM-DD calendar dates at UTC midnight, floors elapsed milliseconds / 86400000 and clamps negative age to 0. Reference date is snapshot as_of, never wall-clock. Invalid/missing date substitutes 365 days and age_substituted=true. Age cap 1095; maturity endpoints 0.6 and 1.0. There is no chains/breadth factor.

`base=p.tvl_usd*m.multiple`; `raw=Math.max(1,Math.round(base*gm*mm))`. JavaScript binary64 arithmetic, no intermediate display rounding; final raw dollars are rounded with Math.round. Sort raw values descending, ties by slug code-unit ascending. Traverse from bottom to top, setting each value to max(own value, next value + 1); record the adjustment separately. Assign rank i+1 after this. Validated board has no value collisions or adjustments. Canonical values strictly decrease. No disagreement between implementation and methodology found.

Membership: all watchlist first; then non-watchlist isRankable pre-token protocols below floor, ordered TVL descending then slug, take 160. isRankable excludes category CEX and names ending version markers matched by `/\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/`. Final canonical order is value order, not cohort order.

## Existing capital and plan rules

Four tiers: TVL >= 5,000,000,000 => $250; >= 1,000,000,000 => $150; >= 100,000,000 => $100; otherwise $50. Hold age <180 days =>60 days; age 180 through 365 inclusive =>45 days; age >365 =>30 days. Younger protocols deliberately get longer guidance. Exactly six steps reuse the same budget. Category actions remain conditional on actual support/access. First source chain determines gas assumption: Ethereum 2–20 USD/transaction; names matching Arbitrum|Optimism|Base|Polygon|BSC|Avalanche|Solana use 0.01–1; others/unknown 0.10–5. Protocol, bridge and swap fees unknown. Weekly monitoring, rewards verification, journal, risk and exit guidance retained. New second position must be a smaller allocation within that budget.

## Ten translated existing limitations

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

## Kit commands and session boundary

Discovered from installed CLI help (cli/makefun.mjs lines 309355 onward): `node cli/makefun.mjs check --kit . --repo ../token-radar-01 --worktree --json`, run inside `/home/agent/workspace/token-radar-01-kit`. Failed: `makefun check: git -C: spawnSync git EPERM`. Required retry from repo: `node ../token-radar-01-kit/cli/makefun.mjs check --kit ../token-radar-01-kit --repo . --worktree --json`. Result is recorded in verification. Official board gate is 100–4000 rows, <=8 MiB, snapshot slug, nonempty name, positive integer rank and implied dollars <=1e14; 3–12 steps, 20–600 trimmed characters. This task strengthens that to 200 and six steps.

CLI submission help uses `submit --competition <slug> (--repo-url <url> | --source <dir>) --commit <sha> --bundle <transcript> --title <name> --keypair <file>`; source flow creates a Git bundle itself. No explicit update-ID flag appears in that help; authenticated update semantics must be confirmed by operator before submission. This session explicitly forbids submit, bundle, push, init and record; they will not run. Repository About target is documented in README for operator application if remote access is unavailable.

Per operator verification the competition accepts transcript uploads, not live recordings (record returned HTTP 400). Current live harness rollout exists and grows at `/home/agent/.codex/sessions/2026/11/16/rollout-2026-11-16T11-00-32-01a1e404-0b92-7dd2-9989-12a82cf98c75.jsonl`. This is the actual session record, not manufactured. Operator will bundle it after this session; no transcript copied into product. New commit is local only.
