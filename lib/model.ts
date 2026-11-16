export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

export const compareSlug = (a,b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
export const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
export function median(xs) { const a=[...xs].sort((a,b)=>a-b); if(!a.length) throw Error('No comparables'); const i=Math.floor(a.length/2); return a.length%2?a[i]:(a[i-1]+a[i])/2; }
export function isPreToken(p) { return p.mcap_usd===null && p.gecko_id===null && p.symbol===null; }
export function isRankable(p) { return isPreToken(p) && p.category!=='CEX' && !/\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/.test(p.name); }
export function ageDays(asOf,listed) {
 const valid=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s+'T00:00:00Z')) && new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 return valid(asOf)&&valid(listed)?Math.max(0,Math.floor((Date.parse(asOf+'T00:00:00Z')-Date.parse(listed+'T00:00:00Z'))/86400000)):null;
}
export function comparables(snapshot) {
 const valid=snapshot.protocols.filter(p=>!isPreToken(p)&&Number.isFinite(p.mcap_usd)&&p.mcap_usd>0&&Number.isFinite(p.tvl_usd)&&p.tvl_usd>0);
 const global=median(valid.map(p=>p.mcap_usd/p.tvl_usd)); const groups={};
 for(const p of valid) (groups[p.category??'Unclassified']??=[]).push(p.mcap_usd/p.tvl_usd);
 return {count:valid.length,global,categories:Object.fromEntries(Object.keys(groups).sort().map(k=>[k,{n:groups[k].length,median:median(groups[k])}]))};
}
export function multipleFor(category,c) { const g=c.categories[category??'Unclassified']; const n=g?.n??0; const raw=n>=3?g.median:c.global; return {comparable_count:n,source:n>=3?'category':'global fallback',median_before_clamp:raw,multiple:clamp(raw,.05,.60)}; }
export function score(p,asOf,c) {
 const m={...multipleFor(p.category,c),global_comparable_count:c.count,global_median:c.global}, observed=ageDays(asOf,p.listed_at), age=observed??365;
 const growth=clamp(p.change_7d??0,-60,120), gm=1+growth/100*.5, mm=.6+Math.min(age,1095)/1095*.4, base=p.tvl_usd*m.multiple;
 const raw=Math.max(1,Math.round(base*gm*mm));
 return {...p,age_days:age,age_substituted:observed===null,growth_substituted:p.change_7d===null,model:{...m,base,growth_pct:growth,growth_multiplier:gm,maturity_multiplier:mm,raw_implied_value_usd:raw,tie_adjustment_usd:0},implied_value_usd:raw};
}
export function convictionFor(p) {
 const substitutions=Number(p.age_substituted)+Number(p.growth_substituted);
 return clamp(60+(p.model.source==='category'&&p.model.comparable_count>=3?15:0)+(substitutions===0?10:-10*substitutions)+(new Set(p.chains).size>=2?5:0)+(p.tvl_usd>=100000000?10:0),0,100);
}
export function plan(p) {
 const capital=p.tvl_usd>=5e9?250:p.tvl_usd>=1e9?150:p.tvl_usd>=1e8?100:50;
 const hold=p.age_days<180?60:p.age_days<=365?45:30;
 const chains=[...new Set(p.chains)],chain=chains[0]??'Unspecified chain';
 const gas=chain==='Ethereum'?'2–20':/Arbitrum|Optimism|Base|Polygon|BSC|Avalanche|Solana/.test(chain)?'0.01–1':'0.10–5';
 const c=p.category??'';
 let action='verify the official deposit, staking or usage flow before transacting; skip it if you cannot verify support';
 if(/Lending|CDP|Collateral/.test(c)) action='supply a supported asset or open a collateral position; avoid borrowing without understanding liquidation';
 else if(/Dexs|Yield|Leveraged Farming/.test(c)) action='deposit into a suitable supported pool or provide liquidity after checking impermanent loss';
 else if(/Bridge/.test(c)) action='bridge a supported asset and use it in the app if available, after verifying the destination chain';
 else if(/Staking|Restaking|Restaked/.test(c)) action='stake a suitable supported asset and retain the receipt after checking the unbonding period';
 else if(/Perpetual|Derivatives/.test(c)) action='deposit margin; consider only a small hedge if a suitable instrument exists, avoiding leverage';
 else if(/Prediction/.test(c)) action='deposit funds and open a small position in a supported market';
 else if(/Curators|Allocator/.test(c)) action='deposit into a managed vault and retain shares after checking curator permissions';
 else if(/RWA/.test(c)) action='mint or buy a supported yield asset only if access and legal requirements are met';
 else if(/Stablecoin/.test(c)) action='mint, wrap or deposit a supported stablecoin after checking depeg risk';
 else if(/Insurance/.test(c)) action='buy suitable cover after checking exclusions and retain the policy';
 const repeat=chains.length>=2?'Repeat a smaller supported position on the second chain, '+chains[1]+'.':'Make a second smaller deposit on the same chain, '+chain+', only if supported.';
 const steps=[
 `Prepare a separate wallet and keep its seed offline; verify ${chain} before acting. Budget $${capital} total capital and estimated gas of $${gas} per transaction. Allow 10 minutes.`,
 `On ${chain}, use part of the $${capital} budget to ${action}, only if supported and accessible; otherwise skip. Estimated gas: $${gas} per transaction; allow 20 minutes. Bridge, swap and protocol fees are unknown.`,
 `${repeat} This is an allocation within the same $${capital} total budget, not extra capital. Verify assets and access first; skip if unavailable. Check positions weekly; avoid purposeless transactions. Reading costs no gas; transaction gas must be verified.`,
 `Hold the supported position for ${hold} days, monitoring contract, asset and exit risks; leave earlier if risk increases. The $${capital} capital is at risk. Reading costs no gas; allow estimated $${gas} gas for withdrawal on ${chain}.`,
 `Check official points or rewards pages if they exist; never pay a claim-unlock fee or send funds to supposed support staff. Keep capital within $${capital}. Reading costs no gas; a legitimate claim on ${chain} may cost estimated $${gas}. Allow 10 minutes weekly.`,
 `Log the $${capital} budget, transactions, gas and time. Finish after ${hold} days or earlier if risk rises. Logging costs no gas; withdrawal on ${chain} may cost estimated $${gas}. Allow 10 minutes. Other fees and rewards remain unverified.`
 ];
 return {capital_usd:capital,hold_days:hold,gas_assumption_usd:gas,fees:'Bridge, swap and protocol fees are unknown; gas is an offline assumption.',risk:action,farm_steps:steps};
}
export function buildRadar(snapshot) {
 const c=comparables(snapshot), watch=new Set(snapshot.watchlist), chosen=snapshot.watchlist.map(slug=>{const p=snapshot.protocols.find(p=>p.slug===slug);if(!p||!isPreToken(p))throw Error('Invalid watchlist');return p;});
 const early=snapshot.protocols.filter(p=>!watch.has(p.slug)&&isRankable(p)&&p.tvl_usd<snapshot.floor_usd).sort((a,b)=>b.tvl_usd-a.tvl_usd||compareSlug(a,b)).slice(0,200-chosen.length);
 if(chosen.length+early.length!==200)throw Error('Insufficient rows');
 const board=[...chosen,...early].map(p=>({...score(p,snapshot.as_of,c),cohort:watch.has(p.slug)?'watchlist':'early',token_status:'pre-token'})).sort((a,b)=>b.implied_value_usd-a.implied_value_usd||compareSlug(a,b));
 for(let i=board.length-2;i>=0;i--) { const p=board[i];p.implied_value_usd=Math.max(p.implied_value_usd,board[i+1].implied_value_usd+1);p.model.tie_adjustment_usd=p.implied_value_usd-p.model.raw_implied_value_usd; }
 board.forEach((p,i)=>{p.rank=i+1;Object.assign(p,plan(p));p.conviction=convictionFor(p);});
 const live=snapshot.protocols.filter(p=>!isPreToken(p)).map(p=>({...p,age_days:ageDays(snapshot.as_of,p.listed_at),ratio:p.mcap_usd>0&&p.tvl_usd>0?p.mcap_usd/p.tvl_usd:null})).sort((a,b)=>(b.mcap_usd??-1)-(a.mcap_usd??-1)||compareSlug(a,b));
 return {board,radar:{as_of:snapshot.as_of,source:snapshot.source,comparables:c,rows:board,live,early_size:early.length,live_size:live.length}};
}
export class SnapshotError extends Error {}
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}


export function boardIssue(board,snapshot) {
 if(board.length!==200||new Set(board.map(p=>p.slug)).size!==200)return 'row count/duplicates';
 if(snapshot.watchlist.some(s=>!board.some(p=>p.slug===s)))return 'coverage';
 for(let i=0;i<board.length;i++){const p=board[i];if(p.rank!==i+1||!Number.isSafeInteger(p.implied_value_usd)||p.implied_value_usd<=0||p.implied_value_usd>1e14||(i&&board[i-1].implied_value_usd<=p.implied_value_usd))return 'rank/value';if(p.farm_steps.length!==6||p.farm_steps.some(s=>s.trim().length<20||s.trim().length>600))return 'farm';}return null;
}
export function dataScript(radar) {return 'window.RADAR='+JSON.stringify(radar).replace(/</g,'\\u003c')+';\n';}
