"""PROPOSED standards alignment for every topic, for the teacher to review.
Illinois adopted the Common Core State Standards for Mathematics as the Illinois
Learning Standards for Mathematics (2010), so one code serves both columns.
Output: audit/human/standards-alignment-PROPOSED.md
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
notes = json.loads((ROOT / 'audit/raw/notes.json').read_text(encoding='utf-8'))

MAP = {
    '1.2': ('7.NS.A.1', 'prior grade; review'), '1.3': ('7.NS.A.2', 'prior grade; review'),
    '1.4': ('6.EE.A.2c', 'order of operations; prior grade'), '2.1': ('6.NS.A.1; 7.NS.A', 'fraction meaning; prior grade'),
    '2.3': ('6.NS.B.4', 'GCF to simplify; prior grade'), '2.4': ('7.NS.A.1d', 'prior grade'),
    '2.5': ('6.NS.A.1; 7.NS.A.2c', 'prior grade'), '3.1': ('6.EE.A.2a', 'variables; prior grade'),
    '3.2': ('6.EE.A.3; 6.EE.A.4; A-SSE.A.1a', 'like terms'), '3.3': ('8.EE.A.1', 'product of powers'),
    '4.1': ('6.EE.A.2b; A-SSE.A.1a', 'parts of an expression'), '4.2': ('7.EE.A.1; A-SSE.A.2', 'distribute and combine'),
    '4.4': ('6.EE.A.2c', 'evaluate'),
    '5.1': ('A-REI.A.1; A-REI.B.3', ''), '5.2': ('A-REI.B.3', ''), '5.3': ('A-REI.A.1; A-REI.B.3; 8.EE.C.7b', ''),
    '5.4': ('8.EE.C.7a', 'one / none / infinitely many solutions'),
    '6.1': ('A-CED.A.1; 6.EE.B.8', 'writing and graphing inequalities'), '6.2': ('A-REI.B.3', ''), '6.3': ('A-REI.B.3', ''),
    '6.4': ('A-REI.B.3', 'special cases'), '6.5': ('A-REI.B.3; A-CED.A.1', 'compound inequalities'),
    '7.1': ('F-IF.A.1', ''), '7.2': ('F-IF.A.1; F-IF.B.5', ''), '7.3': ('F-LE.A.1a; F-LE.A.1b; 8.F.A.3', ''),
    '7.4': ('F-IF.A.2', 'function notation'),
    '8.1': ('F-IF.B.6; 8.EE.B.6', 'slope as rate of change'), '8.2': ('F-IF.C.7a; 8.F.B.4', ''),
    '8.3': ('F-LE.A.2; A-CED.A.2; G-GPE.B.5', 'G-GPE.B.5 for parallel/perpendicular'),
    '8.4': ('A-CED.A.2; A-CED.A.4; F-IF.C.7a', 'standard form, intercepts, special lines'), '8.5': ('A-REI.D.12', ''),
    '9.1': ('A-REI.C.6; A-REI.D.11', ''), '9.2': ('A-REI.C.6; A-REI.D.11', ''), '9.3': ('A-REI.C.6', ''),
    '9.4': ('A-REI.C.5; A-REI.C.6', ''),
    '10.1': ('A-SSE.A.1; A-CED.A.1', 'translating words'), '10.2': ('A-CED.A.1', ''), '10.3': ('A-CED.A.1; N-Q.A.1', ''),
    '10.4': ('A-CED.A.1; A-CED.A.2; F-LE.A.5', 'linear models'), '10.5': ('A-CED.A.3; A-REI.C.6', ''),
    '10.6': ('A-CED.A.1; A-CED.A.4; N-Q.A.1', 'distance-rate-time'), '10.7': ('A-CED.A.3; A-REI.C.6', 'mixture'),
    '11.1': ('8.EE.A.1; N-RN.A.1', 'zero and negative exponents'), '11.2': ('8.EE.A.1', ''), '11.3': ('8.EE.A.1', ''),
    '12.1': ('F-IF.C.7e; F-LE.A.1c; F-IF.B.6', 'average rate of change item'), '12.2': ('F-LE.A.2; F-BF.A.1a', ''),
    '12.3': ('F-LE.A.1c; F-LE.A.5; A-SSE.B.3c', 'growth/decay models'),
    '12.4': ('A-CED.A.1', 'same-base exponential equations are beyond A-REI in CCSS Algebra 1; check against course map'),
    '13.1': ('A-SSE.A.1a; A-APR.A.1', ''), '13.2': ('A-APR.A.1', ''), '13.3': ('A-APR.A.1', ''), '13.4': ('A-APR.A.1', ''),
    '14.1': ('A-SSE.A.2', ''), '14.2': ('A-SSE.A.2; A-SSE.B.3a', ''), '14.3': ('A-SSE.A.2', 'includes difference of squares'),
    '14.4': ('A-REI.B.4b; A-SSE.B.3a', 'zero product property'),
    '15.1': ('F-IF.C.7a; F-BF.B.3', ''), '15.2': ('F-IF.C.7a; F-IF.B.4', 'vertex, axis of symmetry'),
    '15.3': ('F-IF.C.7a; F-IF.B.4', ''), '15.4': ('F-IF.C.8a; F-BF.B.3; A-SSE.B.3b', 'vertex form'),
    '15.5': ('F-IF.B.4; A-CED.A.2', 'projectile motion'),
    '16.1': ('A-REI.B.4b', 'square roots'), '16.2': ('A-REI.B.4b; A-SSE.B.3a', ''), '16.3': ('A-REI.B.4a; A-REI.B.4b', ''),
    '16.4': ('A-REI.B.4b', 'discriminant'),
}
rows = ['# Standards alignment — PROPOSED, for teacher review', '',
        'Illinois adopted the Common Core State Standards for Mathematics as the Illinois Learning Standards for',
        'Mathematics, so each code below is both. Codes with a leading grade number (6.EE, 7.NS, 8.EE, 8.F) are',
        'middle-school standards being reviewed in Algebra 1. **Every row is a proposal**: confirm or change it against',
        'the D219 course map before using it anywhere.', '',
        '| Topic | Title | Proposed standard(s) | Note | Teacher: ✅ / change to |', '|---|---|---|---|---|']
for n in notes:
    code, note = MAP.get(n['tag'], ('—', 'not mapped'))
    rows.append(f'| {n["tag"]} | {html.unescape(n["title"] or "")} | {code} | {note} | |')
missing = [n['tag'] for n in notes if n['tag'] not in MAP]
out = ROOT / 'audit/human'
out.mkdir(parents=True, exist_ok=True)
(out / 'standards-alignment-PROPOSED.md').write_text('\n'.join(rows) + '\n', encoding='utf-8')
print(len(notes), 'topics; unmapped:', missing)
