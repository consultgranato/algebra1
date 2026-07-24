#!/usr/bin/env python3
"""
Fix Desmos initialization in unit8, unit9, unit15, unit16.

Root causes:
1. <script> tag at end of <body>, not in <head>
2. Init fires on DOMContentLoaded while containers are display:none
3. No lazy-init from sw() — Desmos never reinits when tab becomes visible
4. Inconsistent container IDs across files
"""
import re

DESMOS_SCRIPT_TAG = '<script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0faa6"></script>'

# JS to inject into the main <script> block (after UNIT / UNITS / BANKS etc.)
# Contains: lazy initDesmos(), and the lazy check helpers
DESMOS_JS = """
/* ── DESMOS LAZY INIT ─────────────────────────────────────────── */
let calcP=null,calcT=null;
function initDesmos(){
  const elP=document.getElementById('desmos-practice');
  if(elP&&!calcP){calcP=Desmos.GraphingCalculator(elP,{keypad:true,expressions:true,settingsMenu:false,zoomButtons:true});}
  const elT=document.getElementById('desmos-test');
  if(elT&&!calcT){calcT=Desmos.GraphingCalculator(elT,{keypad:true,expressions:true,settingsMenu:false,zoomButtons:true});}
}
"""

# The correct sw() for Desmos units — calls initDesmos on practice/test
SW_DESMOS = ("function sw(n,btn){"
  "document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));"
  "btn.classList.add('on');"
  "['notes','vocab','practice','test'].forEach(id=>document.getElementById('v-'+id).classList.toggle('hidden','v-'+id!=='v-'+n));"
  "if(n==='practice'){if(!document.getElementById('plist').children.length)loadP();setTimeout(initDesmos,50);}"
  "if(n==='test'){if(!document.getElementById('tlist').children.length)loadT();setTimeout(initDesmos,50);}"
  "if(n==='vocab'&&!vqSet.length)loadVQ();"
  "}")

# HTML for Desmos calculator columns (standardized IDs)
DESMOS_COL_P = ('<div class="pt-calc-col"><div class="calc-box">'
  '<div class="calc-title">&#128202; Graphing Calculator</div>'
  '<div id="desmos-practice" style="width:100%;height:400px;border-radius:8px;overflow:hidden;"></div>'
  '</div></div>')

DESMOS_COL_T = ('<div class="pt-calc-col"><div class="calc-box">'
  '<div class="calc-title">&#128202; Graphing Calculator</div>'
  '<div id="desmos-test" style="width:100%;height:400px;border-radius:8px;overflow:hidden;"></div>'
  '</div></div>')

# ── per-file config: old container IDs and old Desmos init block patterns ──────

FILE_CONFIGS = {
    'unit8.html': {
        'old_p_id': 'desmos-calc-p',
        'old_t_id': 'desmos-calc-t',
        'old_init': ('<script src="https://www.desmos.com/api/v1.9/calculator.js'
                     '?apiKey=dcb31709b452b1cf9dc26972add0faa6"></script>\n'
                     "<script>var e=document.getElementById('desmos-calc-p');"
                     "if(e)Desmos.GraphingCalculator(e);"
                     "var e2=document.getElementById('desmos-calc-t');"
                     "if(e2)Desmos.GraphingCalculator(e2);</script>"),
    },
    'unit9.html': {
        'old_p_id': 'desmos-calc',
        'old_t_id': 'desmos-calc-test',
        'old_init': ('<script src="https://www.desmos.com/api/v1.9/calculator.js'
                     '?apiKey=dcb31709b452b1cf9dc26972add0faa6"></script>\n'
                     '<script>\n'
                     "  var elt=document.getElementById('desmos-calc');\n"
                     "  if(elt){var calculator=Desmos.GraphingCalculator(elt,{keypad:true,expressions:true});}\n"
                     "  var elt2=document.getElementById('desmos-calc-test');\n"
                     "  if(elt2){var calculator2=Desmos.GraphingCalculator(elt2,{keypad:true,expressions:true});}\n"
                     '</script>'),
    },
    'unit15.html': {
        'old_p_id': 'desmos-calc-p',
        'old_t_id': 'desmos-calc-t',
        'old_init': ('<script src="https://www.desmos.com/api/v1.9/calculator.js'
                     '?apiKey=dcb31709b452b1cf9dc26972add0faa6"></script>\n'
                     "<script>var e=document.getElementById('desmos-calc-p');"
                     "if(e)Desmos.GraphingCalculator(e);"
                     "var e2=document.getElementById('desmos-calc-t');"
                     "if(e2)Desmos.GraphingCalculator(e2);</script>"),
    },
    'unit16.html': {
        'old_p_id': 'desmos-p',
        'old_t_id': 'desmos-t',
        'old_init': ('<script src="https://www.desmos.com/api/v1.9/calculator.js'
                     '?apiKey=dcb31709b452b1cf9dc26972add0faa6"></script>\n'
                     '<script>\n'
                     "document.addEventListener('DOMContentLoaded',function(){\n"
                     "  function mkCalc(id){var e=document.getElementById(id);"
                     "if(e&&!e._desmos){e._desmos=true;"
                     "Desmos.GraphingCalculator(e,{keypad:true,expressions:true,settingsMenu:false});}}\n"
                     "  mkCalc('desmos-p');mkCalc('desmos-t');\n"
                     '});\n'
                     '</script>'),
    },
}

