#!/usr/bin/env python3
"""V1.1 Update script — videos, Desmos, math symbols, minor fixes"""
import re, os, json

# ── VIDEO DATABASE ────────────────────────────────────────────────────────────
VIDEOS = {
    'unit1-4': {
        '1.2': [{'label':'Part 1','id':'LbQdAWIGnvc'},{'label':'Part 2','id':'zwjhyZ1ptlE'}],
        '1.3': [{'label':'Watch','id':'Y5eaaZQ1vLI'}],
        '1.4': [{'label':'Watch','id':'zx1PvY85dmo'}],
        '2.1': [{'label':'Watch','id':'J_3BMc9IDDA'}],
        '2.3': [{'label':'Watch','id':'F-mC5ft4pII'}],
        '2.4': [{'label':'Watch','id':'5hlV75wTYZg'}],
        '2.5': [{'label':'Part 1','id':'J6-xnFb1aLc'},{'label':'Part 2','id':'rMPEBK0yXHY'}],
        '3.1': [{'label':'Watch','id':'NQHCse3Y_tU'}],
        '3.2': [{'label':'Watch','id':'UHIBcdPaAPc'}],
        '3.3': [{'label':'Watch','id':'wTeOA3qOyak'}],
        '4.1': [{'label':'Watch','id':'7LVTvmsihKg'}],
        '4.2': [{'label':'Part 1','id':'rAz4T5z_Od8'},{'label':'Part 2','id':'XIm1gTe_-aE'}],
        '4.4': [{'label':'Watch','id':'k7sAqhTyums'}],
    },
    'unit5': {
        '5.1': [{'label':'Part 1','id':'CAsQLnY11pU'},{'label':'Part 2','id':'-xF5heC4HC0'}],
        '5.2': [{'label':'Watch','id':'jYLxGQKXtN4'}],
        '5.3': [{'label':'Watch','id':'rXHHW4PGGP8'}],
        '5.4': [{'label':'Watch','id':'47aM5mP2w7Y'}],
    },
    'unit6': {
        '6.1': [{'label':'Watch','id':'x1H_9CP0rQM'}],
        '6.2': [{'label':'Watch','id':'wNCVe6Qv6Vg'}],
        '6.3': [{'label':'Watch','id':'vPwQFfKdRlo'}],
        '6.4': [{'label':'Watch','id':'jkK8xfYA82Y'}],
        '6.5': [{'label':'Watch','id':'tH4s70qaizQ'}],
    },
    'unit7': {
        '7.1': [{'label':'Watch','id':'2qfqfXvMl1M'}],
        '7.2': [{'label':'Part 1','id':'zy_HYxIICqg'},{'label':'Part 2','id':'L6ACgPCDz6M'}],
        '7.3': [{'label':'Watch','id':'Nmrt8Crgstw'}],
        '7.4': [{'label':'Part 1','id':'SYuGs7sLLDw'},{'label':'Part 2','id':'F_YrHCGiAK0'}],
    },
    'unit8': {
        '8.1': [{'label':'Part 1','id':'FpsjmuOXGKY'},{'label':'Part 2','id':'zB4CqHgWFDs'}],
        '8.2': [{'label':'Part 1','id':'Wbu1B-nF0hs'},{'label':'Part 2','id':'tG3oHHCQf0E'}],
        '8.3': [{'label':'Watch','id':'_y2yvgZHefo'}],
        '8.4': [{'label':'Part 1','id':'XNA4XPW3xgk'},{'label':'Part 2','id':'m6nPTW5d94Y'},{'label':'Part 3','id':'-J53S55kY3c'}],
    },
    'unit9': {
        '9.1': [{'label':'Watch','id':'JzFHuuiVyjQ'}],
        '9.2': [{'label':'Watch','id':'iGDPk7orkMk'}],
        '9.3': [{'label':'Watch','id':'vZIW9ciQQcc'}],
        '9.4': [{'label':'Watch','id':'GkgC8oNZ_2s'}],
    },
    'unit10': {},  # No videos available
    'unit11': {
        '11.1': [{'label':'Zero Exp.','id':'1MIU3ZYJJsg'},{'label':'Neg. Exp.','id':'BBgQFUWraj0'}],
        '11.2': [{'label':'Multiply','id':'H4moEg-KRCg'},{'label':'Divide','id':'R6JVl7NeRHU'}],
        '11.3': [{'label':'Watch','id':'CNHVv1Q2RnQ'}],
    },
    'unit12': {
        '12.1': [{'label':'Watch','id':'yU9sCHU1pxQ'}],
        '12.2': [{'label':'Watch','id':'ueCcMc1FUsw'}],
        '12.3': [{'label':'Watch','id':'e5nwJKUc3bA'}],
        '12.4': [{'label':'Same Base','id':'5MyQNs5c79s'},{'label':'Diff. Base','id':'oM25leefVRQ'}],
    },
    'unit13': {
        '13.2': [{'label':'Watch','id':'jiq3toC7wGM'}],
        '13.4': [{'label':'Watch','id':'VFowmwWGQfY'}],
    },
    'unit14': {
        '14.1': [{'label':'Watch','id':'3RJlPvX-3vg'}],
        '14.2': [{'label':'Watch','id':'QH_hfKeLbbQ'}],
        '14.3': [{'label':'Watch','id':'1dAvklX9SBs'}],
        '14.4': [{'label':'Watch','id':'qg_Vrfu3F74'}],
    },
    'unit15': {
        '15.1': [{'label':'Watch','id':'QV4ZgKFXbzE'}],
        '15.4': [{'label':'Watch','id':'1I0sbYmF0og'}],
    },
    'unit16': {
        '16.1': [{'label':'Watch','id':'OO4j6ESyOiY'}],
        '16.2': [{'label':'Watch','id':'ntRdhGXSykg'}],
        '16.3': [{'label':'Watch','id':'JSwjmTFMDwg'}],
        '16.4': [{'label':'Watch','id':'lGZNaoHGsM8'}],
    },
}

