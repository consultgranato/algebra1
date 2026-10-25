"""Learning-design measurements over the notes, practice banks and quizzes.

Inputs: audit/raw/notes.json (node tools/extract-notes.mjs), audit/raw/items.json,
        audit/raw/videos.json (node tools/check-videos.mjs)
Output: audit/raw/learning.json
"""
import html as H
import json
import re
from math import comb
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
notes = json.loads((ROOT / 'audit/raw/notes.json').read_text(encoding='utf-8'))
items = json.loads((ROOT / 'audit/raw/items.json').read_text(encoding='utf-8'))


def text_of(fragment):
    s = re.sub(r'<br\s*/?>', ' ', fragment)
    s = re.sub(r'</?[a-zA-Z][^<>]*>', ' ', s)
    return re.sub(r'\s+', ' ', H.unescape(s)).strip()


def prose(h):
    """Paragraph-like prose only: drop worked examples, equation rows, tables, svg."""
    h = re.sub(r'<svg[\s\S]*?</svg>', ' ', h)
    h = re.sub(r'<table[\s\S]*?</table>', ' ', h)
    h = re.sub(r'<div class="worked"[\s\S]*?</div>\s*</div>', ' ', h)
    h = re.sub(r'<span class="eq[^"]*"[\s\S]*?</span>', ' ', h)
    return text_of(h)


def syllables(word):
    w = re.sub(r'[^a-z]', '', word.lower())
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    w = re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$', '', w)
    w = re.sub(r'^y', '', w)
    return max(1, len(re.findall(r'[aeiouy]{1,2}', w)))


def fk_grade(t):
    sentences = [s for s in re.split(r'[.!?]+(?:\s|$)', t) if re.search(r'[A-Za-z]', s)]
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z'\-]*", t)]
    if len(sentences) < 3 or len(words) < 30:
        return None, len(words)
    syl = sum(syllables(w) for w in words)
    return round(0.39 * len(words) / len(sentences) + 11.8 * syl / len(words) - 15.59, 1), len(words)


out = {'topics': [], 'units': {}, 'error_coverage': []}
for n in notes:
    h = n['html'] or ''
    worked = len(re.findall(r'class="worked"', h))
    warns = re.findall(r'class="warn"[\s\S]*?class="warn-lbl"[^>]*>([\s\S]*?)</div>([\s\S]*?)</div>', h)
    first_worked = h.find('class="worked"')
    first_rule = min([i for i in (h.find('class="kc"'), h.find('class="note-h"')) if i >= 0] or [-1])
    grade, nwords = fk_grade(prose(h))
    out['topics'].append({
        'file': n['file'], 'tag': n['tag'], 'title': H.unescape(n['title'] or ''),
        'workedExamples': worked, 'warnings': [text_of(a + ' ' + b)[:200] for a, b in warns],
        'tips': len(re.findall(r'class="tip"', h)), 'keyConcepts': len(re.findall(r'class="kc"', h)),
        'images': len(re.findall(r'<img', h)), 'svgs': len(re.findall(r'<svg', h)),
        'proseWords': nwords, 'fkGrade': grade, 'videos': len(n['videos']),
        'exampleBeforeFirstRule': (first_worked >= 0 and (first_rule < 0 or first_worked < first_rule)),
    })

