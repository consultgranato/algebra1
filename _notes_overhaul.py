#!/usr/bin/env python3
"""Notes overhaul for unit8, unit9, unit15 — callouts, step clarity, SVG visuals."""

# ─── SVG HELPERS ─────────────────────────────────────────────────────────────

def coord_grid(w, h, scale, ox, oy, x_range, y_range):
    """Return SVG string with grid, axes, and tick labels."""
    def px(x): return ox + x * scale
    def py(y): return oy - y * scale
    parts = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
             f'style="display:block;max-width:100%;margin:.4rem 0" '
             f'xmlns="http://www.w3.org/2000/svg">']
    # Grid
    for x in range(x_range[0], x_range[1]+1):
        gx = px(x)
        if 0 <= gx <= w:
            parts.append(f'<line x1="{gx:.0f}" y1="0" x2="{gx:.0f}" y2="{h}" stroke="#ebebf4" stroke-width="1"/>')
    for y in range(y_range[0], y_range[1]+1):
        gy = py(y)
        if 0 <= gy <= h:
            parts.append(f'<line x1="0" y1="{gy:.0f}" x2="{w}" y2="{gy:.0f}" stroke="#ebebf4" stroke-width="1"/>')
    # Axes
    parts.append(f'<line x1="0" y1="{oy:.0f}" x2="{w}" y2="{oy:.0f}" stroke="#999" stroke-width="1.5"/>')
    parts.append(f'<line x1="{ox:.0f}" y1="0" x2="{ox:.0f}" y2="{h}" stroke="#999" stroke-width="1.5"/>')
    # Ticks + labels
    for x in range(x_range[0], x_range[1]+1):
        gx = px(x)
        if 0 < gx < w and x != 0:
            parts.append(f'<line x1="{gx:.0f}" y1="{oy-4:.0f}" x2="{gx:.0f}" y2="{oy+4:.0f}" stroke="#aaa" stroke-width="1"/>')
            if x % 2 == 0:
                parts.append(f'<text x="{gx:.0f}" y="{oy+15:.0f}" text-anchor="middle" font-size="10" fill="#777">{x}</text>')
    for y in range(y_range[0], y_range[1]+1):
        gy = py(y)
        if 0 < gy < h and y != 0:
            parts.append(f'<line x1="{ox-4:.0f}" y1="{gy:.0f}" x2="{ox+4:.0f}" y2="{gy:.0f}" stroke="#aaa" stroke-width="1"/>')
            if y % 2 == 0:
                parts.append(f'<text x="{ox-8:.0f}" y="{gy+4:.0f}" text-anchor="end" font-size="10" fill="#777">{y}</text>')
    return parts, px, py

def close_svg(parts): return '\n'.join(parts) + '\n</svg>'

