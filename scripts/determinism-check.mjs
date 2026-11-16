import {mkdtempSync,readFileSync,readdirSync,statSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
// Import the actual entrypoint twice with distinct module URLs; no child-process/network dependency.
const runDirectory=mkdtempSync(join(tmpdir(),'token-radar-determinism-')),originalArgv=process.argv;
try{
 for(const run of ['a','b']){process.argv=[process.execPath,'main.ts','--input','input/snapshot.json','--output',join(runDirectory,run)];await import(new URL('../main.ts?run='+run,import.meta.url));}
 const hashes=dir=>Object.fromEntries(readdirSync(dir,{recursive:true}).sort().filter(f=>statSync(join(dir,f)).isFile()).map(f=>[f,createHash('sha256').update(readFileSync(join(dir,f))).digest('hex')]));
 const a=hashes(join(runDirectory,'a')),b=hashes(join(runDirectory,'b'));assert.deepEqual(a,b);assert.equal(a['board.json'],createHash('sha256').update(readFileSync('out/board.json')).digest('hex'));
 mkdirSync('reports',{recursive:true});writeFileSync('reports/determinism.json',JSON.stringify({passed:true,method:'two actual entrypoint builds, byte-identical SHA-256 for every output',files:a},null,2));console.log('PASS: two full builds are byte-identical.',JSON.stringify(a));
}finally{process.argv=originalArgv;rmSync(runDirectory,{recursive:true,force:true});}
