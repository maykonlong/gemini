const fs = require('fs');
const path = require('path');

function extractArraysFromText(text){
  const map = {};
  // match "key": [ ... ] blocks (non-greedy for bracket content)
  const re = /["']([A-Za-z0-9_\-]+)["']\s*:\s*\[([^\]]*)\]/g;
  let m;
  while((m = re.exec(text))){
    const key = m[1];
    const inner = m[2];
    const items = [];
    // match strings inside quotes
    const sq = /["']([^"']+)["']/g;
    let s;
    while((s = sq.exec(inner))){
      items.push(s[1]);
    }
    // if no quoted strings found, try comma-separated tokens
    if(items.length === 0){
      const parts = inner.split(',').map(x=>x.trim()).filter(Boolean);
      parts.forEach(p=>{
        // remove trailing commas/quotes
        const cleaned = p.replace(/^["'`\s]+|["'`\s]+$/g,'');
        if(cleaned) items.push(cleaned);
      });
    }
    if(items.length) map[key] = (map[key] || []).concat(items);
  }
  return map;
}

function extractLetterTokens(arr){
  const tokens = [];
  for(const it of arr){
    if(!it) continue;
    const s = String(it).toUpperCase();
    const parts = s.match(/\p{L}+/gu) || [];
    for(const p of parts){ if(p && p.length>=2) tokens.push(p); }
  }
  return tokens;
}

function mergeAndClean(maps){
  const merged = {};
  for(const mp of maps){
    for(const k of Object.keys(mp)){
      merged[k] = merged[k] || [];
      merged[k] = merged[k].concat(mp[k]);
    }
  }
  // clean each category
  for(const k of Object.keys(merged)){
    const raw = extractLetterTokens(merged[k]);
    // dedupe preserving order
    const seen = new Set();
    const cleaned = [];
    for(const t of raw){
      const up = t.toUpperCase();
      if(!seen.has(up)) { seen.add(up); cleaned.push(up); }
    }
    // try to reduce tokens with trailing garbage: if token starts with a shorter token, prefer shorter
    const norm = [];
    for(const t of cleaned){
      let chosen = t;
      const shorter = cleaned.filter(s => s !== t && s.length >= 3 && t.startsWith(s));
      if(shorter.length){ shorter.sort((a,b)=> b.length - a.length); chosen = shorter[0]; }
      else { for(let drop=1; drop<=4 && drop < t.length; drop++){ const cand = t.slice(0, t.length-drop); if(cand.length>=3 && cleaned.includes(cand)){ chosen = cand; break; } } }
      if(!norm.includes(chosen)) norm.push(chosen);
    }
    // final filter: reasonable lengths (3..20)
    merged[k] = norm.filter(x=> x.length >= 3 && x.length <= 20);
  }
  return merged;
}

function writeJsonPools(pools, filePath){
  const obj = { pools };
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function writeJsPools(pools, filePath){
  const data = {
    pools: {}
  };
  for(const k of Object.keys(pools)){
    // write lowercase tokens for js file readability
    data.pools[k] = pools[k].map(s=> s.toLowerCase());
  }
  const content = `// Embedded WordSearch pools (repaired)\nwindow.WS_POOLS = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(filePath, content, 'utf8');
}

function main(){
  const repo = path.resolve(__dirname, '..');
  const jsonPath = path.join(repo, 'json', 'ws-pools.json');
  const jsPath = path.join(repo, 'js', 'ws-pools.js');
  const files = [jsonPath, jsPath];
  const maps = [];
  for(const f of files){
    try{
      const txt = fs.readFileSync(f, 'utf8');
      const mp = extractArraysFromText(txt);
      maps.push(mp);
      console.log('Extracted from', path.basename(f), Object.keys(mp).join(','));
    }catch(e){ console.error('Error reading', f, e.message); }
  }
  const pools = mergeAndClean(maps);
  console.log('Final categories:', Object.keys(pools));
  // show counts
  Object.keys(pools).forEach(k=> console.log(k, ':', pools[k].length, 'tokens (sample)', pools[k].slice(0,8).join(', ')));

  // write back
  try{ writeJsonPools(pools, jsonPath); console.log('Wrote cleaned JSON to', jsonPath); }catch(e){ console.error('Failed write JSON', e.message); }
  try{ writeJsPools(pools, jsPath); console.log('Wrote cleaned JS to', jsPath); }catch(e){ console.error('Failed write JS', e.message); }
}

main();
