#!/usr/bin/env python3
"""Add SVG number line diagrams to unit6 worked examples"""

def make_number_line(value, direction, dot_type, label='', width=360, low=-6, high=8):
    """Generate an SVG number line diagram.
    direction: 'right' | 'left'
    dot_type: 'open' | 'closed'
    """
    w, h = width, 54
    mid_y = 28
    pad = 30
    scale = (w - 2*pad) / (high - low)

    def x_pos(v):
        return pad + (v - low) * scale

    dot_x = x_pos(value)
    dot_r = 6
    fill = 'white' if dot_type == 'open' else '#4a2c7a'
    stroke = '#4a2c7a'

    # Arrow
    arrow_x = x_pos(high) if direction == 'right' else x_pos(low)
    arrow_dir = 'right' if direction == 'right' else 'left'

    # Tick marks and labels
    ticks = ''
    for v in range(int(low), int(high)+1):
        tx = x_pos(v)
        ticks += f'<line x1="{tx:.1f}" y1="{mid_y-5}" x2="{tx:.1f}" y2="{mid_y+5}" stroke="#888" stroke-width="1"/>'
        if v % 2 == 0 or (high - low) <= 10:
            ticks += f'<text x="{tx:.1f}" y="{mid_y+18}" text-anchor="middle" font-size="10" fill="#555">{v}</text>'

    # Shaded ray
    if direction == 'right':
        ray_x1 = dot_x
        ray_x2 = x_pos(high) - 8
        arrowhead = f'<polygon points="{ray_x2+8},{mid_y} {ray_x2},{mid_y-5} {ray_x2},{mid_y+5}" fill="#4a2c7a"/>'
    else:
        ray_x1 = x_pos(low) + 8
        ray_x2 = dot_x
        arrowhead = f'<polygon points="{ray_x1-8},{mid_y} {ray_x1},{mid_y-5} {ray_x1},{mid_y+5}" fill="#4a2c7a"/>'

    svg = f'''<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="display:block;margin:.5rem 0;max-width:100%">
  <line x1="{pad}" y1="{mid_y}" x2="{w-pad}" y2="{mid_y}" stroke="#ccc" stroke-width="1.5"/>
  <line x1="{ray_x1:.1f}" y1="{mid_y}" x2="{ray_x2:.1f}" y2="{mid_y}" stroke="#4a2c7a" stroke-width="3"/>
  {arrowhead}
  {ticks}
  <circle cx="{dot_x:.1f}" cy="{mid_y}" r="{dot_r}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>
</svg>'''
    return svg

def make_between_line(v1, v2, dot1='closed', dot2='open', label='', width=360, low=-4, high=8):
    """Number line for compound inequality a ≤ x < b"""
    w, h = width, 54
    mid_y = 28
    pad = 30
    scale = (w - 2*pad) / (high - low)
    def x_pos(v): return pad + (v - low) * scale

    x1, x2 = x_pos(v1), x_pos(v2)
    fill1 = 'white' if dot1 == 'open' else '#4a2c7a'
    fill2 = 'white' if dot2 == 'open' else '#4a2c7a'

    ticks = ''
    for v in range(int(low), int(high)+1):
        tx = x_pos(v)
        ticks += f'<line x1="{tx:.1f}" y1="{mid_y-5}" x2="{tx:.1f}" y2="{mid_y+5}" stroke="#888" stroke-width="1"/>'
        if v % 2 == 0:
            ticks += f'<text x="{tx:.1f}" y="{mid_y+18}" text-anchor="middle" font-size="10" fill="#555">{v}</text>'

    svg = f'''<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="display:block;margin:.5rem 0;max-width:100%">
  <line x1="{pad}" y1="{mid_y}" x2="{w-pad}" y2="{mid_y}" stroke="#ccc" stroke-width="1.5"/>
  <line x1="{x1:.1f}" y1="{mid_y}" x2="{x2:.1f}" y2="{mid_y}" stroke="#4a2c7a" stroke-width="3"/>
  {ticks}
  <circle cx="{x1:.1f}" cy="{mid_y}" r="6" fill="{fill1}" stroke="#4a2c7a" stroke-width="2"/>
  <circle cx="{x2:.1f}" cy="{mid_y}" r="6" fill="{fill2}" stroke="#4a2c7a" stroke-width="2"/>
</svg>'''
    return svg

