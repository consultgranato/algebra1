"""Independent parsing of the site's problem text and answer keys into SymPy.

Shares no code with assets/algebra1.js or the unit pages: it reads the raw
strings dumped by tools/extract-items.mjs and interprets them from scratch.
"""
import html
import re

from sympy import (Eq, FiniteSet, Interval, Rational, S, Symbol, Union, nsimplify,
                   simplify, sympify, oo)
from sympy.parsing.sympy_parser import (convert_xor, implicit_multiplication_application,
                                        parse_expr, standard_transformations)

TRANS = standard_transformations + (implicit_multiplication_application, convert_xor)
LETTERS = {c: Symbol(c) for c in 'abcdfghkmnpqrstuvwxyz'}
x, y, t = LETTERS['x'], LETTERS['y'], LETTERS['t']

SUP = {'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-'}

# A superscript that swallowed more than the exponent: a parenthesis, or an
# exponent followed by an operator and more terms ('x<sup>2+8x+15</sup>').
MALFORMED_SUP = re.compile(r'<sup>(?:[^<]*[()][^<]*|-?\d+\s*[+\-−][^<]+)</sup>')


def repair_sup(s):
    """Undo the known authoring slip where <sup> swallowed a parenthesis:
    '5x<sup>2(x</sup> - 3)' was meant as '5x^2(x - 3)'."""
    s = re.sub(r'<sup>(-?\d+)\(([^<]*)</sup>', r'^\1(\2', s)
    s = re.sub(r'<sup>(-?\d+)\)</sup>', r'^\1)', s)
    return s


def plain(s):
    """Markup and Unicode -> ASCII maths text."""
    if s is None:
        return ''
    s = repair_sup(str(s))
    s = re.sub(r'<sup>(.*?)</sup>', r'^(\1)', s)
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'</?[a-zA-Z][^<>]*>', '', s)
    s = html.unescape(s)
    s = re.sub('[' + ''.join(SUP) + ']+', lambda m: '^(' + ''.join(SUP[c] for c in m.group(0)) + ')', s)
    s = (s.replace('−', '-').replace('–', '-').replace('—', '-').replace('×', '*').replace('÷', '/')
         .replace('·', '*').replace('⋅', '*').replace('≤', '<=').replace('≥', '>=').replace('≠', '!=')
         .replace('√', 'sqrt').replace('°', '').replace('$', '').replace(' ', ' '))
    s = re.sub(r'sqrt(\d+)', r'sqrt(\1)', s)
    return s.strip()


def expr(s):
    s = plain(s).replace('|x|', 'Abs(x)')
    s = re.sub(r'(\d),(\d{3})', r'\1\2', s)
    return parse_expr(s, local_dict=dict(LETTERS), transformations=TRANS, evaluate=True)


def expr_unevaluated(s):
    s = plain(s)
    return parse_expr(s, local_dict=dict(LETTERS), transformations=TRANS, evaluate=False)


def equation(s):
    s = plain(s)
    left, right = s.split('=', 1)
    return Eq(expr(left), expr(right))


def number(s):
    s = plain(s).replace(',', '').strip()
    s = re.sub(r'^[a-z]\s*=\s*', '', s, flags=re.I)
    return nsimplify(expr(s), rational=True) if s else None


# ---------- answer-key parsing ----------

NS = 'NO SOLUTION'
ALL = 'ALL REALS'


def special(s):
    k = re.sub(r'[^a-z]', '', plain(s).lower())
    if k in ('nosolution', 'nosolutions', 'norealsolution', 'norealsolutions', 'none'):
        return NS
    if k in ('allrealnumbers', 'allreals', 'infinitesolutions', 'infinitelymanysolutions'):
        return ALL
    return None


def solution_set(s):
    """'x = 5 or x = -2' / 'x=4' / 'no solution' / 'all real numbers' -> set."""
    sp = special(s)
    if sp:
        return sp
    parts = re.split(r'\s*(?:\bor\b|\band\b|,)\s*', plain(s))
    vals = set()
    for p in parts:
        p = re.sub(r'^[a-z]\s*=\s*', '', p.strip())
        if p:
            vals.add(simplify(expr(p)))
    return frozenset(vals)


def _half(var_left, op, v):
    """Set for 'x op v' (var_left) or 'v op x'."""
    if not var_left:
        op = {'<': '>', '>': '<', '<=': '>=', '>=': '<='}[op]
    return {'<': Interval.open(-oo, v), '<=': Interval(-oo, v),
            '>': Interval.open(v, oo), '>=': Interval(v, oo)}[op]


def ineq_set(s, var='x'):
    """'x > 3', '-1 <= x < 3', 'x > 4 or x < -2', '5 < x' -> SymPy set."""
    sp = special(s)
    if sp == NS:
        return S.EmptySet
    if sp == ALL:
        return S.Reals
    out = S.EmptySet
    for part in re.split(r'\s+or\s+', plain(s), flags=re.I):
        toks = re.split(r'(<=|>=|<|>)', part.replace(' ', ''))
        if len(toks) == 3:
            a, op, b = toks
            out = Union(out, _half(a == var, op, simplify(expr(b if a == var else a))))
        elif len(toks) == 5:
            a, op1, v, op2, b = toks
            if v != var:
                raise ValueError('compound without var in middle: ' + s)
            out = Union(out, _half(False, op1, simplify(expr(a))).intersect(_half(True, op2, simplify(expr(b)))))
        else:
            raise ValueError('cannot parse inequality: ' + s)
    return out


def point(s):
    m = re.match(r'^\s*\(\s*(.+?)\s*,\s*(.+?)\s*\)\s*$', plain(s))
    if not m:
        return None
    return (simplify(expr(m.group(1))), simplify(expr(m.group(2))))


def fields(s):
    """'slope = 3, y-intercept = 5' -> {'slope': 3, 'y-intercept': 5}."""
    out = {}
    for m in re.finditer(r'([A-Za-z][A-Za-z\- ]*?)\s*=\s*(\([^)]*\)|[^,]+)', plain(s)):
        out[m.group(1).strip().lower()] = m.group(2).strip()
    return out
