import re
import json
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
json_path = repo / 'json' / 'ws-pools.json'
js_path = repo / 'js' / 'ws-pools.js'

def extract_arrays(text):
    pattern = re.compile(r'["\']([A-Za-z0-9_\-]+)["\']\s*:\s*\[([^\]]*)\]')
    result = {}
    for m in pattern.finditer(text):
        key = m.group(1)
        inner = m.group(2)
        items = re.findall(r'["\']([^"\']+)["\']', inner)
        if not items:
            parts = [p.strip().strip('"\'') for p in inner.split(',') if p.strip()]
            items = [p for p in parts if p]
        if items:
            result.setdefault(key, []).extend(items)
    return result

# Build a letter-token regex: prefer the `regex` module for \p{L}, otherwise fall back
try:
    import regex
    letter_re = regex.compile(r"\p{L}+", regex.VERSION1)
except Exception:
    # fallback: approximate with Latin letters and common accented ranges
    letter_re = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")


def extract_letter_tokens(arr):
    tokens = []
    for it in arr:
        if not it: continue
        s = str(it).upper()
        parts = letter_re.findall(s) or []
        for p in parts:
            if p and len(p) >= 2:
                tokens.append(p)
    return tokens


def merge_and_clean(maps):
    merged = {}
    for mp in maps:
        for k,v in mp.items():
            merged.setdefault(k, [])
            merged[k].extend(v)
    for k in list(merged.keys()):
        raw = extract_letter_tokens(merged[k])
        seen = set(); cleaned = []
        for t in raw:
            up = t.upper()
            if up not in seen:
                seen.add(up); cleaned.append(up)
        norm = []
        for t in cleaned:
            chosen = t
            shorter = [s for s in cleaned if s != t and len(s) >= 3 and t.startswith(s)]
            if shorter:
                shorter.sort(key=lambda x: -len(x)); chosen = shorter[0]
            else:
                for drop in range(1, min(5, len(t))):
                    cand = t[:-drop]
                    if len(cand) >= 3 and cand in cleaned:
                        chosen = cand; break
            if chosen not in norm:
                norm.append(chosen)
        merged[k] = [x for x in norm if 3 <= len(x) <= 20]
    return merged


def write_json_pools(pools, path):
    obj = { 'pools': pools }
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def write_js_pools(pools, path):
    data = { 'pools': { k: [s.lower() for s in v] for k,v in pools.items() } }
    content = f"// Embedded WordSearch pools (repaired)\nwindow.WS_POOLS = {json.dumps(data, indent=2, ensure_ascii=False)};\n"
    path.write_text(content, encoding='utf-8')


def main():
    maps = []
    for p in [json_path, js_path]:
        try:
            txt = p.read_text(encoding='utf-8')
            mp = extract_arrays(txt)
            maps.append(mp)
            print('Extracted from', p.name, list(mp.keys()))
        except Exception as e:
            print('Error reading', p, e)
    pools = merge_and_clean(maps)
    print('Final categories:', list(pools.keys()))
    for k in pools:
        print(k, ':', len(pools[k]), 'tokens (sample):', pools[k][:8])
    try:
        write_json_pools(pools, json_path)
        print('Wrote cleaned JSON to', json_path)
    except Exception as e:
        print('Failed write JSON', e)
    try:
        write_js_pools(pools, js_path)
        print('Wrote cleaned JS to', js_path)
    except Exception as e:
        print('Failed write JS', e)

if __name__ == '__main__':
    main()
