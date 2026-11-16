// STRATA: deterministic snapshot valuation. Runtime dependencies: Node standard library and kit helper.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

function arg(name: string, fallback: string): string {
  const at = process.argv.indexOf(`--${name}`);
  if (at >= 0 && at + 1 < process.argv.length) return process.argv[at + 1]!;
  const found = process.argv.find(a => a.startsWith(`--${name}=`));
  return found === undefined ? fallback : found.slice(name.length + 3);
}
const here = fileURLToPath(new URL('.', import.meta.url));
const inputArg = arg('input', '/input');
const inputFile = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
const output = arg('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
if (!existsSync(inputFile)) throw new Error('Missing snapshot: mount /input or pass --input');
const snapshot = parseSnapshot(readFileSync(inputFile, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const issue = boardIssue(board, snapshot);
if (issue !== null) throw new Error(`Invalid computed board: ${issue}`);
mkdirSync(output, { recursive: true });
writeFileSync(join(output, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(output, 'data.js'), dataScript(radar));

function copyFlatDirectory(name: string): string[] {
  const source = join(here, name), target = join(output, name);
  mkdirSync(target, { recursive: true });
  const files = readdirSync(source).filter(f => !f.startsWith('.')).sort();
  for (const file of files) {
    if (!/^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/.test(file)) throw new Error(`Invalid artifact name: ${file}`);
    if (!statSync(join(source, file)).isFile()) throw new Error(`Expected flat file: ${file}`);
    copyFileSync(join(source, file), join(target, file));
  }
  return files;
}
copyFlatDirectory('dashboard');
const screenshots = copyFlatDirectory('screenshots');
if (screenshots.length !== 3) throw new Error('Exactly three final screenshots required');
// The helper reads only dashboard/ and screenshots/, so rebuilding never includes dossier.json itself.
writeFileSync(join(output, 'dossier.json'), buildDossier(output, { text_max_bytes: 65536 }));
process.stdout.write(`STRATA: ${snapshot.protocols.length} protocols; ${board.length} rows; ${snapshot.watchlist.length} watchlist; ${radar.early_size} early; ${radar.live_size} live-token.\n`);
