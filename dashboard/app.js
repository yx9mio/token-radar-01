'use strict';
const $=id=>document.getElementById(id), D=window.RADAR;
const display=s=>String(s??'Unclassified').normalize('NFKD').replace(/[^\x00-\x7F]/g,c=>c.codePointAt(0)===272?'D':c.codePointAt(0)===273?'d':'');
const money=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n):'Not available';
const compact=n=>Number.isFinite(n)?'$'+(Math.abs(n)>=1e9?(n/1e9).toFixed(2)+'B':Math.abs(n)>=1e6?(n/1e6).toFixed(1)+'M':Math.abs(n)>=1e3?(n/1e3).toFixed(1)+'K':n.toLocaleString('en-US')):'Not available';
const pct=n=>Number.isFinite(n)?(n>0?'+':'')+n.toFixed(2)+'%':'Not available';
const age=n=>n==null?'Not available':n<365?n+'d':(n/365).toFixed(1)+'y';
const fields={implied:'implied_value_usd',tvl:'tvl_usd',change7d:'change_7d',age:'age_days',conviction:'conviction'};
const defaults={q:'',cat:'',chain:'',cohort:'',view:'pretoken',sort:'implied',dir:'desc',slug:''};
let state={...defaults}, searchTimer, invoker=null, applying=false;
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function sourceRows(){return state.view==='pretoken'?D.rows:D.live;}
function category(r){return r.category??'Unclassified';}
function values(key){return [...new Set(sourceRows().flatMap(r=>key==='cat'?[category(r)]:key==='chain'?r.chains:state.view==='pretoken'?[r.cohort]:[r.ratio!==null?'eligible':'ineligible']))].sort();}
function tip(node,text){node.classList.add('tooltip');node.tabIndex=0;node.dataset.tip=text;node.setAttribute('aria-label',text);node.title=text;return node;}
function setOptions(id,key,label){const select=$(id);select.replaceChildren();for(const value of ['',...values(key)]){const option=el('option',value?display(value):label);option.value=value;select.append(option);}select.value=state[key];}
function syncHash(replace=false){
 const params=new URLSearchParams();for(const key of Object.keys(defaults))if(state[key]!==defaults[key])params.append(key,state[key]);
 const hash=params.toString().replace(/\+/g,'%20'),url=location.pathname+location.search+(hash?'#'+hash:'');
 if(location.hash.slice(1)!==hash)history[replace?'replaceState':'pushState'](null,'',url);
}
function applyHash(){
 clearTimeout(searchTimer);applying=true;
 const params=new URLSearchParams(location.hash.slice(1));state={...defaults};
 for(const key of Object.keys(defaults)){const v=params.get(key);if(v!==null)state[key]=v;}
 if(!['pretoken','live'].includes(state.view))state.view='pretoken';
 for(const key of ['cat','chain','cohort'])if(!values(key).includes(state[key]))state[key]='';
 if(!Object.hasOwn(fields,state.sort)||(state.view==='live'&&state.sort==='conviction')){state.sort='implied';state.dir='desc';}
 if(!['asc','desc'].includes(state.dir))state.dir='desc';
 refresh();render();renderDetail();syncHash(true);applying=false;
}
function refresh(){
 $('search').value=state.q;setOptions('category','cat','All categories');setOptions('chain','chain','All chains');setOptions('cohort','cohort','All cohorts');
 $('pre').setAttribute('aria-pressed',String(state.view==='pretoken'));$('live').setAttribute('aria-pressed',String(state.view==='live'));
 $('context').textContent=state.view==='pretoken'?'Model ranks stay fixed while you explore. Select a protocol to inspect its inputs.':'Recorded tokens, not live prices. Market caps come from the same frozen snapshot.';
 $('valuehead').textContent=state.view==='pretoken'?'Implied value':'Market cap';$('convictionhead').hidden=state.view==='live';$('multiplehead').textContent=state.view==='pretoken'?'Multiple':'Market cap / TVL';
}
function scoreNode(r){const box=el('div',undefined,'score');box.setAttribute('aria-label',`Conviction: ${r.conviction} out of 100`);box.append(el('span',String(r.conviction),'numeric'));const track=el('div',undefined,'score-track'),fill=el('div',undefined,'score-fill');fill.style.width=r.conviction+'%';track.setAttribute('aria-hidden','true');track.append(fill);box.append(track);return box;}
function render(){
 const q=state.q.trim().toLowerCase();const rows=sourceRows().filter(r=>(display(r.name)+' '+r.slug).toLowerCase().includes(q)&&(!state.cat||category(r)===state.cat)&&(!state.chain||r.chains.includes(state.chain))&&(!state.cohort||(state.view==='pretoken'?r.cohort===state.cohort:(r.ratio!==null?'eligible':'ineligible')===state.cohort)));
 const field=state.sort==='implied'&&state.view==='live'?'mcap_usd':fields[state.sort],direction=state.dir==='asc'?1:-1;
 rows.sort((a,b)=>{const x=a[field],y=b[field];return(x==null?(y==null?0:1):y==null?-1:direction*(x-y))||((a.rank??Infinity)-(b.rank??Infinity))||(a.slug<b.slug?-1:a.slug>b.slug?1:0);});
 $('results').textContent=`${rows.length} / ${sourceRows().length} protocols`;$('sortlabel').textContent=`${state.sort==='implied'?(state.view==='live'?'Market cap':'Implied value'):state.sort==='change7d'?'7D change':state.sort[0].toUpperCase()+state.sort.slice(1)} · ${state.dir==='asc'?'ascending':'descending'}`;
 $('rows').replaceChildren();$('empty').hidden=rows.length>0;
 document.querySelectorAll('[data-sort]').forEach(b=>b.parentElement.setAttribute('aria-sort',b.dataset.sort===state.sort?(state.dir==='asc'?'ascending':'descending'):'none'));
 for(const r of rows){const tr=el('tr');tr.dataset.slug=r.slug;tr.append(el('td',r.rank??'—','numeric'));const name=el('td'),button=el('button',display(r.name),'protocol-button');button.dataset.slug=r.slug;button.onclick=()=>openDetail(r.slug,button);name.append(button,el('div',r.cohort??'recorded token','sub'));tr.append(name,el('td',display(category(r))),el('td',r.chains.map(display).join(', ')||'Unspecified'));
 tr.append(tip(el('td',compact(r.tvl_usd),'numeric'),money(r.tvl_usd)),el('td',pct(r.change_7d),r.change_7d==null?'numeric':r.change_7d>=0?'numeric up':'numeric down'),tip(el('td',age(r.age_days)+(r.age_substituted?' *':''),'numeric'),r.age_days==null?'Age not available':`${r.age_days} days${r.age_substituted?' (substituted)':''}`));
 if(r.model){const m=r.model;tr.append(tip(el('td',m.multiple.toFixed(3)+'×','numeric'),m.source==='category'?`${m.comparable_count} eligible category peers; category median with clamp [0.05, 0.60].`:`${m.comparable_count} eligible category peers; whole-market fallback with clamp [0.05, 0.60].`),tip(el('td',compact(r.implied_value_usd),'numeric'),money(r.implied_value_usd)));const score=el('td');score.append(scoreNode(r));tr.append(score);}else tr.append(el('td',r.ratio===null?'Not eligible':r.ratio.toFixed(3)+'×','numeric'),tip(el('td',compact(r.mcap_usd>0?r.mcap_usd:null),'numeric'),money(r.mcap_usd>0?r.mcap_usd:null)));
 $('rows').append(tr);}
 monoNumbers($('rows'));
}
function openDetail(slug,button){clearTimeout(searchTimer);state.q=$('search').value;invoker=button;state.slug=slug;syncHash();renderDetail();}
function closeDetail(){if(!state.slug&&!$('detail').open)return;state.slug='';syncHash();renderDetail();}
function peersFor(r){return D.live.filter(p=>category(p)===category(r)&&p.ratio!==null).sort((a,b)=>b.mcap_usd-a.mcap_usd||(a.slug<b.slug?-1:a.slug>b.slug?1:0)).slice(0,5);}
function renderDetail(){
 const r=[...D.rows,...D.live].find(r=>r.slug===state.slug),dialog=$('detail');$('notice').textContent=state.slug&&!r?'Protocol not found.':'';
 if(!r){if(dialog.open){dialog.close();const focus=invoker?.isConnected?invoker:$('search');focus.focus();}invoker=null;return;}
 const root=$('detailcontent');root.replaceChildren();root.append(el('p',r.rank?`PRE-TOKEN / MODEL RANK ${r.rank}`:'LIVE TOKEN / SNAPSHOT','eyebrow'),el('h2',display(r.name)));root.querySelector('h2').id='detailtitle';root.append(el('p',display(category(r))+' · '+(r.chains.map(display).join(' / ')||'Unspecified chain'),'sub'));
 if(r.model){const m=r.model,phrase=m.source==='category'?`${m.multiple.toFixed(3)}× ${display(category(r))} multiple`:`${m.multiple.toFixed(3)}× whole-market fallback multiple`;
 root.append(el('p',`Rank #${r.rank} because ${compact(r.tvl_usd)} of TVL at a ${phrase}, adjusted by momentum ${m.growth_multiplier.toFixed(3)} and maturity ${m.maturity_multiplier.toFixed(3)}, gives ${compact(r.implied_value_usd)} of implied value.`,'why'));}
 const grid=el('div',undefined,'detail-grid'),left=el('section'),right=el('section');grid.append(left,right);root.append(grid);left.append(el('div',money(r.model?r.implied_value_usd:r.mcap_usd),'detail-value'),el('p',r.model?'Implied value · model estimate':'Market cap · frozen snapshot','sub'));const dl=el('dl',undefined,'audit');const pair=(a,b)=>dl.append(el('dt',a),el('dd',String(b)));
 pair('TVL (USD)',r.tvl_usd);pair('Observed 7D change (%)',r.change_7d??'Missing');pair('Age (days)',r.age_days??'Missing');pair('Age provenance',r.age_substituted?'Substituted: 365 days':r.age_days==null?'Missing':'Observed UTC days');pair('Listed at',r.listed_at??'Missing');left.append(dl);
 if(r.model){const m=r.model;pair('Growth provenance',r.growth_substituted?'Substituted: 0%':'Observed, including zero');pair('Category peer count',m.comparable_count);pair('Whole-market peer count',m.global_comparable_count);pair('Whole-market median',m.global_median);pair('Multiple source',m.source==='category'?'Category median':'Whole-market fallback');pair('Median before clamp',m.median_before_clamp);pair('Exact multiple',m.multiple);pair('Base (USD)',m.base);pair('Clamped growth (%)',m.growth_pct);pair('Exact growth factor',m.growth_multiplier);pair('Exact maturity factor',m.maturity_multiplier);pair('Rounded formula (USD)',m.raw_implied_value_usd);pair('Tie adjustment (USD)',m.tie_adjustment_usd);pair('Frozen implied value (USD)',r.implied_value_usd);
 left.append(el('h3','Conviction'),scoreNode(r),el('p','Conviction measures data support, not investment success probability.','sub'),el('p','A model estimate, not a token price, guaranteed valuation or promised airdrop.','notice'),el('h3','Eligible live-token peers'));
 const peers=peersFor(r);if(peers.length){const list=el('ul',undefined,'peers');for(const p of peers){const li=el('li',display(p.name)+' · ');li.append(el('span',`${money(p.mcap_usd)} · ${p.ratio.toFixed(3)}×`,'peer-numbers'));li.dataset.slug=p.slug;list.append(li);}left.append(list);}else left.append(el('p','No eligible live-token peers in this category.'));
 right.append(el('h3','Farm plan · six steps'),el('p',`$${r.capital_usd} total capital · ${r.hold_days} days · reuse the same budget`,'numeric'));const list=el('ol',undefined,'plan');for(const s of r.farm_steps)list.append(el('li',s));right.append(list);
 }else{pair('Market cap / TVL',r.ratio??'Not eligible');right.append(el('p','Live tokens means the snapshot recorded a token. It does not mean real-time prices. Peers require finite, positive market cap and TVL.'));}
 monoNumbers(root);if(!dialog.open){dialog.showModal();$('detailclose').focus();}
}
function change(){clearTimeout(searchTimer);state.q=$('search').value;state.cat=$('category').value;state.chain=$('chain').value;state.cohort=$('cohort').value;render();syncHash();}
function drawChart(){const groups=new Map();for(const r of D.rows)groups.set(category(r),(groups.get(category(r))??0)+r.implied_value_usd);const sorted=[...groups].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));for(const [name,value] of sorted){const row=el('div',undefined,'chart-row');const track=el('div',undefined,'chart-track'),fill=el('div',undefined,'chart-fill');fill.style.width=(100*value/sorted[0][1])+'%';track.setAttribute('aria-hidden','true');track.append(fill);row.append(el('span',display(name)),track,tip(el('span',compact(value),'chart-value'),money(value)));$('chart').append(row);}}
function methodology(){
 const root=$('methodcontent');root.append(el('p','Implied value = TVL × multiple × growth factor × maturity factor. This is a model estimate, not a token price, guaranteed valuation or promised airdrop.'),el('div','growth = 1 + clamp(change_7d ?? 0, -60, 120) / 100 × 0.5; maturity = 0.6 + min(age_days, 1095) / 1095 × 0.4','formula'),el('p','Growth is in percentage points; missing growth substitutes 0% and is flagged. Observed zero remains observed. Age is floored UTC days from listed_at to 2026-11-14, clamped below at zero. Missing or invalid age substitutes 365 days. Maturity ranges from 0.6 to 1.0. No chain multiplier is used.'),el('p','Eligible peers are recorded-token protocols with finite, positive market cap and TVL. Category matching is exact (null becomes Unclassified). Use category median market-cap-to-TVL when n ≥ 3, otherwise the whole-market median; then clamp the multiple to [0.05, 0.60]. An even median averages the two central observations. There are 128 eligible peers; the whole-market median is 0.21380325885644053.'),el('p','The model uses full JavaScript numeric precision, then max(1, Math.round(TVL × multiple × growth × maturity)). Sort descending with slug ties ascending; traverse upward adding the minimum whole dollars needed for strict decrease. Record adjustments and assign fixed ranks. This snapshot requires no tie adjustments.'),el('p','Membership: all 40 watchlist slugs, plus 160 rankable pre-token protocols below $50M TVL with highest TVL, ties by slug. Pre-token requires null market cap, gecko_id and symbol. Early excludes CEX and trailing version markers; these filters do not apply to peers.'),el('p','Capital: TVL ≥ $5B: $250; ≥ $1B: $150; ≥ $100M: $100; otherwise $50. Hold age <180 days: 60 days; 180–365: 45 days; >365: 30 days. Six steps reuse the same budget, including any second position.'),el('p','Conviction = clamp(60 + category bonus + observation adjustment + chain bonus + TVL bonus, 0, 100). Category bonus is 15 for a category multiple with n ≥ 3. With s substituted fields among age and growth, observation adjustment is +10 if s = 0, otherwise -10 × s. At least two distinct chains adds 5; TVL ≥ $100M adds 10. This measures data support, not investment success probability.'),el('h3','Ten limitations'));
 const limitations=["Risk Curators TVL may duplicate underlying vaults/protocols and inflate implied value. Raw total TVL is not independent assets.", "Protocol versions may share a token. The version filter applies only to early rows.", "Medians and clamps reduce outliers; they do not establish a causal relationship from TVL to token value.", "Categories with few comparables use a fallback. Low n means limited evidence, not a calibrated confidence score.", "TVL is not revenue. The snapshot lacks fees/revenue, and the model does not use them.", "Growth is clamped from -60% to +120%; the snapshot includes an outlier near +4,448.47%. Missing growth uses 0% and is flagged.", "Pre-token means no token was recorded in the snapshot; it does not prove a protocol has no token.", "Implied value is a model proxy, not actual market cap, FDV, token price or an airdrop prediction.", "Gas is an offline assumption: Ethereum $2\u201320 per transaction; chains named Arbitrum, Optimism, Base, Polygon, BSC, Avalanche or Solana $0.01\u20131; others/unknown $0.10\u20135. Verify these estimates. Rewards, pools, assets and access are unverified. Bridge/swap/protocol fees are unknown; capital and loss risk are separate from gas.", "Age is UTC days from listed_at to as_of, not founding age; missing/invalid age uses 365 days and negative age is clamped to zero. Plans reuse the same capital rather than adding it six times."];const ol=el('ol');for(const s of limitations)ol.append(el('li',s));root.append(ol,el('p',`Source: ${D.source}. Reference date: ${D.as_of}.`));
}
function monoNumbers(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('script,style,select,.numeric,.chart-value,.peer-numbers,dd,th button')&&/\d/.test(n.textContent))nodes.push(n);}
 for(const node of nodes){const parts=node.textContent.split(/([−+-]?\d[\d,.]*(?:%|×|[dByMK])?)/g);const fragment=document.createDocumentFragment();for(let i=0;i<parts.length;i++)fragment.append(i%2?el('span',parts[i],'numeric'):document.createTextNode(parts[i]));node.replaceWith(fragment);}
}
function start(){
 if(!D||!Array.isArray(D.rows)||!Array.isArray(D.live)){const p=el('p','Unable to load dashboard data.','notice');$('main').prepend(p);return;}
 $('date').textContent=D.as_of;$('footdate').textContent=D.as_of;$('comp').textContent=D.comparables.count;$('median').textContent=D.comparables.global.toFixed(3)+'×';const total=D.rows.reduce((s,r)=>s+r.implied_value_usd,0);$('combined').textContent=compact(total);tip($('combined'),money(total));drawChart();methodology();monoNumbers();
 $('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.q=$('search').value;render();syncHash(true);},250);});
 for(const id of ['category','chain','cohort'])$(id).addEventListener('change',change);
 $('reset').onclick=()=>{clearTimeout(searchTimer);state={...defaults,view:state.view};refresh();render();renderDetail();syncHash();};
 for(const [id,view] of [['pre','pretoken'],['live','live']])$(id).onclick=()=>{clearTimeout(searchTimer);state={...defaults,view};refresh();render();renderDetail();syncHash();};
 document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{clearTimeout(searchTimer);state.q=$('search').value;if(state.sort===b.dataset.sort)state.dir=state.dir==='desc'?'asc':'desc';else{state.sort=b.dataset.sort;state.dir='desc';}render();syncHash();});
 $('detailclose').onclick=closeDetail;$('detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
 $('method').onclick=()=>{$('methodology').showModal();$('methodclose').focus();};$('methodclose').onclick=()=>$('methodology').close();
 window.addEventListener('hashchange',applyHash);window.addEventListener('popstate',applyHash);applyHash();
}

start();