def fix_file(fname, cfg):
    with open(fname) as f:
        c = f.read()

    steps = []

    # ── STEP 1: Move script tag to <head> ─────────────────────────────────────
    # Remove old init block (script tag + inline init) from near </body>
    old_init = cfg['old_init']
    if old_init in c:
        c = c.replace(old_init, '', 1)
        steps.append('removed broken init block from </body>')
    else:
        # Try removing just the script tag if the inline block differs
        if DESMOS_SCRIPT_TAG in c:
            # Find and remove from body area (after </style>)
            c = c.replace(DESMOS_SCRIPT_TAG + '\n', '', 1) or c.replace(DESMOS_SCRIPT_TAG, '', 1)
            steps.append('removed stray Desmos script tag from body')

    # Add Desmos script to <head> if not already there
    head_m = re.search(r'<head>(.*?)</head>', c, re.DOTALL)
    head_content = head_m.group(1) if head_m else ''
    if 'desmos.com/api' not in head_content:
        c = c.replace('</head>', DESMOS_SCRIPT_TAG + '\n</head>', 1)
        steps.append('added Desmos script to <head>')

    # ── STEP 2: Standardize container IDs ────────────────────────────────────
    old_p = cfg['old_p_id']
    old_t = cfg['old_t_id']

    if old_p != 'desmos-practice':
        old_count = c.count(f'id="{old_p}"')
        c = c.replace(f'id="{old_p}"', 'id="desmos-practice"')
        steps.append(f'renamed {old_count}× {old_p} → desmos-practice')

    if old_t != 'desmos-test':
        old_count = c.count(f'id="{old_t}"')
        c = c.replace(f'id="{old_t}"', 'id="desmos-test"')
        steps.append(f'renamed {old_count}× {old_t} → desmos-test')

    # ── STEP 3: Standardize calc column HTML ─────────────────────────────────
    # Replace any variant calc-col with consistent markup (for practice)
    # Match the pt-calc-col div containing a desmos-practice div
    practice_col_pat = re.compile(
        r'<div class="pt-calc-col"[^>]*>.*?id="desmos-practice"[^>]*/>\s*</div>\s*</div>',
        re.DOTALL
    )
    if practice_col_pat.search(c):
        c = practice_col_pat.sub(DESMOS_COL_P, c, count=1)
        steps.append('standardized practice calc column HTML')

    test_col_pat = re.compile(
        r'<div class="pt-calc-col"[^>]*>.*?id="desmos-test"[^>]*/>\s*</div>\s*</div>',
        re.DOTALL
    )
    if test_col_pat.search(c):
        c = test_col_pat.sub(DESMOS_COL_T, c, count=1)
        steps.append('standardized test calc column HTML')

    # ── STEP 4: Inject initDesmos() into the main JS block ───────────────────
    if 'initDesmos' not in c:
        # Inject before the shuffle() function (safe anchor in all files)
        anchor = 'function shuffle('
        if anchor in c:
            c = c.replace(anchor, DESMOS_JS + '\n' + anchor, 1)
            steps.append('injected initDesmos() lazy-init function')

    # ── STEP 5: Update sw() to call initDesmos on tab switch ─────────────────
    # Match the existing sw() — all variants have the same structure
    sw_pat = re.compile(
        r'function sw\(n,btn\)\{[^}]+\}(?=\nfunction |\nlet |\nvar )',
        re.DOTALL
    )
    if sw_pat.search(c):
        if 'initDesmos' not in sw_pat.search(c).group(0):
            c = sw_pat.sub(SW_DESMOS, c, count=1)
            steps.append('updated sw() with setTimeout(initDesmos,50)')

    # ── STEP 6: Remove stale calc-grid div remnants (unit16 only) ────────────
    if fname == 'unit16.html':
        # Remove any <div class="calc-grid"...> blocks that are empty/stale
        stale = re.compile(r'<div class="calc-grid"[^>]*></div>')
        n_stale = len(stale.findall(c))
        if n_stale:
            c = stale.sub('', c)
            steps.append(f'removed {n_stale} stale calc-grid div(s)')

    with open(fname, 'w') as f:
        f.write(c)

    return steps


for fname, cfg in FILE_CONFIGS.items():
    steps = fix_file(fname, cfg)
    print(f'\n{fname}:')
    for s in steps:
        print(f'  ✓ {s}')
    if not steps:
        print('  (no changes — already correct)')

print('\nAll files processed.')
