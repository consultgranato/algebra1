"""Independent solvers, one per problem shape. Each returns a Verdict or None
(None = this handler does not apply). The independent answer is computed from
the problem text only; the site's key is parsed separately and compared."""
import re
from dataclasses import dataclass, field

from sympy import (Abs, Eq, Poly, Rational, S, Symbol, degree, expand, factor_list, gcd_terms,
                   linsolve, nsimplify, simplify, solveset, sqrt, sympify, LC, Integer)
from sympy.solvers.inequalities import reduce_rational_inequalities

from mathtext import (ALL, NS, equation, expr, fields, ineq_set, number, plain, point, solution_set,
                      special, x, y, t, LETTERS)


@dataclass
class Verdict:
    status: str            # match | mismatch | ambiguous | unverified
    independent: str
    method: str
    notes: list = field(default_factory=list)


def ok(cond, indep, method, notes=None):
    return Verdict('match' if cond else 'mismatch', str(indep), method, notes or [])


def q_eq(it):
    return plain(it['q']), plain(it['eq'])


def has_var(s):
    return re.search(r'[a-z]', re.sub(r'sqrt', '', s)) is not None


def norm_word(s):
    return re.sub(r'[^a-z0-9]', '', plain(s).lower())


# ---------------- arithmetic ----------------

ARITH = ('Calculate:', 'Evaluate using PEMDAS:', 'Add:', 'Subtract:', 'Multiply:', 'Divide:', 'Simplify:')


def h_arith(it):
    q, e = q_eq(it)
    if q not in ARITH or not e or has_var(e):
        return None
    raw = str(it['eq'])
    if re.fullmatch(r'\s*-?\d+/\d+\s*[÷×]\s*-?\d+/\d+\s*', raw):  # a/b ÷ c/d means (a/b) ÷ (c/d)
        raw = '(' + re.sub(r'\s*([÷×])\s*', lambda m: ') ' + m.group(1) + ' (', raw) + ')'
    v = nsimplify(expr(raw), rational=True)
    k = number(it['a'])
    notes = []
    ka = plain(it['a'])
    m = re.fullmatch(r'(-?\d+)/(\d+)', ka)
    if m and 'simplest' in (it.get('fmt') or ''):
        from math import gcd
        if gcd(int(m.group(1)), int(m.group(2))) != 1:
            notes.append('key fraction not in simplest form')
    return ok(v == k and not notes, v, 'exact rational arithmetic', notes)


# ---------------- algebraic simplification / multiplication ----------------

EXPR_Q = ('Simplify:', 'Multiply:', 'FOIL:', 'Add:', 'Subtract:', 'Write in standard form:')


def h_expr(it):
    q, e = q_eq(it)
    if q not in EXPR_Q or not e or not has_var(e):
        return None
    if ' / ' in e:  # spaced division is the site's stacked fraction: whole numerator over whole denominator
        e = '(' + e.replace(' / ', ')/(') + ')'
    v = expand(expr(e))
    k = expr(it['a'])
    same = simplify(expand(k) - v) == 0
    notes = []
    ka = plain(it['a'])
    if same and q in ('Multiply:', 'FOIL:', 'Add:', 'Subtract:', 'Simplify:') and '(' in re.sub(r'\^\(-?\d+\)', '', ka) and '/' not in ka:
        notes.append('key still contains parentheses (not fully simplified)')
    if same and '^(-' in ka:
        notes.append('key uses a negative exponent')
    if q == 'Write in standard form:' and same:
        p = Poly(v, x)
        order = [d for d, in p.monoms()]
        notes_ok = True
        kp = [m.group(0) for m in re.finditer(r'[+-]?\s*[^+-]+', ka.replace(' ', ''))]
        degs = []
        for term in kp:
            d = Poly(expr(term), x).degree() if has_var(term) else 0
            degs.append(d)
        if degs != sorted(degs, reverse=True):
            notes.append('key is not in descending (standard) order')
    return ok(same and not [n for n in notes if 'parentheses' in n or 'standard' in n], v,
              'SymPy expand(key) == expand(problem)', notes)


# ---------------- evaluate expression ----------------

def h_evaluate(it):
    q, e = q_eq(it)
    m = re.match(r'^Evaluate (.+?) when\s*(?:x\s*=\s*(-?\d+))?\s*$', q)
    if not m:
        return None
    body = m.group(1)
    xv = m.group(2)
    if xv is None:
        mm = re.match(r'^x\s*=\s*(-?\d+)$', e)
        if not mm:
            return None
        xv = mm.group(1)
    body = re.sub(r'^y\s*=\s*', '', body)
    v = expr(body).subs(x, int(xv))
    return ok(simplify(v - number(it['a'])) == 0, v, 'substitution')


