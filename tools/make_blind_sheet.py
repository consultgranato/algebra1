"""Blind review sheet: 50 randomly selected items (seed 2026) for a teacher to solve by
hand. Problems go in one file, the site's keys in another, so the solver never sees them.
Output: audit/human/blind-review-sheet.md and audit/human/blind-review-KEY.md
"""
import html
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
items = json.loads((ROOT / 'audit/raw/items.json').read_text(encoding='utf-8'))


def clean(s):
    s = re.sub(r'<sup>(.*?)</sup>', r'^\1', str(s or ''))
    return html.unescape(re.sub(r'</?[a-zA-Z][^<>]*>', '', s)).strip()


pool = [(f, it) for f, u in items.items() for it in u['items'] if not it['svg']]  # pictures cannot be printed as text
rng = random.Random(2026)
pick = rng.sample(pool, 50)
pick.sort(key=lambda p: (list(items).index(p[0]), p[1]['kind'], p[1]['idx']))

sheet = ['# Blind review sheet — solve by hand', '',
         'Fifty items drawn at random (seed 2026) from every practice bank and practice-test pool, excluding items',
         'that depend on a picture. Solve each one on paper **before** opening `blind-review-KEY.md`. Then mark',
         'each row: ✅ the site\'s key matches you, ❌ it does not, ❓ the problem is ambiguous or badly worded.', '',
         '| # | Unit | Problem | Answer format the student is told | Your answer | ✅ ❌ ❓ |', '|---|---|---|---|---|---|']
key = ['# Blind review — the site\'s keys', '', 'Open only after solving every item on the sheet.', '',
       '| # | Location | Site key | Explanation shown to students |', '|---|---|---|---|']
for n, (f, it) in enumerate(pick, 1):
    prob = (clean(it['q']) + ' ' + clean(it['eq'])).strip().replace('|', '\\|')
    sheet.append(f'| {n} | {f.replace(".html", "")} | {prob} | {clean(it["fmt"])} | | |')
    key.append(f'| {n} | {f} {it["kind"]} {it["group"]}#{it["idx"]} | `{clean(it["a"])}` | {clean(it["h"]).replace("|", "/")} |')
out = ROOT / 'audit/human'
out.mkdir(parents=True, exist_ok=True)
(out / 'blind-review-sheet.md').write_text('\n'.join(sheet) + '\n', encoding='utf-8')
(out / 'blind-review-KEY.md').write_text('\n'.join(key) + '\n', encoding='utf-8')
print('wrote', len(pick), 'items')
