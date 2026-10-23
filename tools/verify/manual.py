"""Hand-derived independent answers for items no automatic handler covers:
word problems, concept questions, and pictures. Each entry states the
independent working (an equation SymPy solves, a reading of the drawn graph
in maths coordinates via svgread.py, or a definition) and is compared to the
site's key. Nothing here reads the site's key to produce the answer.
"""
import re

from sympy import Eq, Rational, Symbol, expand, nsimplify, simplify, solve, symbols

from handlers import Verdict, norm_word
from mathtext import expr, number, plain, x, y

A, B, C, D, N, W, L, H, M, T_ = symbols('A B C D N W L H M T_')


def _v(cond, indep, method, notes=None):
    return Verdict('match' if cond else 'mismatch', str(indep), method, notes or [])


def word(*accept, method='definition'):
    acc = [norm_word(a) for a in accept]
    return lambda it: _v(norm_word(it['a']) in acc, accept[0], method)


def num(value, method):
    value = nsimplify(value, rational=True)
    return lambda it: _v(number(re.sub(r'[^\d.\-/]', '', plain(it['a']).replace(',', ''))) == value, value, method)


def rounded(value, places, method):
    from decimal import Decimal, ROUND_HALF_UP  # schools round halves up: 1157.625 -> 1157.63
    v = float(Decimal(str(float(value))).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP))
    want = int(v) if places == 0 else v
    return lambda it: _v(abs(float(plain(it['a']).replace(',', '')) - v) < 1e-9, want,
                         f'{method}; rounded to {places} places')


def nums(values, method, ordered=False):
    vals = [nsimplify(v, rational=True) for v in values]

    def f(it):
        got = [nsimplify(g, rational=True) for g in re.findall(r'-?\d+(?:\.\d+)?', plain(it['a']).replace(',', ''))]
        ok = got == vals if ordered else sorted(got) == sorted(vals)
        return _v(ok, ', '.join(map(str, vals)), method)
    return f


def solve_for(eqn, var, method=None):
    sol = solve(eqn, var)
    assert len(sol) >= 1, eqn
    pos = [s for s in sol if s.is_real and s >= 0] or sol
    return num(pos[0], method or f'SymPy solve {eqn}')


def expr_is(mine, method='translation'):
    target = expr(mine)
    return lambda it: _v(simplify(expr(re.sub(r'^\s*[A-Za-z]\s*=', '', plain(it['a']))) - target) == 0, mine, method)


def equation_is(mine, method='translation'):
    l, r = mine.split('=')
    target = expand(expr(l) - expr(r))

    def f(it):
        kl, kr = plain(it['a']).split('=')
        k = expand(expr(kl) - expr(kr))
        return _v(simplify(k - target) == 0 or simplify(k + target) == 0, mine, method)
    return f


def mismatch(indep, method, note):
    return lambda it: Verdict('mismatch', indep, method, [note])


def graph(indep, reading):
    """A picture item. `reading` is what svgread.py recovers from the SVG."""
    def f(it):
        k = plain(it['a'])
        if isinstance(indep, tuple):
            m = re.findall(r'-?\d+', k)
            ok = tuple(int(v) for v in m) == indep
        else:
            ok = norm_word(k) in [norm_word(i) for i in (indep if isinstance(indep, list) else [indep])]
        return _v(ok, indep, 'read from the drawn SVG: ' + reading)
    return f


U4, U6, U7, U8, U9, U10, U12, U15, U16 = ('unit1-4.html', 'unit6.html', 'unit7.html', 'unit8.html', 'unit9.html',
                                          'unit10.html', 'unit12.html', 'unit15.html', 'unit16.html')