# ---------------- equations ----------------

def solve_eq_text(s):
    eqn = equation(s)
    if eqn is S.true:
        return ALL
    if eqn is S.false:
        return NS
    syms = sorted(eqn.free_symbols, key=str)
    if len(syms) != 1:
        return None
    sol = solveset(eqn, syms[0], domain=S.Reals)
    if sol == S.Reals:
        return ALL
    if sol is S.EmptySet:
        return NS
    return frozenset(simplify(v) for v in sol)


def same_solutions(indep, key):
    if isinstance(indep, str) or isinstance(key, str):
        return indep == key
    return len(indep) == len(key) and all(any(simplify(a - b) == 0 for b in key) for a in indep)


SOLVE_Q = ('Solve:', 'Solve by factoring:', 'Use the quadratic formula to solve:', 'Use the quadratic formula:',
           'Solve (convert to same base):')


def h_solve_equation(it):
    q, e = q_eq(it)
    src = None
    if q in SOLVE_Q and e and '=' in e and not re.search(r'[<>]', e) and ' and ' not in e:
        src = e
    else:
        m = re.match(r'^Solve(?: \(convert to same base\))?:\s*(.+=.+)$', q)
        if m and not e:
            src = m.group(1)
    if not src or not has_var(src):
        return None
    indep = solve_eq_text(src)
    if indep is None:
        return None
    key = solution_set(it['a'])
    notes = []
    if isinstance(indep, frozenset) and len(indep) == 0:
        indep = NS
    return ok(same_solutions(indep, key), fmt_sol(indep), 'SymPy solveset over the reals', notes)


def fmt_sol(s):
    if isinstance(s, str):
        return s
    return ' or '.join('x = ' + str(v) for v in sorted(s, key=lambda v: float(v)))


def h_is_solution(it):
    q, e = q_eq(it)
    m = re.match(r'^Is x = (-?\d+) a solution(?: to (.+?))?\?$', q)
    if not m:
        return None
    xv = int(m.group(1))
    cond = m.group(2) or e
    if not cond or cond in ('Substitute.',):
        return None
    truth = holds(cond, xv)
    return ok(norm_word(it['a']) == ('yes' if truth else 'no'), 'yes' if truth else 'no', 'substitution')