def dot(parts, px_val, py_val, r=5, fill='#4a2c7a', stroke='white', sw=2):
    parts.append(f'<circle cx="{px_val:.1f}" cy="{py_val:.1f}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

def line_seg(parts, x1, y1, x2, y2, color='#4a2c7a', width=2.5, dash=''):
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{width}"{ds}/>')

def txt(parts, x, y, text, anchor='middle', size=11, color='#333', weight='normal'):
    parts.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-size="{size}" fill="{color}" font-weight="{weight}">{text}</text>')

def polyline_fn(parts, fn, x_vals, px, py, color='#4a2c7a', width=2.5):
    pts = ' '.join(f'{px(x):.1f},{py(fn(x)):.1f}' for x in x_vals)
    parts.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>')

def wrap_visual(inner, title=''):
    t = f'<div style="font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#888899;margin-bottom:.4rem">{title}</div>' if title else ''
    return f'<div style="background:#f8f5ff;border-radius:8px;padding:.65rem .85rem;margin:.5rem 0">{t}{inner}</div>'

# ─── UNIT 8 VISUALS ───────────────────────────────────────────────────────────

def make_slope_directions():
    """Four 90×90 mini SVGs showing +, -, 0, undefined slopes."""
    cases = [
        ('Positive', lambda t: t, '#2d7a3b'),
        ('Negative', lambda t: -t, '#a32d2d'),
        ('Zero',     lambda t: 0, '#854f0b'),
        ('Undefined','V', '#4a2c7a'),
    ]
    panels = []
    for label, fn, color in cases:
        W, H, s = 90, 90, 13
        ox, oy = 45, 45
        def px(x, _ox=ox, _s=s): return _ox + x*_s
        def py(y, _oy=oy, _s=s): return _oy - y*_s
        parts = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="border:1px solid #e0e0e8;border-radius:6px" xmlns="http://www.w3.org/2000/svg">']
        # light grid
        for v in range(-3,4):
            gx=px(v); gy=py(v)
            if 0<gx<W: parts.append(f'<line x1="{gx:.0f}" y1="0" x2="{gx:.0f}" y2="{H}" stroke="#f0f0f5" stroke-width="1"/>')
            if 0<gy<H: parts.append(f'<line x1="0" y1="{gy:.0f}" x2="{W}" y2="{gy:.0f}" stroke="#f0f0f5" stroke-width="1"/>')
        parts.append(f'<line x1="0" y1="{oy}" x2="{W}" y2="{oy}" stroke="#bbb" stroke-width="1"/>')
        parts.append(f'<line x1="{ox}" y1="0" x2="{ox}" y2="{H}" stroke="#bbb" stroke-width="1"/>')
        # line
        if fn == 'V':
            parts.append(f'<line x1="{ox+15}" y1="8" x2="{ox+15}" y2="{H-8}" stroke="{color}" stroke-width="2.5"/>')
        else:
            x1v, x2v = -3, 3
            parts.append(f'<line x1="{px(x1v):.1f}" y1="{py(fn(x1v)):.1f}" x2="{px(x2v):.1f}" y2="{py(fn(x2v)):.1f}" stroke="{color}" stroke-width="2.5"/>')
        parts.append(f'<text x="{W/2:.0f}" y="{H-4}" text-anchor="middle" font-size="9" fill="{color}" font-weight="700">{label}</text>')
        parts.append('</svg>')
        panels.append('\n'.join(parts))
    inner = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem">' + ''.join(panels) + '</div>'
    return wrap_visual(inner, 'Slope Directions at a Glance')

def make_graph_y2x1():
    """SVG: graph of y = 2x + 1 with rise/run annotation."""
    W, H, s = 300, 220, 30
    ox, oy = 130, 160
    def px(x): return ox + x*s
    def py(y): return oy - y*s
    parts, _px, _py = coord_grid(W, H, s, ox, oy, (-4,5), (-3,4))
    # line y=2x+1 from x=-2 to x=3
    x1, x2 = -2, 3
    parts.append(f'<line x1="{px(x1):.1f}" y1="{py(2*x1+1):.1f}" x2="{px(x2):.1f}" y2="{py(2*x2+1):.1f}" stroke="#4a2c7a" stroke-width="2.5"/>')
    # key points
    for (xv, yv, lbl, anch) in [
        (0, 1, '(0,1)', 'end'),
        (1, 3, '(1,3)', 'start'),
    ]:
        dot(parts, px(xv), py(yv))
        txt(parts, px(xv)+(-8 if anch=='end' else 8), py(yv)-8, lbl, anch, 10, '#4a2c7a', '600')
    # rise/run annotation
    # from (0,1) to (1,1) [run] then (1,1) to (1,3) [rise]
    run_x1, run_y = px(0), py(1)
    run_x2, rise_y2 = px(1), py(3)
    parts.append(f'<line x1="{run_x1:.1f}" y1="{run_y:.1f}" x2="{run_x2:.1f}" y2="{run_y:.1f}" stroke="#854f0b" stroke-width="1.5" stroke-dasharray="4,2"/>')
    parts.append(f'<line x1="{run_x2:.1f}" y1="{run_y:.1f}" x2="{run_x2:.1f}" y2="{rise_y2:.1f}" stroke="#2d7a3b" stroke-width="1.5" stroke-dasharray="4,2"/>')
    txt(parts, (run_x1+run_x2)/2, run_y+14, 'run=1', 'middle', 10, '#854f0b', '600')
    txt(parts, run_x2+14, (run_y+rise_y2)/2, 'rise=2', 'start', 10, '#2d7a3b', '600')
    # equation label
    txt(parts, px(2.8), py(2*2.8+1)-10, 'y = 2x + 1', 'end', 11, '#4a2c7a', '700')
    return wrap_visual(close_svg(parts), 'Graph: y = 2x + 1 (m=2, b=1)')

def make_intercepts_3x2y12():
    """SVG: graph of 3x+2y=12 with x-intercept (4,0) and y-intercept (0,6)."""
    W, H, s = 300, 220, 28
    ox, oy = 60, 190
    def px(x): return ox + x*s
    def py(y): return oy - y*s
    parts, _px, _py = coord_grid(W, H, s, ox, oy, (-1,7), (-1,7))
    # line from (0,6) to (4,0)
    parts.append(f'<line x1="{px(0):.1f}" y1="{py(6):.1f}" x2="{px(4):.1f}" y2="{py(0):.1f}" stroke="#4a2c7a" stroke-width="2.5"/>')
    # intercepts
    for (xv, yv, lbl, dy) in [(4, 0, '(4,0)\nx-intercept', 20), (0, 6, '(0,6)\ny-intercept', -16)]:
        dot(parts, px(xv), py(yv))
        txt(parts, px(xv)+8, py(yv)+dy, lbl.split('\n')[0], 'start', 10, '#4a2c7a', '600')
        txt(parts, px(xv)+8, py(yv)+dy+12, lbl.split('\n')[1], 'start', 9, '#888', 'normal')
    txt(parts, px(3), py(3)+(-14), '3x+2y=12', 'start', 11, '#4a2c7a', '700')
    return wrap_visual(close_svg(parts), 'Graph: 3x + 2y = 12')

# ─── UNIT 9 VISUAL ────────────────────────────────────────────────────────────

def make_system_graph():
    """SVG: y=2x-1 and y=-x+5 intersecting at (2,3)."""
    W, H, s = 300, 260, 30
    ox, oy = 100, 200
    def px(x): return ox + x*s
    def py(y): return oy - y*s
    parts, _px, _py = coord_grid(W, H, s, ox, oy, (-3,6), (-3,7))
    # Line 1: y=2x-1 from x=-1 to x=4
    parts.append(f'<line x1="{px(-1):.1f}" y1="{py(2*(-1)-1):.1f}" x2="{px(4):.1f}" y2="{py(2*4-1):.1f}" stroke="#4a2c7a" stroke-width="2.5"/>')
    txt(parts, px(3.5), py(2*3.5-1)-10, 'y=2x−1', 'start', 10, '#4a2c7a', '700')
    # Line 2: y=-x+5 from x=-1 to x=6
    parts.append(f'<line x1="{px(-1):.1f}" y1="{py(-(-1)+5):.1f}" x2="{px(5.5):.1f}" y2="{py(-(5.5)+5):.1f}" stroke="#a32d2d" stroke-width="2.5"/>')
    txt(parts, px(4.5), py(-(4.5)+5)+14, 'y=−x+5', 'start', 10, '#a32d2d', '700')
    # Intersection
    dot(parts, px(2), py(3), r=7, fill='#2d7a3b')
    parts.append(f'<circle cx="{px(2):.1f}" cy="{py(3):.1f}" r="11" fill="none" stroke="#2d7a3b" stroke-width="1.5" stroke-dasharray="3,2"/>')
    txt(parts, px(2)+14, py(3)-12, '(2, 3)', 'start', 11, '#2d7a3b', '700')
    txt(parts, px(2)+14, py(3)+1, 'Solution', 'start', 9, '#2d7a3b', 'normal')
    # dashed guides
    parts.append(f'<line x1="{px(2):.1f}" y1="{py(3):.1f}" x2="{px(2):.1f}" y2="{oy:.1f}" stroke="#ccc" stroke-width="1" stroke-dasharray="3,2"/>')
    parts.append(f'<line x1="{px(2):.1f}" y1="{py(3):.1f}" x2="{ox:.1f}" y2="{py(3):.1f}" stroke="#ccc" stroke-width="1" stroke-dasharray="3,2"/>')
    return wrap_visual(close_svg(parts), 'Graph: two lines intersecting at the solution')

# ─── UNIT 15 VISUALS ─────────────────────────────────────────────────────────

def make_parabola_directions():
    """Two mini SVGs: opens up (a>0) and opens down (a<0)."""
    panels = []
    for label, a, color in [('a > 0 → opens UP', 0.5, '#2d7a3b'), ('a < 0 → opens DOWN', -0.5, '#a32d2d')]:
        W, H, s = 120, 100, 15
        ox, oy = 60, 55
        def px(x): return ox + x*s
        def py(y): return oy - y*s
        parts = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="border:1px solid #e0e0e8;border-radius:6px" xmlns="http://www.w3.org/2000/svg">']
        parts.append(f'<line x1="0" y1="{oy}" x2="{W}" y2="{oy}" stroke="#ccc" stroke-width="1"/>')
        parts.append(f'<line x1="{ox}" y1="0" x2="{ox}" y2="{H}" stroke="#ccc" stroke-width="1"/>')
        xs = [x/4 for x in range(-16, 17)]
        pts = ' '.join(f'{px(x):.1f},{py(a*x*x):.1f}' for x in xs)
        parts.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="2.5" stroke-linejoin="round"/>')
        dot(parts, px(0), py(0), r=4, fill=color, stroke='white')
        parts.append(f'<text x="{W/2:.0f}" y="{H-5}" text-anchor="middle" font-size="9" fill="{color}" font-weight="700">{label}</text>')
        parts.append('</svg>')
        panels.append('\n'.join(parts))
    inner = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">' + ''.join(panels) + '</div>'
    return wrap_visual(inner, 'Direction of Opening')

def make_parabola_vertex_aos():
    """SVG: y = x²+4x+3 with vertex (-2,-1) and AOS x=-2."""
    W, H, s = 300, 240, 30
    ox, oy = 180, 170
    def px(x): return ox + x*s
    def py(y): return oy - y*s
    parts, _px, _py = coord_grid(W, H, s, ox, oy, (-6,4), (-3,6))
    # AOS dashed line x=-2
    parts.append(f'<line x1="{px(-2):.1f}" y1="4" x2="{px(-2):.1f}" y2="{H-4}" stroke="#854f0b" stroke-width="1.5" stroke-dasharray="5,3"/>')
    txt(parts, px(-2)+4, 14, 'x = −2 (AOS)', 'start', 9, '#854f0b', '600')
    # parabola y=x²+4x+3 from x=-5.5 to x=1.5
    xs = [x/8 for x in range(-44, 12)]
    fn = lambda x: x*x + 4*x + 3
    pts = ' '.join(f'{px(x):.1f},{py(fn(x)):.1f}' for x in xs if 0 <= py(fn(x)) <= H)
    parts.append(f'<polyline points="{pts}" fill="none" stroke="#4a2c7a" stroke-width="2.5" stroke-linejoin="round"/>')
    # vertex
    dot(parts, px(-2), py(-1), r=6, fill='#4a2c7a')
    txt(parts, px(-2)+10, py(-1)-10, 'Vertex (−2,−1)', 'start', 10, '#4a2c7a', '700')
    # y-intercept
    dot(parts, px(0), py(3), r=5, fill='#2d7a3b')
    txt(parts, px(0)+8, py(3)-8, '(0,3)', 'start', 10, '#2d7a3b', '600')
    # symmetry partner
    dot(parts, px(-4), py(3), r=5, fill='#2d7a3b')
    txt(parts, px(-4)-8, py(3)-8, '(−4,3)', 'end', 10, '#2d7a3b', '600')
    # label
    txt(parts, px(-0.5), py(5), 'y = x²+4x+3', 'end', 11, '#4a2c7a', '700')
    return wrap_visual(close_svg(parts), 'Parabola with Vertex and Axis of Symmetry')

def make_point_table_15_3():
    """HTML table of key points for y = x²−6x+8."""
    return '''<div style="background:#f8f5ff;border-radius:8px;padding:.65rem .85rem;margin:.5rem 0">
  <div style="font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#888899;margin-bottom:.4rem">Key Points for y = x²&minus;6x+8</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr><th style="background:#4a2c7a;color:#fff;padding:5px 8px;text-align:center;border:1px solid #3a1c6a">x</th>
        <th style="background:#4a2c7a;color:#fff;padding:5px 8px;text-align:center;border:1px solid #3a1c6a">y = x²&minus;6x+8</th>
        <th style="background:#4a2c7a;color:#fff;padding:5px 8px;text-align:center;border:1px solid #3a1c6a">Point</th></tr>
    <tr><td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">0</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">8</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">(0, 8) ← y-int</td></tr>
    <tr><td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#f8f8ff">2</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#f8f8ff">0</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#f8f8ff">(2, 0) ← x-int</td></tr>
    <tr style="background:#ede9f7"><td style="padding:4px 8px;text-align:center;border:1px solid #c4b5e8;font-weight:700">3</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #c4b5e8;font-weight:700">&minus;1</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #c4b5e8;font-weight:700">(3, &minus;1) ← vertex</td></tr>
    <tr><td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#f8f8ff">4</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#f8f8ff">0</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#f8f8ff">(4, 0) ← x-int</td></tr>
    <tr><td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">6</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">8</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">(6, 8) ← symmetric to (0,8)</td></tr>
  </table>
</div>'''

def make_parent_table():
    """HTML table for y = x² parent function."""
    return '''<div style="background:#f8f5ff;border-radius:8px;padding:.65rem .85rem;margin:.5rem 0">
  <div style="font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#888899;margin-bottom:.4rem">Parent Function: y = x²</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr><th style="background:#4a2c7a;color:#fff;padding:5px 8px;text-align:center;border:1px solid #3a1c6a">x</th>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">&minus;3</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">&minus;2</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">&minus;1</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #ede9f7;background:#ede9f7;font-weight:700">0</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">1</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">2</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">3</td></tr>
    <tr><th style="background:#4a2c7a;color:#fff;padding:5px 8px;text-align:center;border:1px solid #3a1c6a">y</th>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">9</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">4</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">1</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #ede9f7;background:#ede9f7;font-weight:700">0</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">1</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">4</td>
        <td style="padding:4px 8px;text-align:center;border:1px solid #d0d0dc;background:#fff">9</td></tr>
  </table>
  <div style="font-size:11px;color:#555570;margin-top:.4rem">Notice: symmetric around x = 0 (the axis of symmetry). The vertex is at (0, 0).</div>
</div>'''

# ─── GENERATE ALL VISUALS ────────────────────────────────────────────────────

SLOPE_DIRS    = make_slope_directions()
GRAPH_Y2X1    = make_graph_y2x1()
INTERCEPTS    = make_intercepts_3x2y12()
SYSTEM_GRAPH  = make_system_graph()
PARAB_DIRS    = make_parabola_directions()
PARAB_VX_AOS  = make_parabola_vertex_aos()
PT_TABLE_153  = make_point_table_15_3()
PARENT_TABLE  = make_parent_table()

# ─── CALLOUT IMPROVEMENTS (non-visual) ───────────────────────────────────────

TIP_WHICH_METHOD = '''          <div class="tip"><div class="tip-lbl">Which form to use?</div><div class="tip-body">
            <strong>Point-slope form</strong> y &minus; y&#x2081; = m(x &minus; x&#x2081;) &rarr; use when you have a point and the slope<br>
            <strong>Slope-intercept form</strong> y = mx + b &rarr; use when you have the slope and y-intercept<br>
            Both lead to the same final equation &mdash; choose whichever feels faster.
          </div></div>\n'''

TIP_154_STEPS = '''          <div class="tip"><div class="tip-lbl">Step-by-step from vertex form</div><div class="tip-body">
            <strong>Step 1:</strong> Read (h, k) directly from y = a(x &minus; h)&#xB2; + k &rarr; that&apos;s your <span class="vw">vertex</span><br>
            <strong>Step 2:</strong> Check a: positive = opens up, negative = opens down<br>
            <strong>Step 3:</strong> Plot the <span class="vw">vertex</span> (h, k)<br>
            <strong>Step 4:</strong> Go 1 unit left and right from the vertex; go up (or down) |a| units<br>
            <strong>Step 5:</strong> Draw the smooth <span class="vw">parabola</span> through all three points
          </div></div>\n'''

TIP_METHOD_COMPARE = '''          <div class="kc"><div class="kc-lbl">When to use each method</div><div class="kc-body">
            <span class="chip chip-p">Graphing</span> Best for visualizing; approximate answers<br><br>
            <span class="chip chip-g">Substitution</span> Best when one variable is already isolated (y=... or x=...)<br><br>
            <span class="chip chip-a">Elimination</span> Best when both equations are in standard form (ax+by=c)
          </div></div>\n'''

# ─── APPLY CHANGES TO unit8.html ─────────────────────────────────────────────

def patch_unit8():
    with open('unit8.html') as f: c = f.read()
    changes = 0

    # 8.1: Add slope directions visual after the kc "Slope Formula" box
    OLD = '''          <p class="note-h">Worked example 1 &mdash; slope from two points (2, 3) and (6, 11)</p>'''
    NEW = SLOPE_DIRS + '\n' + OLD
    if OLD in c: c = c.replace(OLD, NEW, 1); changes += 1

    # 8.1: Improve worked examples — add intermediate steps and sign-check tip
    OLD_EX2 = '''          <p class="note-h">Worked example 2 &mdash; slope from (1, 5) and (4, &minus;1)</p>
          <div class="worked"><div class="wlbl">Worked example &mdash; negative slope</div><div class="wsteps">
            <span class="eq">m = (&minus;1 &minus; 5) / (4 &minus; 1) = &minus;6/3 = &minus;2</span>
          </div></div>'''
    NEW_EX2 = '''          <p class="note-h">Worked example 2 &mdash; slope from (1, 5) and (4, &minus;1)</p>
          <div class="worked"><div class="wlbl">Worked example &mdash; negative slope</div><div class="wsteps">
            <span class="eq">Label: (x&#x2081;,y&#x2081;) = (1,5) &nbsp; (x&#x2082;,y&#x2082;) = (4,&minus;1)</span>
            <span class="eq">m = (y&#x2082; &minus; y&#x2081;) / (x&#x2082; &minus; x&#x2081;) = (&minus;1 &minus; 5) / (4 &minus; 1)</span>
            <span class="eq eq-div">m = &minus;6 / 3 = <strong>&minus;2</strong> &nbsp;<span class="eq-note">&larr; negative: line goes down left-to-right</span></span>
          </div></div>'''
    if OLD_EX2 in c: c = c.replace(OLD_EX2, NEW_EX2, 1); changes += 1

    # 8.2: Add graph visual after the second kc box (graphing steps)
    OLD_82 = '''          <p class="note-h">Worked example &mdash; graph y = 2x + 1</p>'''
    NEW_82 = GRAPH_Y2X1 + '\n' + OLD_82
    if OLD_82 in c: c = c.replace(OLD_82, NEW_82, 1); changes += 1

    # 8.3: Add "which form" tip after the intro paragraph
    OLD_83TIP = '''          <div class="kc"><div class="kc-lbl">Given slope and a point</div>'''
    NEW_83TIP = TIP_WHICH_METHOD + OLD_83TIP
    if OLD_83TIP in c: c = c.replace(OLD_83TIP, NEW_83TIP, 1); changes += 1

    # 8.3: Improve worked example 1 step labeling
    OLD_83EX1 = '''          <div class="worked"><div class="wlbl">Worked example</div><div class="wsteps">
            <span class="eq">y &minus; 7 = 3(x &minus; 2)</span>
            <span class="eq">y &minus; 7 = 3x &minus; 6</span>
            <span class="eq eq-div">y = 3x + 1 &checkmark;</span>
          </div></div>
          <div class="kc"><div class="kc-lbl">Given two points</div>'''
    NEW_83EX1 = '''          <div class="worked"><div class="wlbl">Worked example &mdash; slope=3, point (2,7)</div><div class="wsteps">
            <span class="eq">Plug into point-slope: y &minus; y&#x2081; = m(x &minus; x&#x2081;)</span>
            <span class="eq">y &minus; 7 = 3(x &minus; 2) <span class="eq-note">&larr; m=3, x&#x2081;=2, y&#x2081;=7</span></span>
            <span class="eq">y &minus; 7 = 3x &minus; 6 <span class="eq-note">&larr; distribute</span></span>
            <span class="eq eq-div">y = 3x + 1 &checkmark;</span>
          </div></div>
          <div class="kc"><div class="kc-lbl">Given two points</div>'''
    if OLD_83EX1 in c: c = c.replace(OLD_83EX1, NEW_83EX1, 1); changes += 1

    # 8.4: Add intercepts graph visual after the intercepts worked example
    OLD_84 = '''          <div class="kc"><div class="kc-lbl">Special Lines</div>'''
    NEW_84 = INTERCEPTS + '\n' + OLD_84
    if OLD_84 in c: c = c.replace(OLD_84, NEW_84, 1); changes += 1

    with open('unit8.html', 'w') as f: f.write(c)
    print(f'unit8.html: {changes} patches applied')
    return changes

# ─── APPLY CHANGES TO unit9.html ─────────────────────────────────────────────

def patch_unit9():
    with open('unit9.html') as f: c = f.read()
    changes = 0

    # 9.2: Add system graph visual after the worked example
    OLD_92 = '''          <div class="warn"><div class="warn-lbl">Note</div><div class="warn-body">Graphing gives approximate answers. Substitution and elimination give exact answers every time.</div></div>'''
    NEW_92 = SYSTEM_GRAPH + '\n' + OLD_92
    if OLD_92 in c: c = c.replace(OLD_92, NEW_92, 1); changes += 1

    # 9.2: Improve worked example to show explicit steps
    OLD_92EX = '''          <div class="worked"><div class="wlbl">Solve: y = 2x &minus; 1 and y = &minus;x + 5</div><div class="wsteps">
            <span class="eq">Line 1: y = 2x &minus; 1 &rarr; slope = 2, y-int = &minus;1</span>
            <span class="eq">Line 2: y = &minus;x + 5 &rarr; slope = &minus;1, y-int = 5</span>
            <span class="eq">Graph both lines &rarr; they intersect at (2, 3)</span>
            <span class="eq eq-div">Check: 3 = 2(2)&minus;1 = 3 &#10003; and 3 = &minus;2+5 = 3 &#10003;</span>
            <span class="eq">Solution: <strong>(2, 3)</strong></span>
          </div></div>'''
    NEW_92EX = '''          <div class="worked"><div class="wlbl">Solve: y = 2x &minus; 1 and y = &minus;x + 5</div><div class="wsteps">
            <span class="eq"><strong>Step 1 &mdash; Identify slope &amp; y-intercept for each line:</strong></span>
            <span class="eq">&nbsp;&nbsp;Line 1: y = 2x &minus; 1 &rarr; m = 2, b = &minus;1 &rarr; plot (0,&minus;1), go up 2 right 1</span>
            <span class="eq">&nbsp;&nbsp;Line 2: y = &minus;x + 5 &rarr; m = &minus;1, b = 5 &rarr; plot (0,5), go down 1 right 1</span>
            <span class="eq eq-div"><strong>Step 2 &mdash; Find intersection:</strong></span>
            <span class="eq">&nbsp;&nbsp;Lines cross at <strong>(2, 3)</strong> (read from graph)</span>
            <span class="eq eq-div"><strong>Step 3 &mdash; Check in BOTH equations:</strong></span>
            <span class="eq">&nbsp;&nbsp;Eq 1: 3 = 2(2)&minus;1 = 3 &#10003; &nbsp;&nbsp; Eq 2: 3 = &minus;2+5 = 3 &#10003;</span>
            <span class="eq eq-div">Solution: <strong>(2, 3)</strong></span>
          </div></div>'''
    if OLD_92EX in c: c = c.replace(OLD_92EX, NEW_92EX, 1); changes += 1

    # 9.4: Add method comparison kc before the process steps
    OLD_94_STEPS = '''          <p class="note-h">Process for solving by elimination</p>
          <ol class="steps">'''
    NEW_94_STEPS = TIP_METHOD_COMPARE + OLD_94_STEPS
    if OLD_94_STEPS in c: c = c.replace(OLD_94_STEPS, NEW_94_STEPS, 1); changes += 1

    # 9.3: Improve worked example step labels
    OLD_93EX1 = '''          <div class="worked"><div class="wlbl">Solve: y = 2x &minus; 1 and x + y = 8</div><div class="wsteps">
            <span class="eq">y is already alone in Eq 1: y = 2x &minus; 1</span>
            <span class="eq">Substitute into Eq 2: x + (2x &minus; 1) = 8</span>
            <span class="eq">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3x &minus; 1 = 8</span>
            <span class="eq">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3x = 9 &rarr; x = 3</span>
            <span class="eq">Back-sub: y = 2(3) &minus; 1 = 5</span>
            <span class="eq eq-div">Answer: <strong>(3, 5)</strong></span>
          </div></div>'''
    NEW_93EX1 = '''          <div class="worked"><div class="wlbl">Solve: y = 2x &minus; 1 and x + y = 8</div><div class="wsteps">
            <span class="eq"><strong>Step 1 &mdash; y is already alone:</strong> y = 2x &minus; 1</span>
            <span class="eq"><strong>Step 2 &mdash; Substitute into Eq 2:</strong></span>
            <span class="eq">&nbsp;&nbsp;x + (2x &minus; 1) = 8 <span class="eq-note">&larr; replace y with (2x&minus;1)</span></span>
            <span class="eq">&nbsp;&nbsp;3x &minus; 1 = 8 &rarr; 3x = 9 &rarr; x = 3</span>
            <span class="eq"><strong>Step 3 &mdash; Back-substitute:</strong> y = 2(3) &minus; 1 = 5</span>
            <span class="eq eq-div"><strong>Solution: (3, 5)</strong> &nbsp; Check: 5=2(3)&minus;1 &#10003; and 3+5=8 &#10003;</span>
          </div></div>'''
    if OLD_93EX1 in c: c = c.replace(OLD_93EX1, NEW_93EX1, 1); changes += 1

    with open('unit9.html', 'w') as f: f.write(c)
    print(f'unit9.html: {changes} patches applied')
    return changes

# ─── APPLY CHANGES TO unit15.html ────────────────────────────────────────────

def patch_unit15():
    with open('unit15.html') as f: c = f.read()
    changes = 0

    # 15.1: Add parent function table + parabola directions visual after the kc box
    OLD_151 = '''          <div class="worked"><div class="wlbl">Worked example &mdash; y = 2x&#xB2; &minus; 3x + 5</div>'''
    NEW_151 = PARENT_TABLE + '\n' + PARAB_DIRS + '\n' + OLD_151
    if OLD_151 in c: c = c.replace(OLD_151, NEW_151, 1); changes += 1

    # 15.1: Improve the worked example to show it's about identifying attributes
    OLD_151EX = '''          <div class="worked"><div class="wlbl">Worked example &mdash; y = 2x&#xB2; &minus; 3x + 5</div><div class="wsteps">
            <span class="eq">a = 2, b = &minus;3, c = 5</span>
            <span class="eq">Opens UP (a = 2 &gt; 0)</span>
            <span class="eq">Narrower than y = x&#xB2; (|a| = 2 &gt; 1)</span>
            <span class="eq">y-intercept: (0, 5)</span>
          </div></div>'''
    NEW_151EX = '''          <div class="worked"><div class="wlbl">Worked example &mdash; identify attributes of y = 2x&#xB2; &minus; 3x + 5</div><div class="wsteps">
            <span class="eq"><strong>Identify a, b, c:</strong> a = 2, b = &minus;3, c = 5</span>
            <span class="eq"><strong>Direction:</strong> a = 2 &gt; 0 &rarr; opens <strong>UP</strong> (minimum vertex)</span>
            <span class="eq"><strong>Width:</strong> |a| = 2 &gt; 1 &rarr; <strong>narrower</strong> than parent y = x&#xB2;</span>
            <span class="eq eq-div"><strong>y-intercept:</strong> set x = 0 &rarr; y = 5 &rarr; point (0, 5)</span>
          </div></div>'''
    if OLD_151EX in c: c = c.replace(OLD_151EX, NEW_151EX, 1); changes += 1

    # 15.2: Add parabola SVG after the worked example
    OLD_152 = '''        </div>
      </div>

      <!-- 15.3 -->'''
    NEW_152 = PARAB_VX_AOS + '\n        </div>\n      </div>\n\n      <!-- 15.3 -->'
    if OLD_152 in c: c = c.replace(OLD_152, NEW_152, 1); changes += 1

    # 15.3: Add point table after the worked example's step-by-step
    OLD_153 = '''          <p class="note-h">Worked example &mdash; y = x&#xB2; &minus; 6x + 8</p>
          <div class="worked"><div class="wlbl">Worked example</div><div class="wsteps">
            <span class="eq">a=1, b=-6, c=8</span>
            <span class="eq">Step 1: AOS = &minus;(&minus;6)/(2&times;1) = 6/2 = 3 &rarr; x = 3</span>
            <span class="eq">Step 2: y = 3&#xB2; &minus; 6(3) + 8 = 9&minus;18+8 = &minus;1 &rarr; <span class="vw">vertex</span>: (3, &minus;1)</span>
            <span class="eq">Step 3: y-intercept: (0, 8)</span>
            <span class="eq">Step 4: Symmetric point 6 units right: (6, 8)</span>
            <span class="eq eq-div">Step 5: Draw <span class="vw">parabola</span> upward through these points &checkmark;</span>
          </div></div>'''
    NEW_153 = '''          <p class="note-h">Worked example &mdash; y = x&#xB2; &minus; 6x + 8</p>
          <div class="worked"><div class="wlbl">Worked example &mdash; all 5 steps</div><div class="wsteps">
            <span class="eq"><strong>a=1, b=&minus;6, c=8</strong></span>
            <span class="eq"><strong>Step 1 &mdash; AOS:</strong> x = &minus;b/(2a) = &minus;(&minus;6)/(2&times;1) = 6/2 = <strong>3</strong></span>
            <span class="eq"><strong>Step 2 &mdash; Vertex:</strong> y = 3&#xB2;&minus;6(3)+8 = 9&minus;18+8 = <strong>&minus;1</strong> &rarr; vertex: (3, &minus;1) &larr; minimum</span>
            <span class="eq"><strong>Step 3 &mdash; y-intercept:</strong> x=0 &rarr; y=8 &rarr; point (0, 8)</span>
            <span class="eq"><strong>Step 4 &mdash; Symmetric point:</strong> (0,8) is 3 units left of AOS &rarr; mirror: (6, 8)</span>
            <span class="eq eq-div"><strong>Step 5:</strong> Draw upward <span class="vw">parabola</span> through (0,8), (2,0), (3,&minus;1), (4,0), (6,8) &checkmark;</span>
          </div></div>''' + '\n' + PT_TABLE_153
    if OLD_153 in c: c = c.replace(OLD_153, NEW_153, 1); changes += 1

    # 15.4: Add step-by-step tip before the warn box
    OLD_154 = '''          <div class="warn"><div class="warn-lbl">Watch the sign of h!</div>'''
    NEW_154 = TIP_154_STEPS + OLD_154
    if OLD_154 in c: c = c.replace(OLD_154, NEW_154, 1); changes += 1

    # 15.4: Improve second worked example with explicit steps
    OLD_154EX2 = '''          <div class="worked"><div class="wlbl">Worked example</div><div class="wsteps">
            <span class="eq">y = &minus;1(x &minus; (&minus;2))&#xB2; + 4</span>
            <span class="eq">a = &minus;1, h = &minus;2, k = 4</span>
            <span class="eq"><span class="vw">Vertex</span>: (&minus;2, 4). Opens DOWN. Maximum.</span>
          </div></div>'''
    NEW_154EX2 = '''          <div class="worked"><div class="wlbl">Worked example &mdash; y = &minus;(x+2)&#xB2; + 4</div><div class="wsteps">
            <span class="eq">Rewrite: y = &minus;1(x &minus; (&minus;2))&#xB2; + 4</span>
            <span class="eq"><strong>Step 1 &mdash; Read vertex:</strong> h = &minus;2, k = 4 &rarr; <strong>Vertex: (&minus;2, 4)</strong></span>
            <span class="eq"><strong>Step 2 &mdash; Direction:</strong> a = &minus;1 &lt; 0 &rarr; opens <strong>DOWN</strong> (maximum)</span>
            <span class="eq"><strong>Step 3 &mdash; Points:</strong> 1 right &rarr; (&minus;1, 3); 1 left &rarr; (&minus;3, 3)</span>
            <span class="eq eq-div"><strong>Step 4 &mdash; Draw</strong> downward <span class="vw">parabola</span> through (&minus;3,3), (&minus;2,4), (&minus;1,3) &checkmark;</span>
          </div></div>'''
    if OLD_154EX2 in c: c = c.replace(OLD_154EX2, NEW_154EX2, 1); changes += 1

    with open('unit15.html', 'w') as f: f.write(c)
    print(f'unit15.html: {changes} patches applied')
    return changes

# ─── RUN ALL ─────────────────────────────────────────────────────────────────
total = 0
total += patch_unit8()
total += patch_unit9()
total += patch_unit15()
print(f'\nTotal patches across 3 files: {total}')
