"""Diff of every answer key and explanation changed since the Phase 0 baseline, with the
independent solver's answer beside it. Output: audit/after/answer-key-changes.md"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
old = json.loads((ROOT / 'audit/raw/items.json').read_text(encoding='utf-8'))
new = json.loads((ROOT / 'tests/out/items.json').read_text(encoding='utf-8'))
ver = {i['id']: i for i in json.loads((ROOT / 'tests/out/verification.json').read_text(encoding='utf-8'))['items']}
FIELD = {'a': 'key', 'h': 'explanation', 'eq': 'problem', 'fmt': 'format'}


def c(s):
    s = re.sub(r'<sup>(.*?)</sup>', r'^\1', str(s or ''))
    return html.unescape(s).replace('|', r'\|')


rows = ['# Answer-key and explanation changes', '',
        'Phase 0 baseline (`audit/raw/items.json`) vs current pages. Solver = independent SymPy/hand solution '
        '(`tools/verify/`). Regenerate: `node tests/run-all.mjs --skip-axe && python tools/key_diff.py`.', '',
        '| Item | Field | Before | After | Solver says | Solver verdict |', '|---|---|---|---|---|---|']
for f in old:
    before = {(i['kind'], i['group'], i['idx']): i for i in old[f]['items']}
    for i in new[f]['items']:
        p = before[(i['kind'], i['group'], i['idx'])]
        iid = f'{f}:{i["kind"]}:{i["group"]}:{i["idx"]}'
        for fld in FIELD:
            if p[fld] != i[fld]:
                v = ver[iid]
                solver = c(v['independent']) if fld == 'a' else ''
                verdict = v['status'] if fld == 'a' else ''
                rows.append(f'| {iid} | {FIELD[fld]} | `{c(p[fld])}` | `{c(i[fld])}` | {solver} | {verdict} |')
(ROOT / 'audit/after').mkdir(parents=True, exist_ok=True)
(ROOT / 'audit/after/answer-key-changes.md').write_text('\n'.join(rows) + '\n', encoding='utf-8')
print(len(rows) - 6, 'changed fields')