# SVG number lines for unit6 worked examples
SVG_61_EX1 = make_number_line(3, 'right', 'open')   # x > 3
SVG_61_EX2 = make_number_line(-1, 'left', 'closed') # x ≤ -1
SVG_61_EX3 = make_number_line(2, 'right', 'open')   # x > 2 (from graph)
SVG_62_EX1 = make_number_line(5, 'left', 'open')    # x < 5
SVG_62_EX2 = make_number_line(-5, 'left', 'closed') # x ≤ -5
SVG_62_EX3 = make_number_line(-6, 'right', 'closed')# x ≥ -6
SVG_63_EX1 = make_number_line(4, 'right', 'closed') # x ≥ 4
SVG_63_EX2 = make_number_line(-2, 'left', 'open')   # x < -2
SVG_65_EX  = make_between_line(-1, 3, 'closed', 'open')  # -1 ≤ x < 3

with open('unit6.html', 'r') as f:
    content = f.read()

# Inject SVGs after each worked example's wsteps div
# Ex 1: x > 3 — after "Open circle at 3, arrow pointing right"
content = content.replace(
    '</div></div>\n          <div class="worked"><div class="wlbl">Example 2 &mdash; graph x &le; &minus;1',
    f'\n<div style="background:#f8f5ff;border-radius:8px;padding:.5rem .75rem;margin:.4rem 0">{SVG_61_EX1}</div>'
    '</div></div>\n          <div class="worked"><div class="wlbl">Example 2 &mdash; graph x &le; &minus;1'
)

# Ex 2: x ≤ -1
content = content.replace(
    '</div></div>\n          <div class="worked"><div class="wlbl">Example 3 &mdash; write inequality from graph',
    f'\n<div style="background:#f8f5ff;border-radius:8px;padding:.5rem .75rem;margin:.4rem 0">{SVG_61_EX2}</div>'
    '</div></div>\n          <div class="worked"><div class="wlbl">Example 3 &mdash; write inequality from graph'
)

# 6.2 Ex 1: x < 5
content = content.replace(
    '<span class="eq" style="font-size:11px;color:var(--text2)">Graph: open circle at 5, arrow left</span>\n          </div></div>\n          <p class="note-h">Worked example 2',
    f'<span class="eq" style="font-size:11px;color:var(--text2)">Graph: open circle at 5, arrow left</span>\n'
    f'<div style="background:#f8f5ff;border-radius:8px;padding:.5rem .75rem;margin:.4rem 0">{SVG_62_EX1}</div>\n'
    '          </div></div>\n          <p class="note-h">Worked example 2'
)

# 6.2 Ex 2: x ≤ -5
content = content.replace(
    '<span class="eq" style="font-size:11px;color:var(--text2)">Graph: closed circle at &minus;5, arrow left</span>\n          </div></div>\n          <p class="note-h">Worked example 3',
    f'<span class="eq" style="font-size:11px;color:var(--text2)">Graph: closed circle at &minus;5, arrow left</span>\n'
    f'<div style="background:#f8f5ff;border-radius:8px;padding:.5rem .75rem;margin:.4rem 0">{SVG_62_EX2}</div>\n'
    '          </div></div>\n          <p class="note-h">Worked example 3'
)

# 6.5 in-between: -1 ≤ x < 3
content = content.replace(
    '<span class="eq" style="font-size:11px;color:var(--text2)">Graph: closed circle at &minus;1, open circle at 3, shaded between</span>\n          </div></div>',
    f'<span class="eq" style="font-size:11px;color:var(--text2)">Graph: closed circle at &minus;1, open circle at 3, shaded between</span>\n'
    f'<div style="background:#f8f5ff;border-radius:8px;padding:.5rem .75rem;margin:.4rem 0">{SVG_65_EX}</div>\n'
    '          </div></div>'
)

with open('unit6.html', 'w') as f:
    f.write(content)

print('unit6.html SVG number lines injected.')