for f, u in items.items():
    vtopics = sorted({q['topic'] for q in (u.get('vqb') or [])})
    ts = [t for t in out['topics'] if t['file'] == f]
    gs = [t['fkGrade'] for t in ts if t['fkGrade'] is not None]
    words = sum(t['proseWords'] for t in ts)
    out['units'][f] = {
        'topics': len(ts), 'topicsWithoutWorkedExample': [t['tag'] for t in ts if t['workedExamples'] == 0],
        'topicsWithoutVideo': [t['tag'] for t in ts if t['videos'] == 0],
        'practiceTopicsWithoutVocab': [t for t in (u.get('practiceButtons') or []) if t not in vtopics],
        'vocabFilters': u.get('vqFilters'),
        'fkGradeMedian': sorted(gs)[len(gs) // 2] if gs else None, 'fkGradeRange': [min(gs), max(gs)] if gs else None,
        'proseWords': words,
    }

# ---- can a 5-problem set show the error each warning is about? ----
# A pattern for each well-defined error type; P(no such item in a random 5 of 15) = C(15-k,5)/C(15,5).
PATTERNS = [
    ('unit6.html', '6.2', 'dividing/multiplying by a negative flips the sign', lambda it: re.search(r'(^|[^\w)])[-−]\d*x\s*[<>≤≥]|/\(\s*-|[-−]x\s*[<>≤≥]', it['eq'] or '')),
    ('unit6.html', '6.3', 'dividing/multiplying by a negative flips the sign', lambda it: _neg_coef_after_collect(it)),
    ('unit5.html', '5.4', 'no solution vs all real numbers (both kinds present)', lambda it: 'no solution' in it['a']),
    ('unit5.html', '5.4', 'all real numbers case', lambda it: 'all real' in it['a']),
    ('unit6.html', '6.4', 'no solution case', lambda it: 'no solution' in it['a']),
    ('unit6.html', '6.4', 'all real numbers case', lambda it: 'all real' in it['a']),
    ('unit11.html', '11.1', '-a^0 = -1 versus (-a)^0 = 1', lambda it: re.match(r'^-\d\^0$', it['eq'] or '')),
    ('unit16.html', '16.1', 'square root gives two answers (±)', lambda it: ' or ' in it['a']),
    ('unit14.html', '14.3', 'difference of squares', lambda it: re.match(r'^\d*x²\s*−\s*\d+$', it['eq'] or '')),
    ('unit9.html', '9.4', 'multiply an equation before eliminating', lambda it: 'multiply first' in it['q']),
    ('unit9.html', '9.2', 'parallel lines / no solution', lambda it: it['a'] in ('no solution', 'infinite solutions')),
    # one row per "warn" callout in the notes (tools/learning_review.py prints them)
    ('unit5.html', '5.1', 'notes warning: invisible -1 coefficient (-x)', lambda it: re.search(r'(^|[\s=(])[-−]x', it['eq'] or '')),
    ('unit5.html', '5.2', 'notes warning: sign errors in a binomial numerator like (6 - 3x)/5', lambda it: re.search(r'\([^)]*[+\-−][^)]*\)\s*/', it['eq'] or '')),
    ('unit5.html', '5.3', 'notes warning: negative sign before parentheses', lambda it: re.search(r'[-−]\d*\(', it['eq'] or '')),
    ('unit10.html', '10.1', 'notes warning: "less than" reverses order', lambda it: 'less than' in (it['eq'] or '').lower()),
    ('unit11.html', '11.1', 'notes warning: (-a)^0 versus -a^0 (either form)', lambda it: re.match(r'^\(?-\d\)?\^0$', it['eq'] or '')),
    ('unit11.html', '11.3', 'notes warning: power applies to the coefficient too', lambda it: re.match(r'^\(\d+x', it['eq'] or '')),
    ('unit13.html', '13.2', 'notes warning: distribute the negative when subtracting', lambda it: it['q'].startswith('Subtract')),
    ('unit14.html', '14.3', 'notes warning: negative leading coefficient', lambda it: (it['eq'] or '').startswith('−')),
    ('unit15.html', '15.4', 'notes warning: sign of h in (x - h)', lambda it: re.search(r'\(x [+-] \d\)\^2', it['eq'] or '')),
    ('unit16.html', '16.2', 'notes warning: do not divide by x (x^2 + bx = 0)', lambda it: re.match(r'^x\^2 [+-] \d+x = 0$', it['eq'] or '')),
]


def _neg_coef_after_collect(it):
    from sympy import Poly, Symbol
    from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
    e = (it['eq'] or '').replace('−', '-').replace('≥', '>=').replace('≤', '<=')
    m = re.split(r'(<=|>=|<|>)', e.replace(' ', ''))
    if len(m) != 3:
        return False
    tr = standard_transformations + (implicit_multiplication_application,)
    x = Symbol('x')
    try:
        p = Poly(parse_expr(m[0], {'x': x}, transformations=tr) - parse_expr(m[2], {'x': x}, transformations=tr), x)
    except Exception:
        return False
    # a student who collects x on the left ends with this coefficient
    return p.degree() == 1 and p.coeff_monomial(x) < 0


for f, tag, error, pred in PATTERNS:
    bank = [it for it in items[f]['items'] if it['kind'] == 'bank' and it['group'] == tag]
    k = sum(1 for it in bank if pred(it))
    n = len(bank)
    p_none = comb(n - k, 5) / comb(n, 5) if n - k >= 5 else 0.0
    out['error_coverage'].append({'unit': f, 'topic': tag, 'error': error, 'itemsExercisingIt': k, 'bankSize': n,
                                  'probSetOfFiveHasNone': round(p_none, 3)})

# ---- difficulty ordering ----
out['ordering'] = 'loadP() shuffles the 15-item bank and takes 5 (e.g. unit5.html:654), so no set is ordered easy-to-hard ' \
                  'and a set can open with the hardest item.'

(ROOT / 'audit/raw/learning.json').write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding='utf-8')
for f, u in out['units'].items():
    print(f, u)
for e in out['error_coverage']:
    print(e)
print('topics with no worked example:', [(t['file'], t['tag']) for t in out['topics'] if t['workedExamples'] == 0])
