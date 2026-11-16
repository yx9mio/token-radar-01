import {readFileSync,readdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
// Raw immutable snapshot, baseline board, Git history, vendor helper, task/transcript and this detector are excluded.
// All rendered snapshot names use separate ASCII display labels at the rendering boundary.
const pattern='[ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]';
const files=['README.md','HANDOFF.md','main.ts','lib/model.ts',...readdirSync('scripts').filter(f=>/\.(mjs|sh|py)$/.test(f)&&f!=='language-check.mjs').map(f=>join('scripts',f)),...readdirSync('dashboard').map(f=>join('dashboard',f)),...readdirSync('docs').filter(f=>f.endsWith('.md')).map(f=>join('docs',f)),...readdirSync('out/dashboard').map(f=>join('out/dashboard',f))];
function strings(value){if(typeof value==='string')return [value];if(Array.isArray(value))return value.flatMap(strings);if(value&&typeof value==='object')return Object.entries(value).flatMap(([k,v])=>[k,...strings(v)]);return [];}
for(const file of ['out/board.json','out/dossier.json']){const obj=JSON.parse(readFileSync(file,'utf8'));files.push([file,strings(obj).join('\n')]);}
const directory=process.argv[2];if(!directory)throw Error('Run sh scripts/language-check.sh to use UTF-8 grep outside Node child-process restrictions.');
writeFileSync(join(directory,'pattern'),pattern+'\n');let count=0;
const dataScript=readFileSync('out/data.js','utf8');files.push(['out/data.js',strings(JSON.parse(dataScript.slice('window.RADAR='.length).trim().slice(0,-1))).join('\n')]);
for(const item of files){const [name,raw]=Array.isArray(item)?item:[item,readFileSync(item,'utf8')];const text=raw.normalize('NFC').replace(/\\u([0-9a-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))).normalize('NFC');writeFileSync(join(directory,String(count).padStart(3,'0')+'.txt'),name+'\n'+text);count++;}
console.log(`Prepared ${count} NFC-normalized product files with decoded JSON strings.`);