# JS snippet to auto-render video buttons from UNIT.topics[].videos
VIDEO_JS = """
// V1.1 — Auto-render video buttons from UNIT.topics[].videos
document.addEventListener('DOMContentLoaded',function(){
  var theads=document.querySelectorAll('#v-notes .thead');
  UNIT.topics.forEach(function(t,i){
    if(!t.videos||!t.videos.length)return;
    var h=theads[i];if(!h)return;
    // Skip if already has vid-btn (unit5 hardcoded)
    if(h.querySelector('.vid-btn'))return;
    var chev=h.querySelector('.tchev');
    t.videos.forEach(function(v,j){
      var a=document.createElement('a');
      a.href='https://youtu.be/'+v.id;
      a.target='_blank';a.rel='noopener noreferrer';
      a.className='vid-btn';
      a.innerHTML='&#9654; '+v.label;
      a.onclick=function(e){e.stopPropagation();};
      if(j>0)a.style.marginLeft='3px';
      if(chev)h.insertBefore(a,chev);else h.appendChild(a);
    });
  });
});
"""

# Desmos calculator HTML (for practice tab)
DESMOS_CALC_P = '''<div class="pt-calc-col">
  <div class="calc-box" style="padding:.75rem">
    <div class="calc-title">&#128202; Graphing Calculator</div>
    <div id="desmos-p" style="width:100%;height:400px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e8"></div>
  </div>
</div>'''

# Desmos calculator HTML (for test tab)
DESMOS_CALC_T = '''<div class="pt-calc-col">
  <div class="calc-box" style="padding:.75rem">
    <div class="calc-title">&#128202; Graphing Calculator</div>
    <div id="desmos-t" style="width:100%;height:400px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e8"></div>
  </div>
</div>'''

DESMOS_SCRIPT = """<script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0faa6"></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
  function mkCalc(id){var e=document.getElementById(id);if(e&&!e._desmos){e._desmos=true;Desmos.GraphingCalculator(e,{keypad:true,expressions:true,settingsMenu:false});}}
  mkCalc('desmos-p');mkCalc('desmos-t');
});
</script>"""

def update_unit_topics_videos(content, unit_key):
    """Update the videos:[] in the UNIT.topics array in JS"""
    vdb = VIDEOS.get(unit_key, {})
    if not vdb:
        return content

    def replace_videos(m):
        topic_id = m.group(1)
        vlist = vdb.get(topic_id, [])
        vjs = json.dumps(vlist)
        return f'{{id:"{topic_id}",label:"{m.group(2)}",videos:{vjs}}}'

    # Match topic objects: {id:"X.Y",label:"...",videos:[...]}
    content = re.sub(
        r'\{id:"([\d.\-]+)",label:"([^"]+)",videos:\[[^\]]*\]\}',
        replace_videos,
        content
    )
    return content

def add_video_js(content):
    """Add the video rendering JS after the UNIT constant if not already present"""
    if 'Auto-render video buttons' in content:
        return content
    # Insert after the UNITS array closing
    target = 'const UNITS=['
    idx = content.find(target)
    if idx == -1:
        return content
    # Find the end of UNITS array
    end = content.find('];', idx) + 2
    content = content[:end] + VIDEO_JS + content[end:]
    return content