MANUAL = {
    # ---- Units 1-4: concepts ----
    f'{U4}:bank:unit3:3': word('no', method='3x and 5 are unlike terms'),
    f'{U4}:bank:unit3:10': word('no', method='x^2 and x are unlike terms'),
    f'{U4}:test:3.2:13': word('no', method='4x and 2 are unlike terms'),
    f'{U4}:bank:unit4:8': num(5, 'coefficient of x in 5x - 7'),
    f'{U4}:bank:unit4:9': num(-7, 'constant term of 5x - 7 (sign included)'),
    f'{U4}:bank:unit4:12': word('equation', method='it has an equals sign'),

    # ---- Unit 6: number lines (svgread: open/closed circle position, arrow side) ----
    f'{U6}:bank:6.1:0': graph('x>3', 'open circle at 3, arrow right'),
    f'{U6}:bank:6.1:1': graph('x<=-2', 'closed circle at -2, arrow left'),
    f'{U6}:bank:6.1:2': graph('x<0', 'open circle at 0, arrow left'),
    f'{U6}:bank:6.1:3': graph('x>=5', 'text: closed circle at 5, arrow right'),
    f'{U6}:test:6.1:0': graph('x<=-2', 'closed circle at -2, arrow left'),
    f'{U6}:test:6.1:1': graph('x>=1', 'closed circle at 1, arrow right'),

    # ---- Unit 7 ----
    f'{U7}:bank:7.1:3': word('no', method='one input, two outputs'),
    f'{U7}:bank:7.1:4': graph('no', 'circle centred at the origin; fails the vertical line test'),
    f'{U7}:bank:7.1:5': graph('yes', 'upward parabola; passes the vertical line test'),
    f'{U7}:bank:7.1:7': word('yes', method='each x appears once'),
    f'{U7}:bank:7.1:8': word('no', method='input 2 has two outputs'),
    f'{U7}:bank:7.1:9': word('individual unconnected dots', 'dots', 'unconnected dots', method='definition'),
    f'{U7}:bank:7.1:10': word('connected curve', 'connected', method='definition'),
    f'{U7}:bank:7.1:12': word('no', method='vertical line test fails'),
    f'{U7}:bank:7.1:13': word('yes', method='non-vertical line passes the vertical line test'),
    f'{U7}:bank:7.2:8': word('Cartesian plane', 'coordinate plane', method='definition'),
    f'{U7}:bank:7.2:9': word('x-axis', method='definition'),
    f'{U7}:bank:7.2:10': word('y-axis', method='definition'),
    f'{U7}:bank:7.2:13': word('(0,0)', method='definition'),
    f'{U7}:bank:7.3:9': word('linear', method='definition'),
    f'{U7}:bank:7.3:10': word('not linear', method='definition'),
    f'{U7}:bank:7.3:13': word('true', method='definition'),
    f'{U7}:test:7.1:0': graph('yes', 'upward parabola; passes'),
    f'{U7}:test:7.1:1': graph('no', 'circle; fails'),
    f'{U7}:test:7.1:2': word('yes', method='definition'),
    f'{U7}:test:7.1:3': word('no', method='vertical line fails the vertical line test'),
    f'{U7}:test:7.2:7': word('Cartesian plane', 'coordinate plane', method='definition'),
    f'{U7}:test:7.3:13': word('not linear', method='definition'),
    # The question says "use the graph", so the graph is the source of truth for a student.
    f'{U7}:bank:7.4:0': mismatch('graph reads f(2) = 2; formula gives f(2) = 3', 'svgread',
                                 'GRAPH CONTRADICTS KEY: drawn line is y = 0.5x + 1 (through (-4,-1) and (3,2.5)) and the '
                                 'red point sits at (2, 2) although it is labelled (2, 3). The formula f(x) = x + 1 gives 3.'),
    f'{U7}:test:7.4:15': mismatch('graph reads f(3) = 1.5; formula gives f(3) = 2', 'svgread',
                                  'GRAPH CONTRADICTS KEY: drawn line is y = 0.5x (through the origin) and the red point sits '
                                  'at (3, 1.5) although it is labelled (3,2). The formula f(x) = x - 1 gives 2.'),

    # ---- Unit 8: graphs ----
    f'{U8}:bank:8.1:0': graph(['2'], 'line through (-1,-1) and (1,3): slope 2'),
    f'{U8}:bank:8.1:1': graph(['-1'], 'line through (0,2) and (2,0): slope -1'),
    f'{U8}:test:8.1:0': graph(['3'], 'line through (0,-1) and (1,2): slope 3'),
    f'{U8}:test:8.1:1': graph(['-2'], 'line through (0,2) and (1,0): slope -2'),
    f'{U8}:bank:8.5:0': graph('dashed', 'boundary drawn with stroke-dasharray'),
    f'{U8}:test:8.5:20': graph('dashed', 'boundary drawn with stroke-dasharray'),
    f'{U8}:bank:8.5:1': graph('solid, below', 'solid boundary; shading below'),
    f'{U8}:test:8.5:21': graph('solid, above', 'solid boundary; shading above'),

    # ---- Unit 9: intersection graphs (all read cleanly from svgread) ----
    f'{U9}:bank:9.2:0': graph((1, 2), 'y=x+1 and y=-2x+4 drawn; meet at (1,2) [point is labelled with the answer]'),
    f'{U9}:bank:9.2:6': graph((2, 5), 'meet at (2, 4.95) [point is labelled with the answer]'),
    f'{U9}:bank:9.2:7': graph((2, 1), 'meet at (2,1)'),
    f'{U9}:bank:9.2:8': graph((2, 2), 'meet at (2,2)'),
    f'{U9}:bank:9.2:9': graph((-1, 0), 'meet at (-1,0)'),
    f'{U9}:test:9.2:5': graph((1, 1), 'meet at (1,1)'),
    f'{U9}:test:9.2:6': graph((1, 2), 'meet at (1,2)'),

    # ---- Unit 12 ----
    f'{U12}:bank:12.1:1': graph('decay', 'falling curve'),
    f'{U12}:bank:12.1:3': graph('growth', 'rising curve'),
    f'{U12}:bank:12.2:5': graph('growth', 'rising curve'),
    f'{U12}:test:12.1:1': graph('decay', 'falling curve'),
    f'{U12}:bank:12.1:5': graph(['3'], 'red point on the y-axis at the "3" tick'),
    f'{U12}:test:12.1:2': graph(['4'], 'red point at the "4" tick'),
    f'{U12}:bank:12.2:9': graph(['6'], 'red point at the "6" tick'),
    f'{U12}:test:12.2:7': graph(['5'], 'red point at the "5" tick'),
    f'{U12}:bank:12.1:8': graph('y=0', 'dashed asymptote on the x-axis'),
    f'{U12}:bank:12.2:11': graph('y=0', 'dashed asymptote on the x-axis'),
    f'{U12}:test:12.1:3': graph('y=0', 'dashed asymptote on the x-axis'),
    f'{U12}:test:12.2:9': graph('y=0', 'dashed asymptote on the x-axis'),
    f'{U12}:bank:12.1:9': word('y>0', '0<y', 'y>0', method='a*b^x with a > 0 is always positive'),
    f'{U12}:bank:12.2:8': expr_is('8*(1/2)^x', 'start 8, ratio 1/2'),
    f'{U12}:bank:12.3:0': expr_is('5000*(1.03)^t', 'A = P(1 + r)^t'),
    f'{U12}:bank:12.3:6': expr_is('2000*2^t', 'doubling'),
    f'{U12}:bank:12.3:1': rounded(20000 * Rational(9, 10) ** 3, 0, '20000(0.9)^3'),
    f'{U12}:bank:12.3:2': rounded(1000 * Rational(105, 100) ** 3, 2, '1000(1.05)^3 = 1157.625'),
    f'{U12}:bank:12.3:3': rounded(100 * Rational(122, 100) ** 5, 0, '100(1.22)^5'),
    f'{U12}:bank:12.3:4': rounded(1200 * Rational(95, 100) ** 10, 0, '1200(0.95)^10'),
    f'{U12}:bank:12.3:5': rounded(500 * Rational(8, 10) ** 2, 0, '500(0.8)^2'),
    f'{U12}:bank:12.3:7': rounded(Rational(495, 100) * Rational(1028, 1000) ** 2, 2, '4.95(1.028)^2'),
    f'{U12}:bank:12.3:8': rounded(250000 * Rational(104, 100) ** 5, 0, '250000(1.04)^5'),
    f'{U12}:bank:12.3:9': rounded(30000 * Rational(85, 100) ** 4, 0, '30000(0.85)^4, 2026 to 2030 is 4 years'),
    f'{U12}:bank:12.3:10': rounded(50 * Rational(13, 10) ** 4, 0, '50(1.3)^4'),
    f'{U12}:bank:12.3:11': rounded(500 * Rational(106, 100) ** 10, 0, '500(1.06)^10'),
    f'{U12}:bank:12.3:12': rounded(80000 * Rational(98, 100) ** 5, 0, '80000(0.98)^5'),
    f'{U12}:bank:12.3:13': word('A=A0(1-r)^t', 'A=A0(1-r)t', method='decay model'),
    f'{U12}:bank:12.3:14': rounded(1000 * Rational(1, 2) ** 3, 0, '1000(0.5)^3'),
    f'{U12}:test:12.3:10': rounded(800 * Rational(75, 100) ** 2, 0, '800(0.75)^2'),
    f'{U12}:test:12.3:11': rounded(2000 * Rational(104, 100) ** 5, 0, '2000(1.04)^5'),
    f'{U12}:test:12.3:12': rounded(600 * Rational(15, 10) ** 3, 0, '600(1.5)^3'),
    f'{U12}:test:12.3:13': word('A=A0(1+r)^t', 'A=A0(1+r)t', method='growth model'),
    f'{U12}:test:12.3:14': rounded(400 * Rational(7, 10) ** 2, 0, '400(0.7)^2'),

    # ---- Unit 15: graphs ----
    f'{U15}:bank:15.2:5': graph('x=2', 'dashed red line at x = 2'),
    f'{U15}:test:15.2:5': graph('x=3', 'dashed red line at x = 3'),
    f'{U15}:bank:15.2:7': graph('maximum', 'downward parabola, vertex at top'),
    f'{U15}:bank:15.3:4': graph('no', 'vertex at (0, 3) above the x-axis, opens up'),
    f'{U15}:test:15.2:6': mismatch('graph reads (1, -2)', 'svgread',
                                   'GRAPH CONTRADICTS KEY: the vertex dot is drawn level with the "-2" label (y-labels -1,-2,-3 '
                                   'sit at 124/136/148 px; dot at 136 px). Key and graphIt say (1, -3).'),
    f'{U15}:test:15.3:10': mismatch('graph reads (0, -4)', 'svgread',
                                    'GRAPH CONTRADICTS KEY: the drawn polyline is symmetric about x = 0 with zeros at -2 and 2 '
                                    '(that is y = x^2 - 4); the vertex dot is on the y-axis. Key and graphIt say (-1, -4).'),

    # ---- Unit 16: graphs ----
    f'{U16}:bank:16.4:3': graph('two solutions', 'crosses at 1 and 3'),
    f'{U16}:bank:16.4:4': graph('one solution', 'touches at 2'),
    f'{U16}:bank:16.4:5': graph('no real solutions', 'vertex above the axis, opens up'),
    f'{U16}:test:16.4:15': graph('two solutions', 'crosses at -1 and 3'),
    f'{U16}:test:16.4:16': graph('no real solutions', 'vertex above the axis, opens up'),

    # ---- Unit 10.1: translations ----
    f'{U10}:bank:10.1:0': expr_is('x + 8'),
    f'{U10}:bank:10.1:1': expr_is('2x - 5'),
    f'{U10}:bank:10.1:2': equation_is('3x + 4 = 19'),
    f'{U10}:bank:10.1:3': expr_is('7x'),
    f'{U10}:bank:10.1:4': equation_is('x - 6 = 10'),
    f'{U10}:bank:10.1:5': expr_is('x/4'),
    f'{U10}:bank:10.1:6': equation_is('2x - 3 = 15'),
    f'{U10}:bank:10.1:7': expr_is('x + 8'),
    f'{U10}:bank:10.1:8': equation_is('5x = 35'),
    f'{U10}:bank:10.1:9': expr_is('x/3'),
    f'{U10}:bank:10.1:10': equation_is('x - 10 = 4'),
    f'{U10}:bank:10.1:11': expr_is('3x'),
    f'{U10}:bank:10.1:12': equation_is('2x + 7 = 21'),
    f'{U10}:bank:10.1:13': expr_is('x - 12'),
    f'{U10}:bank:10.1:14': equation_is('4x = 32'),
    f'{U10}:test:10.1:0': expr_is('6x - 4'),
    f'{U10}:test:10.1:1': equation_is('2x + 9 = 25'),
    f'{U10}:test:10.1:2': expr_is('x - 3'),
    f'{U10}:test:10.1:3': equation_is('x + 11 = 30'),
    f'{U10}:test:10.1:4': expr_is('x/5'),

    # ---- Unit 10.2: number and consecutive-integer problems ----
    f'{U10}:bank:10.2:0': solve_for(Eq(5 * N - 2, 13), N),
    f'{U10}:bank:10.2:1': solve_for(Eq(2 * N + 3, 17), N),
    f'{U10}:bank:10.2:2': solve_for(Eq(140 * H + 500, 1060), H),
    f'{U10}:bank:10.2:3': nums([7, 8, 9], 'n + (n+1) + (n+2) = 24 -> n = 7'),
    f'{U10}:bank:10.2:4': solve_for(Eq(N / 4, 9), N),
    f'{U10}:bank:10.2:5': solve_for(Eq(3 * N - 7, 14), N),
    f'{U10}:bank:10.2:6': solve_for(Eq(N + 15, 42), N),
    f'{U10}:bank:10.2:7': nums([22, 24], 'n + (n+2) = 46 -> n = 22'),
    f'{U10}:bank:10.2:8': solve_for(Eq(90 + 60 * H, 330), H),
    f'{U10}:bank:10.2:9': solve_for(Eq(2 * N + 10, 36), N),
    f'{U10}:bank:10.2:10': solve_for(Eq(N / 3, 12), N),
    f'{U10}:bank:10.2:11': nums([11, 13, 15], 'n + (n+2) + (n+4) = 39 -> n = 11'),
    f'{U10}:bank:10.2:12': solve_for(Eq(N - 18, 7), N),
    f'{U10}:bank:10.2:13': solve_for(Eq(5 * N, 3 * N + 12), N),
    f'{U10}:bank:10.2:14': nums([12, 13, 14, 15], '4n + 6 = 54 -> n = 12'),
    f'{U10}:test:10.2:5': solve_for(Eq(3 * N - 9, 18), N),
    f'{U10}:test:10.2:6': solve_for(Eq(75 + 50 * H, 275), H),
    f'{U10}:test:10.2:7': nums([31, 32], '2n + 1 = 63'),
    f'{U10}:test:10.2:8': solve_for(Eq(2 * N - 14, 20), N),
    f'{U10}:test:10.2:9': nums([19, 20, 21], '3n + 3 = 60'),

    # ---- Unit 10.3: geometry ----
    f'{U10}:bank:10.3:0': nums([6, 11], '2(w + w+5) = 34 -> w = 6', ordered=True),
    f'{U10}:bank:10.3:1': nums([8, 16], '2(w + 2w) = 48 -> w = 8', ordered=True),
    f'{U10}:bank:10.3:2': nums([30, 60, 90], 'x + 2x + 3x = 180'),
    f'{U10}:bank:10.3:3': num(180 - 55 - 75, '180 - 55 - 75'),
    f'{U10}:bank:10.3:4': num(Rational(36, 4), '36 / 4'),
    f'{U10}:bank:10.3:5': nums([5, 8], '2(L-3 + L) = 26 -> L = 8, w = 5', ordered=True),
    f'{U10}:bank:10.3:6': solve_for(Eq((N + 10) + (2 * N - 5) + (N + 15), 180), N),
    f'{U10}:bank:10.3:7': nums([5, 20], '2(w + 4w) = 50 -> w = 5', ordered=True),
    f'{U10}:bank:10.3:8': num(60, '(180 - 60) / 2'),
    f'{U10}:bank:10.3:9': solve_for(Eq(2 * (W + 2 * W + 3), 48), W),
    f'{U10}:bank:10.3:10': solve_for(Eq(10 * N, 360), N),
    f'{U10}:bank:10.3:11': nums([8, 10, 12], '3x + 6 = 30 -> x = 8'),
    f'{U10}:bank:10.3:12': solve_for(Eq(N + 3 * N + 10, 30), N),
    f'{U10}:bank:10.3:13': solve_for(Eq(2 * (W + W + 9), 62), W, '2(w + w+9) = 62 -> w = 11, L = 20') if False else num(20, '2(w + w+9) = 62 -> w = 11, length = 20'),
    f'{U10}:bank:10.3:14': solve_for(Eq(2 * (2 * N - 1) + (N + 4), 31), N,
                                     '2(2x-1) + (x+4) = 31 -> 5x + 2 = 31 -> x = 29/5'),
    f'{U10}:test:10.3:10': solve_for(Eq(2 * (W + W + 3), 26), W),
    f'{U10}:test:10.3:11': nums([40, 60, 80], '9x = 180 -> x = 20'),
    f'{U10}:test:10.3:12': nums([6, 12], '2(w + 2w) = 36 -> w = 6', ordered=True),
    f'{U10}:test:10.3:13': num(180 - 48 - 72, '180 - 48 - 72'),
    f'{U10}:test:10.3:14': solve_for(Eq(N + N + 5 + 2 * N, 37), N),

    # ---- Unit 10.4: linear models ----
    f'{U10}:bank:10.4:0': solve_for(Eq(60 + 40 * H, 220), H),
    f'{U10}:bank:10.4:1': solve_for(Eq(3 + 2 * M, 17), M),
    f'{U10}:bank:10.4:2': num(50 + 30 * 6, '50 + 30(6)'),
    f'{U10}:bank:10.4:3': solve_for(Eq(25 + 10 * M, 5 + 15 * M), M),
    f'{U10}:bank:10.4:4': solve_for(Eq(20 + Rational(1, 10) * T_, 35), T_),
    f'{U10}:bank:10.4:5': equation_is('y = 5 + 2x', 'y = entry + rate * hours'),
    f'{U10}:bank:10.4:6': solve_for(Eq(100 + 25 * H, 275), H),
    f'{U10}:bank:10.4:7': num(11, '30 + 5m < 8m -> m > 10, so the first whole month cable is cheaper is 11'),
    f'{U10}:bank:10.4:8': solve_for(Eq(15 + 10 * N, 75), N),
    f'{U10}:bank:10.4:9': nums([45, 12], 'b is the constant, m the rate', ordered=True),
    f'{U10}:bank:10.4:10': num(30, '200 + 15g <= 650 -> g <= 30'),
    f'{U10}:bank:10.4:11': solve_for(Eq(40 * M, 20 + 35 * M), M),
    f'{U10}:bank:10.4:12': solve_for(Eq(25 + Rational(1, 5) * M, 65), M),
    f'{U10}:bank:10.4:13': solve_for(Eq(75 + 55 * H, 295), H),
    f'{U10}:bank:10.4:14': num(120 * 3 + 20, '120(3) + 20'),
    f'{U10}:test:10.4:15': solve_for(Eq(50 + 35 * H, 190), H),
    f'{U10}:test:10.4:16': solve_for(Eq(40 + 25 * M, 190), M),
    f'{U10}:test:10.4:17': equation_is('y = 12x', 'rate times months'),
    f'{U10}:test:10.4:18': solve_for(Eq(30 + 8 * M, 10 * M), M),
    f'{U10}:test:10.4:19': solve_for(Eq(80 + 60 * H, 320), H),

    # ---- Unit 10.5: systems in context ----
    f'{U10}:bank:10.5:0': solve_for(Eq(10 * A + 6 * (50 - A), 380), A),
    f'{U10}:bank:10.5:1': nums([13, 17], 'a + b = 30, a = b + 4'),
    f'{U10}:bank:10.5:2': solve_for(Eq(Rational(1, 10) * (20 - B) + Rational(1, 4) * B, Rational(7, 2)), B),
    f'{U10}:bank:10.5:3': solve_for(Eq(Rational(1, 2) * (10 - B) + Rational(5, 4) * B, 8), B),
    f'{U10}:bank:10.5:4': nums([75, 105], 'a + b = 180, b = a + 30'),
    f'{U10}:bank:10.5:5': solve_for(Eq(A + 2 * (8 - A), 11), A),
    f'{U10}:bank:10.5:6': nums([18, 27], 'a + b = 45, b - a = 9'),
    f'{U10}:bank:10.5:7': solve_for(Eq(15 * A + 35 * (7 - A), 165), A),
    f'{U10}:bank:10.5:8': nums([30, 60], 'a + 2a = 90'),
    f'{U10}:bank:10.5:9': solve_for(Eq(A + (A - 4), 28), A),
    f'{U10}:bank:10.5:10': solve_for(Eq(5 * A + 2 * (6 - A), 21), A),
    f'{U10}:bank:10.5:11': nums([9, 17], 's + 8 = l, 3s + l = 44'),
    f'{U10}:bank:10.5:12': solve_for(Eq(Rational(3, 2) * (10 - B) + 3 * B, 24), B),
    f'{U10}:bank:10.5:13': solve_for(Eq(8 * (80 - B) + 5 * B, 490), B),
    f'{U10}:test:10.5:20': solve_for(Eq(12 * A + 7 * (40 - A), 370), A),
    f'{U10}:test:10.5:21': nums([10, 40], 'a + 4a = 50'),
    f'{U10}:test:10.5:22': solve_for(Eq(5 * (9 - B) + 8 * B, 57), B),
    f'{U10}:test:10.5:23': solve_for(Eq(A + (A - 6), 30), A),

    # ---- Unit 10.6: distance-rate-time ----
    f'{U10}:bank:10.6:0': num(Rational(180, 3), 'd / t'),
    f'{U10}:bank:10.6:1': num(15 * 2, 'r t'),
    f'{U10}:bank:10.6:2': solve_for(Eq((55 + 45) * T_, 400), T_),
    f'{U10}:bank:10.6:3': num(Rational(300, 60), 'd / r'),
    f'{U10}:bank:10.6:4': solve_for(Eq(4 * W + 8 * (4 - W), 24), W),
    f'{U10}:bank:10.6:5': solve_for(Eq((20 + 30) * T_, 150), T_),
    f'{U10}:bank:10.6:6': num(Rational(2400, 4), 'd / t (ground speed with the tailwind)'),
    f'{U10}:bank:10.6:7': solve_for(Eq(60 * (T_ + 1), 75 * T_), T_),
    f'{U10}:bank:10.6:8': solve_for(Eq(12 / (W + 2) + 12 / W, 5), W),
    f'{U10}:bank:10.6:9': num(Rational(480, 60), 'd / r'),
    f'{U10}:bank:10.6:10': solve_for(Eq((70 + 80) * T_, 450), T_),
    f'{U10}:bank:10.6:11': num(50 * 3 + 70 * 2, 'sum of r t'),
    f'{U10}:bank:10.6:12': num(12 * Rational(20, 60), '12 mph * 1/3 h'),
    f'{U10}:bank:10.6:13': solve_for(Eq((6 - 4) * T_, 10), T_),
    f'{U10}:bank:10.6:14': num(Rational(1, 2) + Rational(60, 60), '0.5 h + 60/60 h'),
    f'{U10}:test:10.6:25': num(Rational(240, 4), 'd / t'),
    f'{U10}:test:10.6:26': solve_for(Eq((3 + 2) * T_, 10), T_),
    f'{U10}:test:10.6:27': num(80 * Rational(5, 2), 'r t'),
    f'{U10}:test:10.6:28': num((50 + 60) * 3, '(r1 + r2) t'),
    f'{U10}:test:10.6:29': num(Rational(45, 15), 'd / r'),

    # ---- Unit 10.7: mixtures and money ----
    f'{U10}:bank:10.7:0': mismatch('no whole-number answer: 42j + 12(5 - j) = 126 gives j = 2.2', 'SymPy solve',
                                   'KEY DOES NOT SATISFY THE PROBLEM: 2 jeans + 3 shirts = 2(42) + 3(12) = $120, not $126.'),
    f'{U10}:bank:10.7:1': nums([5], '5a + 8(10 - a) = 65 -> a = 5 (5 lb of each)'),
    f'{U10}:bank:10.7:2': nums([10], '3a + 5(20 - a) = 80 -> a = 10 (10 lb of each)'),
    f'{U10}:bank:10.7:3': nums([10, 40, 20, 10], '0.4a + 0.1(30 - a) = 6 -> a = 10 L of 40%, 20 L of 10%', ordered=True),
    f'{U10}:bank:10.7:4': solve_for(Eq(8 * A + 5 * (100 - A), 620), A),
    f'{U10}:bank:10.7:5': solve_for(Eq((78 + 82 + 91 + N) / 4, 85), N),
    f'{U10}:bank:10.7:6': solve_for(Eq(Rational(4, 100) * A + Rational(6, 100) * (10000 - A), 520), A),
    f'{U10}:bank:10.7:7': nums([33.3, 20, 16.7, 50], '0.2a + 0.5(50 - a) = 15 -> a = 100/3 = 33.3 mL, b = 50/3 = 16.7 mL',
                               ordered=True),
    f'{U10}:bank:10.7:8': solve_for(Eq(2 * (120 - B) + 7 * B, 480), B),
    f'{U10}:bank:10.7:9': solve_for(Eq(40 * A + 10 * (15 - A), 25 * 15), A),
    f'{U10}:bank:10.7:10': solve_for(Eq(Rational(3, 100) * A + Rational(5, 100) * (5000 - A), 190), A),
    f'{U10}:bank:10.7:11': solve_for(Eq(Rational(3, 2) * A + 2 * (8 - A), Rational(27, 2)), A),
    f'{U10}:bank:10.7:12': solve_for(Eq(3 * A + 7 * (12 - A), 60), A),
    f'{U10}:bank:10.7:13': solve_for(Eq(A + (A - 6), 30), A),
    f'{U10}:bank:10.7:14': nums([10, 40], 'a + 4a = 50'),
    f'{U10}:test:10.7:30': solve_for(Eq(6 * A + 4 * (80 - A), 400), A),
    f'{U10}:test:10.7:31': mismatch('2 lb of Coffee A and 6 lb of Coffee B', 'SymPy solve 4a + 6(8 - a) = 44',
                                    'KEY DOES NOT SATISFY THE PROBLEM: 4 lb of each costs 4(4) + 6(4) = $40, not $44.'),
    f'{U10}:test:10.7:32': solve_for(Eq((75 + 82 + 79 + N) / 4, 80), N),
    f'{U10}:test:10.7:33': num(30, 'a + 3a = 40 -> larger = 30'),
    f'{U10}:test:10.7:34': solve_for(Eq(Rational(3, 2) * A + 3 * (10 - A), 21), A),
}

AMBIGUOUS = {
    f'{U10}:bank:10.4:7': 'cable costs the same at 10 months and less from 11; "after how many months" reads as 10 '
                          'to many students. The key is 11.',
    f'{U10}:bank:10.6:6': 'mentions a tailwind but gives no wind speed; 600 mph is the ground speed, not the '
                          'plane\'s own airspeed.',
    f'{U10}:bank:10.7:7': 'exact answer is 100/3 and 50/3 mL; key uses rounded decimals with units in a free-text '
                          'answer, so most student phrasings cannot match.',
    f'{U4}:bank:unit4:9': 'texts differ on whether the constant of 5x - 7 is 7 or -7; the key requires -7.',
    f'{U12}:bank:12.3:13': '"losing r% per year" with A = A0(1 - r)^t is only right if r is a decimal, not a percent.',
    f'{U16}:bank:16.4:3': 'asks how many x-intercepts but the key is phrased "two solutions"; a student answering "2" '
                          'or "two" is marked wrong (see checker corpus).',
    f'{U16}:bank:16.3:12': 'format says "0, 1, or 2 solutions" but the key is "no real solutions"; "0" is marked wrong.',
}
