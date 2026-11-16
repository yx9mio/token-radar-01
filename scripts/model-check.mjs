import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {median,multipleFor,score,ageDays,buildRadar,parseSnapshot,convictionFor,plan} from '../lib/model.ts';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
assert.equal(hash('input/snapshot.json'),'42a71213519479f3a180cc5010cbbf6bd18a2447fa0ad29e4c5122b6c9184393');
assert.equal(hash('.makefun/freshness.json'),'792210e1c0b0613a01280eb8a41acb8ef323c7f6a8507d8191f0829e61dc67ba');
assert.equal(hash('docs/baseline-board.json'),'5559d303b7127d94e0f00ad4e66deef6b129a35b8115446054f741c1ffc85e88');
const baseline=JSON.parse(readFileSync('docs/baseline-board.json')).rows,board=JSON.parse(readFileSync('out/board.json')).rows;
// Preserve every decimal lexeme losslessly, allowing only mathematically identical representations.
function exactJSON(file){
 const canonical=token=>{let [mantissa,exponent='0']=token.toLowerCase().split('e');const negative=mantissa.startsWith('-');if(negative)mantissa=mantissa.slice(1);const [whole,fraction='']=mantissa.split('.');let coefficient=BigInt(whole+fraction)*(negative?-1n:1n),scale=BigInt(fraction.length)-BigInt(exponent);if(coefficient===0n)return '0';while(coefficient%10n===0n){coefficient/=10n;scale-=1n;}return coefficient.toString()+'e'+(-scale).toString();};
 return JSON.parse(readFileSync(file,'utf8').replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,token=>token.startsWith('"')?token:JSON.stringify({$exactDecimal:canonical(token)})));
}
const exactBaseline=exactJSON('docs/baseline-board.json').rows,exactBoard=exactJSON('out/board.json').rows;
for(let i=0;i<200;i++)for(const key of Object.keys(exactBaseline[i]))if(!['farm_steps','fees','risk'].includes(key))assert.deepEqual(exactBoard[i][key],exactBaseline[i][key],`Lossless decimal preservation: ${i} ${key}`);

// All model dollar values are exact safe integers: compare BigInt, never a tolerance.
const prose=new Set(['farm_steps','fees','risk']);
assert.equal(board.length,200);assert.equal(board.filter(r=>r.cohort==='watchlist').length,40);assert.equal(board.filter(r=>r.cohort==='early').length,160);
for(let i=0;i<200;i++){const a=baseline[i],b=board[i];assert.equal(a.slug,b.slug);assert.equal(BigInt(a.implied_value_usd),BigInt(b.implied_value_usd));assert.equal(a.rank,b.rank);for(const key of Object.keys(a))if(!prose.has(key))assert.deepEqual(b[key],a[key],`${a.slug}: ${key}`);assert.equal(b.conviction,convictionFor(b));assert.equal(b.farm_steps.length,6);assert(b.farm_steps.every(s=>s.trim().length>=20&&s.trim().length<=600));const chains=[...new Set(b.chains)];assert(b.farm_steps[2].includes(chains.length>=2?'second chain, '+chains[1]:'same chain, '+(chains[0]??'Unspecified chain')));assert(b.farm_steps[2].includes('within the same $'+b.capital_usd));if(i)assert(board[i-1].implied_value_usd>b.implied_value_usd);}
assert.equal(new Set(board.map(r=>r.implied_value_usd)).size,200);
const s=parseSnapshot(readFileSync('input/snapshot.json','utf8'));assert.deepEqual(board,buildRadar(s).board);
assert.equal(median([4,1,3,2]),2.5);assert.equal(median([3,1,2]),2);
const c={count:3,global:.2,categories:{two:{n:2,median:3},three:{n:3,median:.3},low:{n:3,median:.01},high:{n:3,median:8}}};
assert.equal(multipleFor('two',c).multiple,.2);assert.equal(multipleFor('three',c).multiple,.3);assert.equal(multipleFor('low',c).multiple,.05);assert.equal(multipleFor('high',c).multiple,.6);
for(const [ageSub,growthSub,expected] of [[false,false,100],[true,false,80],[false,true,80],[true,true,70]])assert.equal(convictionFor({age_substituted:ageSub,growth_substituted:growthSub,model:{source:'category',comparable_count:3},chains:['A','A','B'],tvl_usd:1e8}),expected);
const p={tvl_usd:1000,change_7d:0,listed_at:null,category:'two'};assert.equal(score(p,s.as_of,c).growth_substituted,false);assert.equal(score({...p,change_7d:null},s.as_of,c).growth_substituted,true);assert.equal(score({...p,change_7d:4448.47},s.as_of,c).model.growth_pct,120);assert.equal(score({...p,change_7d:-1000},s.as_of,c).model.growth_pct,-60);assert.equal(ageDays(s.as_of,'2026-02-30'),null);assert.equal(ageDays(s.as_of,'2027-01-01'),0);
for(const [tvl,capital] of [[5e9,250],[1e9,150],[1e8,100],[99999999,50]])for(const [age,hold] of [[179,60],[180,45],[365,45],[366,30]]){const result=plan({tvl_usd:tvl,age_days:age,chains:['Ethereum'],category:'Lending'});assert.equal(result.capital_usd,capital);assert.equal(result.hold_days,hold);}
mkdirSync('reports',{recursive:true});writeFileSync('reports/model.json',JSON.stringify({passed:true,rows:200,watchlist:40,early:160,exact_values_and_ranks:true,all_original_nonprose_fields:true,lossless_decimal_lexemes:true,snapshot_and_anchor_unchanged:true,conviction_substitution_cases:[0,1,2],observed_zero:true,strict_decrease:true,unique_values:true,farm_steps:'six, 20–600 characters; single/multiple chain; budget preserved'},null,2));console.log('PASS: exact frozen values, ranks, original fields, provenance, conviction and farm plans.');