def switch_to_desmos(content):
    """Replace 4-function calculator column with Desmos in practice and test tabs"""
    # Check if already has Desmos
    if 'desmos.com/api' in content:
        # Just ensure the init function handles the new IDs
        return content

    # Pattern: <div class="pt-calc-col"><div class="calc-box">...(4-function)...</div></div>
    # We look for the sticky calc col in practice tab
    # Replace 4-function calc column in practice tab
    four_func_pattern = r'<div class="pt-calc-col"><div class="calc-box"><div class="calc-title">&#129518; Calculator</div><div class="calc-screen"><div class="calc-expr" id="cp-expr"[^<]*></div><div class="calc-val" id="cp-val">0</div></div><div class="calc-grid" id="cp-grid"></div></div></div>'
    if re.search(four_func_pattern, content):
        content = re.sub(four_func_pattern, DESMOS_CALC_P.strip(), content)

    four_func_pattern_t = r'<div class="pt-calc-col"><div class="calc-box"><div class="calc-title">&#129518; Calculator</div><div class="calc-screen"><div class="calc-expr" id="ct-expr"[^<]*></div><div class="calc-val" id="ct-val">0</div></div><div class="calc-grid" id="ct-grid"></div></div></div>'
    if re.search(four_func_pattern_t, content):
        content = re.sub(four_func_pattern_t, DESMOS_CALC_T.strip(), content)

    # Remove bc() calls for the 4-function calc (they'll error if calc divs are gone)
    content = re.sub(r"bc\('cp-grid','cp-val','cp-expr'\);", '', content)
    content = re.sub(r"bc\('ct-grid','ct-val','ct-expr'\);", '', content)

    # Add Desmos script before </body>
    if '</body>' in content and DESMOS_SCRIPT not in content:
        content = content.replace('</body>', DESMOS_SCRIPT + '\n</body>')

    return content

def fix_caret_exponents(content):
    """Replace x^n patterns in JS string data and HTML with <sup> tags.
    Only replaces simple single-digit or double-digit exponents."""
    # In HTML context (not inside script tags): x^2 → x<sup>2</sup>
    # We do this carefully to avoid breaking JS
    # For safety, only fix in known HTML sections (notes, vocab)
    # Simple replacements for common patterns
    exponent_map = {
        'x^2': 'x<sup>2</sup>', 'x^3': 'x<sup>3</sup>', 'x^4': 'x<sup>4</sup>',
        'x^5': 'x<sup>5</sup>', 'x^6': 'x<sup>6</sup>', 'x^7': 'x<sup>7</sup>',
        'x^8': 'x<sup>8</sup>', 'x^9': 'x<sup>9</sup>', 'x^10': 'x<sup>10</sup>',
        'x^12': 'x<sup>12</sup>', 'x^15': 'x<sup>15</sup>',
        'y^2': 'y<sup>2</sup>', 'y^3': 'y<sup>3</sup>',
        'a^2': 'a<sup>2</sup>', 'b^2': 'b<sup>2</sup>',
        'x²': 'x<sup>2</sup>', 'x³': 'x<sup>3</sup>',
    }
    # Only apply in HTML sections (before first <script> tag)
    script_start = content.find('<script>')
    if script_start == -1:
        script_start = len(content)
    html_part = content[:script_start]
    for old, new in exponent_map.items():
        html_part = html_part.replace(old, new)
    # Also fix HTML entities that appear as literal text
    html_part = html_part.replace('&amp;sup2;', '<sup>2</sup>')
    html_part = html_part.replace('&amp;sup3;', '<sup>3</sup>')
    content = html_part + content[script_start:]
    return content

def process_file(fname, unit_key, make_desmos=False):
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # A3: Update UNIT.topics[].videos arrays
    content = update_unit_topics_videos(content, unit_key)

    # A3: Add video rendering JS
    content = add_video_js(content)

    # C: Switch to Desmos if needed
    if make_desmos:
        content = switch_to_desmos(content)

    # A1: Fix caret exponents in HTML
    content = fix_caret_exponents(content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    return True

# Process all unit files
FILES = [
    ('unit1-4.html', 'unit1-4', False),
    ('unit5.html',   'unit5',   False),
    ('unit6.html',   'unit6',   False),
    ('unit7.html',   'unit7',   False),
    ('unit8.html',   'unit8',   True),   # needs Desmos
    ('unit9.html',   'unit9',   False),  # already has Desmos
    ('unit10.html',  'unit10',  False),
    ('unit11.html',  'unit11',  False),
    ('unit12.html',  'unit12',  False),
    ('unit13.html',  'unit13',  False),
    ('unit14.html',  'unit14',  False),
    ('unit15.html',  'unit15',  True),   # needs Desmos
    ('unit16.html',  'unit16',  True),   # needs Desmos
]

for fname, unit_key, make_desmos in FILES:
    if not os.path.exists(fname):
        print(f'SKIP {fname} (not found)')
        continue
    try:
        process_file(fname, unit_key, make_desmos)
        print(f'OK   {fname}')
    except Exception as e:
        print(f'ERR  {fname}: {e}')

print('\nDone.')
