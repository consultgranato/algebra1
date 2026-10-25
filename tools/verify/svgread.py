"""Read the site's hand-drawn SVG graphs back into maths coordinates.

The graphs share one convention: two grey axis lines, grey tick labels whose
text is the coordinate value. From the axis crossing (the origin) and the
labels we recover the pixel->unit scale, then map every coloured mark.
"""
import re


def attrs(tag):
    return dict(re.findall(r'([\w-]+)="([^"]*)"', tag))


def read(svg):
    tags = re.findall(r'<(line|circle|text|polyline|path|polygon|rect)\b([^>]*)>(?:([^<]*)</text>)?', svg)
    lines, circles, texts, curves = [], [], [], []
    for name, body, text in tags:
        a = attrs(body)
        if name == 'line':
            lines.append(a)
        elif name == 'circle':
            circles.append(a)
        elif name == 'text':
            texts.append((a, text.strip()))
        elif name in ('polyline', 'path'):
            curves.append((name, a))
    axes = [l for l in lines if l.get('stroke') in ('#aaa', '#999', '#bbb', '#ccc', '#888') and 'stroke-dasharray' not in l]
    hor = [l for l in axes if l['y1'] == l['y2']]
    ver = [l for l in axes if l['x1'] == l['x2']]
    if not hor:
        return None
    oy = float(hor[0]['y1'])
    ox = float(ver[0]['x1']) if ver else None
    # scale from numeric tick labels
    sx = sy = None
    for a, tx in texts:
        if not re.fullmatch(r'-?\d+(\.\d+)?', tx):
            continue
        v = float(tx)
        if v == 0:
            if ox is None and abs(float(a['y']) - oy) < 20:
                ox = float(a['x'])
            continue
        if abs(float(a['y']) - oy) < 20 and a.get('text-anchor') == 'middle':     # x-axis label
            if ox is not None:
                sx = (float(a['x']) - ox) / v
        elif a.get('text-anchor') == 'end' and ox is not None:                     # y-axis label
            sy = (oy - (float(a['y']) - 4)) / v   # labels sit ~4px below their tick
    return {'origin': (ox, oy), 'sx': sx, 'sy': sy, 'lines': [l for l in lines if l not in axes],
            'circles': circles, 'texts': texts, 'curves': curves}


def to_units(g, px, py):
    ox, oy = g['origin']
    X = (px - ox) / g['sx'] if g['sx'] else None
    Y = (oy - py) / g['sy'] if g['sy'] else None
    return (round(X, 2) if X is not None else None, round(Y, 2) if Y is not None else None)


def describe(svg):
    g = read(svg)
    if not g:
        return 'unreadable'
    out = [f"origin px={g['origin']} scale x={g['sx']} px/unit, y={g['sy']} px/unit"]
    for l in g['lines']:
        p1 = to_units(g, float(l['x1']), float(l['y1']))
        p2 = to_units(g, float(l['x2']), float(l['y2']))
        kind = 'dashed' if 'stroke-dasharray' in l else 'solid'
        slope = None
        if None not in p1 + p2 and p2[0] != p1[0]:
            slope = round((p2[1] - p1[1]) / (p2[0] - p1[0]), 3)
            icpt = round(p1[1] - slope * p1[0], 2)
            out.append(f"{kind} line {l.get('stroke')} {p1}->{p2} slope={slope} y-int={icpt}")
        else:
            out.append(f"{kind} line {l.get('stroke')} {p1}->{p2} (vertical)")
    for c in g['circles']:
        out.append(f"circle fill={c.get('fill')} at {to_units(g, float(c['cx']), float(c['cy']))}")
    for name, a in g['curves']:
        pts = re.findall(r'(-?[\d.]+)[ ,](-?[\d.]+)', a.get('points') or a.get('d') or '')
        conv = [to_units(g, float(px), float(py)) for px, py in pts]
        if conv:
            lo = min(conv, key=lambda p: p[1] if p[1] is not None else 0)
            hi = max(conv, key=lambda p: p[1] if p[1] is not None else 0)
            out.append(f"{name} {a.get('stroke')} {len(conv)} pts first={conv[0]} last={conv[-1]} min-y={lo} max-y={hi}"
                       + (" dashed" if 'stroke-dasharray' in a else ''))
    for a, tx in g['texts']:
        if not re.fullmatch(r'-?\d+(\.\d+)?', tx):
            out.append(f"label '{tx}' at {to_units(g, float(a['x']), float(a['y']))}")
    return '\n    '.join(out)


if __name__ == '__main__':
    import json
    import sys
    from pathlib import Path
    d = json.loads((Path(__file__).resolve().parents[2] / 'audit/raw/items.json').read_text(encoding='utf-8'))
    for f, u in d.items():
        for it in u['items']:
            if it['svg']:
                print(f"{f}:{it['kind']}:{it['group']}:{it['idx']} | {re.sub('<[^>]+>', '', it['q'])} | key={it['a']} | graphIt={it['graphIt']}")
                print('    ' + describe(it['svg']))