def holds(cond, xv):
    parts = re.split(r'\s+OR\s+', cond)
    for p in parts:
        toks = re.split(r'(<=|>=|<|>|=)', p.replace(' ', ''))
        vals = [expr(tk).subs(x, xv) if i % 2 == 0 else tk for i, tk in enumerate(toks)]
        good = True
        for i in range(1, len(vals), 2):
            a, op, b = vals[i - 1], vals[i], vals[i + 1]
            good &= {'<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b, '=': simplify(a - b) == 0}[op] == True
        if good:
            return True
    return False


# ---------------- inequalities ----------------

def solve_ineq_text(s):
    s = plain(s)
    out = S.EmptySet
    for part in re.split(r'\s+OR\s+', s):
        toks = re.split(r'(<=|>=|<|>)', part.replace(' ', ''))
        if len(toks) == 3:
            rel = {'<': lambda a, b: a < b, '>': lambda a, b: a > b, '<=': lambda a, b: a <= b,
                   '>=': lambda a, b: a >= b}[toks[1]](expr(toks[0]), expr(toks[2]))
            if rel is S.true:
                out = out.union(S.Reals)
                continue
            if rel is S.false:
                continue
            out = out.union(reduce_rational_inequalities([[rel]], x, relational=False))
        elif len(toks) == 5:
            a, o1, m, o2, b = toks
            r1 = {'<': lambda p, q: p < q, '<=': lambda p, q: p <= q}[o1](expr(a), expr(m))
            r2 = {'<': lambda p, q: p < q, '<=': lambda p, q: p <= q}[o2](expr(m), expr(b))
            out = out.union(reduce_rational_inequalities([[r1, r2]], x, relational=False))
        else:
            return None
    return out


def h_inequality(it):
    q, e = q_eq(it)
    src = None
    if (q.startswith('Solve') or q.startswith('Solve and write')) and e and re.search(r'[<>]', e):
        src = e
    m = re.match(r'^Solve \(or\):\s*(.+)$', q)
    if m and not e:
        src = m.group(1)
    if not src:
        return None
    indep = solve_ineq_text(src)
    if indep is None:
        return None
    try:
        key = ineq_set(it['a'])
    except Exception as ex:  # unparseable key is itself a finding
        return Verdict('mismatch', str(indep), 'SymPy reduce_inequalities', ['key does not parse: ' + str(ex)])
    return ok(indep == key, indep, 'SymPy reduce_inequalities')


def h_ineq_words(it):
    q, _ = q_eq(it)
    m = re.match(r'^Read backwards:\s*(.+)$', q)
    if m:
        return ok(ineq_set(m.group(1)) == ineq_set(it['a']) and plain(it['a']).startswith('x'),
                  ineq_set(m.group(1)), 'set equality; key must start with x')
    m = re.match(r'^Write the inequality: x is (at least|at most|more than|less than) (-?\d+)$', q)
    if m:
        op = {'at least': '>=', 'at most': '<=', 'more than': '>', 'less than': '<'}[m.group(1)]
        s = ineq_set('x ' + op + ' ' + m.group(2))
        return ok(s == ineq_set(it['a']), 'x ' + op + ' ' + m.group(2), 'phrase table')
    m = re.match(r'^Which type of circle is used for x (<=|>=|<|>) -?\d+\?$', q)
    if m:
        want = 'closed' if '=' in m.group(1) else 'open'
        return ok(norm_word(it['a']) == want, want, 'open for strict, closed for inclusive')
    m = re.match(r'^Which arrow direction for x (<=|>=|<|>) -?\d+\?$', q)
    if m:
        want = 'left' if '<' in m.group(1) else 'right'
        return ok(norm_word(it['a']) == want, want, 'direction of the inequality')
    return None


# ---------------- systems ----------------

SYS_Q = re.compile(r'^(Solve the system by graphing|Solve by substitution|Solve by elimination(?: \(multiply first\))?):$')


def solve_system(eqs):
    sol = linsolve([e.lhs - e.rhs for e in eqs], [x, y])
    if sol is S.EmptySet or len(sol) == 0:
        return NS
    (sx, sy), = list(sol)
    if sx.free_symbols or sy.free_symbols:
        return ALL
    return (simplify(sx), simplify(sy))


def h_system(it):
    q, e = q_eq(it)
    if not SYS_Q.match(q) or ' and ' not in e:
        return None
    eqs = [equation(p) for p in re.split(r'\s+and\s+', e)]
    indep = solve_system(eqs)
    key = special(it['a']) or point(it['a'])
    if key is None:
        return Verdict('mismatch', str(indep), 'SymPy linsolve', ['key does not parse as (x, y)'])
    if isinstance(indep, tuple) and isinstance(key, tuple):
        return ok(all(simplify(a - b) == 0 for a, b in zip(indep, key)), indep, 'SymPy linsolve')
    return ok(indep == key, indep, 'SymPy linsolve')


def h_is_system_solution(it):
    q, e = q_eq(it)
    m = re.match(r'^Is \((-?\d+), (-?\d+)\) a solution to the system\?$', q)
    if not m:
        return None
    px, py = int(m.group(1)), int(m.group(2))
    eqs = [equation(p) for p in re.split(r'\s+and\s+', e)]
    truth = all(simplify((q.lhs - q.rhs).subs({x: px, y: py})) == 0 for q in eqs)
    notes = []
    if solve_system(eqs) == ALL:
        notes.append('the two equations are the same line (infinitely many solutions)')
    return ok(norm_word(it['a']) == ('yes' if truth else 'no'), 'yes' if truth else 'no', 'substitution', notes)


def h_word_system(it):
    q, e = q_eq(it)
    m = re.match(r'^x \+ y = (-?\d+), (-?\d+)x - y = (-?\d+)\. Find x and y\.$', e)
    if not m:
        return None
    sol = solve_system([Eq(x + y, int(m.group(1))), Eq(int(m.group(2)) * x - y, int(m.group(3)))])
    f = fields(it['a'])
    return ok(sol == (number(f['x']), number(f['y'])), sol, 'SymPy linsolve')


# ---------------- lines (unit 8) ----------------

def pts(s):
    return [(Rational(a), Rational(b)) for a, b in re.findall(r'\((-?\d+),\s*(-?\d+)\)', s)]


def slope_of(p, q):
    if p[0] == q[0]:
        return 'undefined'
    return (q[1] - p[1]) / (q[0] - p[0])


def key_num_or_word(a):
    w = norm_word(a)
    if w in ('undefined', 'positive', 'negative'):
        return w
    return number(a)


def h_slope(it):
    q, e = q_eq(it)
    if q == 'Find the slope:' and e.startswith('Points:'):
        p = pts(e)
        s = slope_of(*p)
        return ok(s == key_num_or_word(it['a']), s, 'rise over run')
    if q == 'Is this slope positive or negative?' and e.startswith('Points:'):
        s = slope_of(*pts(e))
        w = 'positive' if s > 0 else 'negative'
        return ok(norm_word(it['a']) == w, w, 'sign of rise over run')
    m = re.match(r'^What is the slope of ([xy]) = (-?\d+)\?$', q)
    if m:
        s = 'undefined' if m.group(1) == 'x' else 0
        return ok(key_num_or_word(it['a']) == s, s, 'horizontal 0, vertical undefined')
    return None


def line_from_text(e):
    """Returns (m, b) from 'y = ...' or a standard-form equation."""
    from sympy import solve
    eqn = equation(e)
    (yy,) = solve(eqn, y)
    p = Poly(expand(yy), x)
    return p.coeff_monomial(x), p.coeff_monomial(1)


def key_line(a):
    s = plain(a)
    if re.match(r'^x\s*=', s):
        return ('x', number(s.split('=')[1]))
    return line_from_text(s if '=' in s else 'y = ' + s)


def h_lines(it):
    q, e = q_eq(it)
    if q in ('Identify slope and y-intercept:', 'What is the slope and y-intercept?'):
        m_, b_ = line_from_text(e)
        f = fields(it['a'])
        return ok(number(f['slope']) == m_ and number(f['y-intercept']) == b_,
                  f'slope = {m_}, y-intercept = {b_}', 'solve for y')
    if q in ('What is the y-intercept of:', 'What is the y-intercept?') and e.startswith('y'):
        return ok(number(it['a']) == line_from_text(e)[1], line_from_text(e)[1], 'constant term')
    if q in ('What is the slope of:', 'What is the slope?'):
        return ok(number(it['a']) == line_from_text(e)[0], line_from_text(e)[0], 'x coefficient')
    if q == 'Find the y-intercept:' and 'y' in e:
        return ok(number(it['a']) == line_from_text(e)[1], line_from_text(e)[1], 'set x = 0')
    if q == 'What is the starting point (y-intercept) to graph:':
        b_ = line_from_text(e)[1]
        return ok(point(it['a']) == (0, b_), (0, b_), 'set x = 0')
    if q.startswith('Write the equation') and ('slope' in e or 'through' in e):
        ms = re.search(r'slope = (-?[\d/]+)', e)
        ps = pts(e)
        if ms:
            m_ = Rational(ms.group(1))
            if 'y-intercept' in e:
                b_ = Rational(re.search(r'y-intercept = (-?\d+)', e).group(1))
            else:
                b_ = ps[0][1] - m_ * ps[0][0]
        else:
            m_ = slope_of(ps[0], ps[1])
            b_ = ps[0][1] - m_ * ps[0][0]
        return ok(key_line(it['a']) == (m_, b_), f'y = {m_}x + {b_}', 'point-slope')
    m = re.match(r'^Write the equation of a line parallel to y = (.+) through \((-?\d+), (-?\d+)\)$', q)
    if m:
        m_ = line_from_text('y = ' + m.group(1))[0]
        b_ = int(m.group(3)) - m_ * int(m.group(2))
        return ok(key_line(it['a']) == (m_, b_), f'y = {m_}x + {b_}', 'same slope')
    if q == 'Find the x-intercept and y-intercept:':
        eqn = equation(e)
        xi = list(solveset(eqn.subs(y, 0), x))[0]
        yi = list(solveset(eqn.subs(x, 0), y))[0]
        f = fields(it['a'])
        return ok(number(f['x-intercept']) == xi and number(f['y-intercept']) == yi,
                  f'x-intercept = {xi}, y-intercept = {yi}', 'cover-up method')
    if q == 'Find the x-intercept:':
        xi = list(solveset(equation(e).subs(y, 0), x))[0]
        return ok(number(it['a']) == xi, xi, 'set y = 0')
    if q == 'Convert to slope-intercept form:':
        return ok(key_line(it['a']) == line_from_text(e), 'y = %sx + %s' % line_from_text(e), 'solve for y')
    if q.startswith('Are these lines parallel'):
        a, b = re.split(r'\s+and\s+', e)
        m1, m2 = line_from_text(a)[0], line_from_text(b)[0]
        w = 'parallel' if m1 == m2 else 'perpendicular' if m1 * m2 == -1 else 'neither'
        return ok(norm_word(it['a']) == w, w, 'compare slopes')
    if q == 'Does this line have a positive or negative slope?':
        w = 'positive' if line_from_text(e)[0] > 0 else 'negative'
        return ok(norm_word(it['a']) == w, w, 'sign of slope')
    if q == 'What is the equation of this special line?':
        pt = pts(e)[0]
        want = ('x', pt[0]) if e.startswith('Vertical') else (0, pt[1])
        return ok(key_line(it['a']) == want, want, 'horizontal y = k, vertical x = h')
    m = re.match(r'^What is the equation of the horizontal line through \((-?\d+), (-?\d+)\)\?$', q)
    if m:
        return ok(key_line(it['a']) == (0, int(m.group(2))), 'y = ' + m.group(2), 'y = k')
    if q == 'Identify the type of line:':
        w = 'horizontal' if e.startswith('y') else 'vertical'
        return ok(norm_word(it['a']) == w, w, 'y = k is horizontal')
    if q in ('What is the slope of a horizontal line?', 'What is the slope of a vertical line?'):
        w = 0 if 'horizontal' in q else 'undefined'
        return ok(key_num_or_word(it['a']) == w, w, 'definition')
    return None


def boundary(e):
    s = plain(e).replace(' ', '')
    op = re.search(r'(<=|>=|<|>)', s).group(1)
    l, r = s.split(op)
    if l == 'y':
        return op, line_from_text('y=' + r)
    # solve linear inequality for y, flipping on negative coefficient
    L, R = expr(l), expr(r)
    cy = Poly(expand(L - R), y).coeff_monomial(y)
    rest = -(expand(L - R) - cy * y) / cy
    if cy < 0:
        op = {'<': '>', '>': '<', '<=': '>=', '>=': '<='}[op]
    p = Poly(expand(rest), x)
    return op, (p.coeff_monomial(x), p.coeff_monomial(1))


def h_lin_ineq(it):
    q, e = q_eq(it)
    if not e or not re.search(r'[<>]', e) or 'y' not in e:
        return None
    op, (m_, b_) = boundary(e)
    style = 'solid' if '=' in op else 'dashed'
    shade = 'above' if '>' in op else 'below'
    if q in ('Is the boundary line dashed or solid?', 'Solve for y. Is the boundary dashed or solid?'):
        return ok(norm_word(it['a']) == style, style, 'strict -> dashed')
    if q in ('Do you shade above or below the boundary?', 'Solve for y. Shade above or below?'):
        return ok(norm_word(it['a']) == shade, shade, 'y > -> above')
    if q.startswith('Solve for y. State boundary type AND shade'):
        return ok(norm_word(it['a']) == style + shade, style + ', ' + shade, 'strict -> dashed; y > -> above')
    if q.startswith('Solve for y. What is the boundary line'):
        return ok(key_line(it['a']) == (m_, b_), f'y = {m_}x + {b_}', 'solve for y')
    if q == 'Is the point (0, 0) in the solution region?':
        truth = holds(e.replace('y', '(0)'), 0)
        return ok(norm_word(it['a']) == ('yes' if truth else 'no'), 'yes' if truth else 'no', 'test point')
    return None


# ---------------- functions (unit 7) ----------------

def pairs(s):
    return [(int(a), int(b)) for a, b in re.findall(r'\((-?\d+),\s*(-?\d+)\)', s)]


def table(q):
    m = re.search(r'x = ([-\d, ]+?)[;.]\s*y = ([-\d, ]+?)\.', q)
    if not m:
        return None
    xs = [int(v) for v in m.group(1).split(',')]
    ys = [int(v) for v in m.group(2).split(',')]
    return list(zip(xs, ys))


def key_list(a):
    return sorted(int(v) for v in re.findall(r'-?\d+', plain(a)))


def h_functions(it):
    q, e = q_eq(it)
    if q == 'Is this a function?' and e.startswith('{'):
        p = pairs(e)
        fn = all(b1 == b2 for a1, b1 in p for a2, b2 in p if a1 == a2)
        return ok(norm_word(it['a']) == ('yes' if fn else 'no'), 'yes' if fn else 'no', 'no repeated input')
    m = re.match(r'^Find the (domain|range)(?: of this table)?[:.]', q)
    if m:
        p = pairs(e) if e.startswith('{') else table(q)
        vals = sorted(set(a if m.group(1) == 'domain' else b for a, b in p))
        return ok(key_list(it['a']) == vals, '{' + ','.join(map(str, vals)) + '}', 'collect distinct values')
    m = re.match(r'^Table: x = ([-\d,]+); y = ([-\d,]+)\. Is this linear\?$', q)
    if m:
        xs = [int(v) for v in m.group(1).split(',')]
        ys = [int(v) for v in m.group(2).split(',')]
        rates = {Rational(ys[i + 1] - ys[i], xs[i + 1] - xs[i]) for i in range(len(xs) - 1)}
        w = 'linear' if len(rates) == 1 else 'notlinear'
        return ok(norm_word(it['a']) == w, w, 'constant rate of change')
    m = re.match(r'^(?:The graph shows )?([fghk])\(x\) = (.+?)\.(?: Use the graph to)? Find \1\((-?\d+)\)\.$', q)
    if m:
        v = expr(m.group(2)).subs(x, int(m.group(3)))
        k = number(plain(it['a']).split('=')[-1])
        return ok(v == k and plain(it['a']).replace(' ', '').startswith(f'{m.group(1)}({m.group(3)})='), v,
                  'substitution')
    m = re.match(r'^([fghk])\(x\) = (.+?)\. If \1\(x\) = (-?\d+), find x\.$', q)
    if m:
        sol = solve_eq_text(f'{m.group(2)} = {m.group(3)}')
        return ok(same_solutions(sol, solution_set(it['a'])), fmt_sol(sol), 'SymPy solveset')
    m = re.match(r'^Is y = (.+) a linear function\?$', q)
    if m:
        body = m.group(1).replace('x squared', 'x^2')
        ex = expr(body)
        lin = ex.is_polynomial(x) and Poly(ex, x).degree() <= 1
        w = 'linear' if lin else 'notlinear'
        return ok(norm_word(it['a']) == w, w, 'degree <= 1 polynomial')
    return None


# ---------------- exponents / exponentials (unit 12) ----------------

def h_exponential(it):
    q, e = q_eq(it)
    m = re.match(r'^Evaluate y = (.+) when x = (-?\d+)$', q)
    if m:
        v = expr(m.group(1)).subs(x, int(m.group(2)))
        return ok(v == number(it['a']), v, 'substitution')
    m = re.match(r'^Is y = (.+) growth or decay\?$', q)
    if m:
        ex = expr(m.group(1))
        b = simplify(ex.subs(x, 1) / ex.subs(x, 0))
        w = 'growth' if b > 1 else 'decay'
        return ok(norm_word(it['a']) == w, w, 'b > 1 growth')
    m = re.match(r'^What is the y-intercept of y = (.+)\?$', q)
    if m:
        v = expr(m.group(1)).subs(x, 0)
        return ok(v == number(it['a']), v, 'x = 0')
    m = re.match(r'^Find the average rate of change of y = (.+) from x = (-?\d+) to x = (-?\d+)$', q)
    if m:
        f = expr(m.group(1))
        a, b = int(m.group(2)), int(m.group(3))
        v = (f.subs(x, b) - f.subs(x, a)) / (b - a)
        return ok(v == number(it['a']), v, 'difference quotient')
    m = re.match(r'^Table: x=([\d,]+) and y=([\d.,]+)\. (Write the equation|Find b \(the common ratio\)|Is this growth or decay\?)', q)
    if m:
        xs = [int(v) for v in m.group(1).split(',')]
        ys = [nsimplify(v) for v in m.group(2).split(',')]
        ratios = {ys[i + 1] / ys[i] for i in range(len(ys) - 1)}
        if len(ratios) != 1:
            return Verdict('mismatch', 'not exponential', 'ratio test', ['table has no common ratio'])
        b = ratios.pop()
        a0 = ys[0]
        if m.group(3).startswith('Write'):
            k = expr(plain(it['a']).split('=', 1)[1])
            return ok(simplify(k - a0 * b ** x) == 0, f'y = {a0}({b})^x', 'common ratio')
        if m.group(3).startswith('Find b'):
            return ok(number(it['a']) == b, b, 'common ratio')
        w = 'growth' if b > 1 else 'decay'
        return ok(norm_word(it['a']) == w, w, 'common ratio')
    m = re.match(r'^y-intercept = (\d+), common ratio = (\d+)\. Write the equation\.$', q)
    if m:
        k = expr(plain(it['a']).split('=', 1)[1])
        return ok(simplify(k - int(m.group(1)) * int(m.group(2)) ** x) == 0, '', 'a*b^x')
    return None


# ---------------- polynomials / factoring ----------------

def h_poly_facts(it):
    q, e = q_eq(it)
    if q in ('Identify the degree:', 'What is the degree?'):
        d = Poly(expr(e), x).degree()
        return ok(number(it['a']) == d, d, 'highest power')
    if q.startswith('What is the degree of a constant'):
        return ok(number(it['a']) == 0, 0, 'definition')
    if q in ('Identify the leading coefficient:', 'What is the leading coefficient?'):
        c = Poly(expr(e), x).LC()
        return ok(number(it['a']) == c, c, 'coefficient of highest power')
    if q.startswith('Is this a monomial') or q.startswith('Classify as monomial'):
        n = len(expand(expr(e)).as_ordered_terms())
        w = {1: 'monomial', 2: 'binomial', 3: 'trinomial'}[n]
        return ok(norm_word(it['a']) == w, w, 'count terms')
    return None


def is_factored_form(k):
    """A product: no top-level + or - between factors."""
    s = plain(k).replace(' ', '')
    depth = 0
    for i, ch in enumerate(s):
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        elif ch in '+-' and depth == 0 and i > 0:
            return False
    return True


def h_factor(it):
    q, e = q_eq(it)
    if q not in ('Factor:', 'Factor out the GCF:'):
        return None
    v = expand(expr(e))
    k = expr(it['a'])
    same = simplify(expand(k) - v) == 0
    notes = []
    if not is_factored_form(it['a']):
        notes.append('key is not written as a product')
    if q == 'Factor out the GCF:':
        m = re.match(r'^(-?\d*)(x(?:\^\(?\d+\)?)?)?\((.+)\)$', plain(it['a']).replace(' ', ''))
        if m:
            inner = Poly(expr(m.group(3)), x)
            from math import gcd
            from functools import reduce
            g = reduce(gcd, [int(c) for c in inner.coeffs()])
            if g != 1:
                notes.append('remaining polynomial still has a common numeric factor')
            if all(mon[0] > 0 for mon in inner.monoms()):
                notes.append('remaining polynomial still has a common x factor')
    else:
        # every non-constant factor should be irreducible over the integers
        c, facs = factor_list(v)
        full = sum(m for _, m in facs)
        kc, kf = factor_list(k)
        if sum(m for _, m in kf) < full:
            notes.append('key is not factored completely')
    return ok(same and not notes, v, 'SymPy expand(key) == problem; factor_list', notes)


# ---------------- quadratics (units 15-16) ----------------

def quad(e):
    s = plain(e)
    s = re.sub(r'^[yh]\(?t?\)?\s*=\s*', '', s) if '=' in s and not s.rstrip().endswith('= 0') else s
    s = re.sub(r'=\s*0\s*$', '', s)
    var = t if 't' in s else x
    p = Poly(expand(expr(s).subs(t, x) if var is t else expr(s)), x)
    return p


def h_quadratic(it):
    q, e = q_eq(it)
    if not e or not re.search(r'\^2|x\^\(2\)', e.replace(' ', '')):
        if not e.startswith('h(t)'):
            return None
    try:
        p = quad(e)
    except Exception:
        return None
    if p.degree() != 2:
        return None
    a, b, c = (p.coeff_monomial(x ** 2), p.coeff_monomial(x), p.coeff_monomial(1))
    h = -b / (2 * a)
    k = p.eval(h)
    D = b * b - 4 * a * c
    nsol = 'two solutions' if D > 0 else 'one solution' if D == 0 else 'no real solutions'
    w = norm_word(it['a'])
    if q.startswith('Identify a, b'):
        f = fields(it['a'])
        return ok((number(f['a']), number(f['b']), number(f['c'])) == (a, b, c), f'a={a}, b={b}, c={c}', 'read coefficients')
    if q == 'Identify a:':
        return ok(number(it['a']) == a, a, 'read coefficient')
    if 'open up or down' in q:
        return ok(w == ('up' if a > 0 else 'down'), 'up' if a > 0 else 'down', 'sign of a')
    if 'minimum or maximum' in q or 'min or max' in q:
        ww = 'minimum' if a > 0 else 'maximum'
        return ok(w == ww, ww, 'sign of a')
    if 'narrower or wider' in q:
        ww = 'narrower' if abs(a) > 1 else 'wider'
        return ok(w == ww, ww, '|a| vs 1')
    if q in ('What is the y-intercept?', 'Find the y-intercept:', 'What is the initial height of the ball?',
             'What is the initial height?'):
        return ok(number(re.sub(r'^\(0,\s*|\)$', '', plain(it['a']))) == c, c, 'constant term')
    if q.startswith('Find the axis of symmetry:') or q.startswith('Identify the axis of symmetry') or \
            q == 'What is the axis of symmetry?':
        return ok(number(plain(it['a']).split('=')[-1]) == h, f'x = {h}', '-b/2a')
    if q in ('Find the vertex:', 'Identify the vertex:'):
        return ok(point(it['a']) == (h, k), (h, k), '(-b/2a, f(-b/2a))')
    if 'time' in q and 'maximum' in q:
        return ok(number(it['a']) == h, h, '-b/2a')
    if q.startswith('What is the maximum height'):
        return ok(number(it['a']) == k, k, 'f(-b/2a)')
    if q.startswith('When does the ball hit the ground'):
        roots = sorted(r for r in solveset(p.as_expr(), x, S.Reals))
        return ok(number(it['a']) == roots[-1], roots[-1], 'positive root')
    if q.startswith('What are the zeros'):
        roots = solveset(p.as_expr(), x, S.Reals)
        kk = {number(v) for v in re.findall(r'-?\d+(?:\.\d+)?', plain(it['a']))}
        return ok(kk == set(roots), roots, 'SymPy roots')
    if q.startswith('Find the discriminant and number'):
        return ok(w == norm_word(f'D={D}, {nsol}'), f'D={D}, {nsol}', 'b^2 - 4ac')
    if q.startswith('Find the discriminant'):
        return ok(number(it['a']) == D, D, 'b^2 - 4ac')
    if 'how many' in q.lower() and 'solution' in q.lower():
        return ok(w == norm_word(nsol), nsol, 'sign of discriminant')
    if q.startswith('Does this parabola have x-intercepts'):
        ww = 'yes' if D >= 0 else 'no'
        return ok(w == ww, ww, 'discriminant')
    if q.startswith('Find the axis of symmetry and vertex'):
        return ok(w == norm_word(f'x={h}, vertex=({h},{k})'), f'x={h}, vertex=({h},{k})', '-b/2a')
    if q.startswith('Identify: AOS, vertex'):
        ww = f'x={h}, vertex=({h},{k}), y-int={c}, ' + ('up' if a > 0 else 'down')
        return ok(w == norm_word(ww), ww, 'standard-form facts')
    if q.startswith('Find the y-intercept and vertex'):
        ww = f'y-intercept={c}, vertex=({h},{k})'
        return ok(w == norm_word(ww), ww, 'standard-form facts')
    if q.startswith('What is the vertex and direction'):
        ww = f'vertex=({h},{k}), opens ' + ('up' if a > 0 else 'down')
        return ok(w == norm_word(ww), ww, 'standard-form facts')
    return None


def h_vertex_form(it):
    q, e = q_eq(it)
    m = re.match(r'^vertex = \((-?\d+), (-?\d+)\), a = (-?\d+)$', e)
    if not (q.startswith('Write') and m):
        return None
    hh, kk, aa = int(m.group(1)), int(m.group(2)), int(m.group(3))
    want = aa * (x - hh) ** 2 + kk
    s = plain(it['a'])
    k = expr(s.split('=', 1)[1])
    vertex_shape = re.fullmatch(r'y=-?\d*\(x[+-]\d+\)\^2[+-]\d+|y=-?\d*\(x\)\^2[+-]\d+', s.replace(' ', ''))
    notes = [] if vertex_shape else ['key is not written in vertex form']
    return ok(simplify(expand(k - want)) == 0 and not notes, f'y = {aa}(x - {hh})^2 + {kk}', 'a(x-h)^2+k', notes)


def h_compare_vertex(it):
    q, _ = q_eq(it)
    m = re.match(r'^How does y = (-?[\d/]*)\(x-\d\)\^2 \+ \d compare to y = \(x-\d\)\^2 \+ \d\?$', q)
    if not m:
        return None
    a = Rational(m.group(1) or 1)
    w = 'narrower' if abs(a) > 1 else 'wider'
    return ok(norm_word(it['a']) == w, w, '|a| vs 1')


def h_vertex_given(it):
    q, _ = q_eq(it)
    m = re.match(r'^The vertex of a (?:ball\'s path|trajectory) is \((\d+), (\d+)\)\. What is the max(?:imum)? height\?$', q)
    if not m:
        return None
    return ok(number(it['a']) == int(m.group(2)), m.group(2), 'k of the vertex')


HANDLERS = [h_inequality, h_ineq_words, h_is_solution, h_system, h_is_system_solution, h_word_system,
            h_slope, h_lin_ineq, h_lines, h_functions, h_exponential, h_poly_facts, h_factor,
            h_vertex_form, h_compare_vertex, h_vertex_given, h_quadratic, h_evaluate, h_arith, h_expr,
            h_solve_equation]
