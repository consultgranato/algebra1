#!/usr/bin/env python3
"""
Wrap vocab terms in <span class="vw">...</span> inside each unit's Notes section.
- Extracts .vterm text from vocab cards
- Only touches the #v-notes div
- Skips text already inside <span class="vw">
- Uses whole-word matching, case-insensitive, preserves original case
"""
import re, os

def extract_vocab_terms(html):
    """Pull all .vterm text content from the vocab section."""
    # Find vocab card terms
    terms = re.findall(r'class="vterm"[^>]*>([^<]+)<', html)
    # Also pull from vsec headers if needed
    # Clean up: strip, deduplicate, keep non-empty
    seen = set()
    result = []
    for t in terms:
        t = t.strip()
        if t and t.lower() not in seen and len(t) > 2:
            seen.add(t.lower())
            result.append(t)
    return result

def split_html_tokens(html):
    """Split HTML into alternating [text, tag, text, tag, ...] tokens."""
    # This regex matches HTML tags (including comments)
    tag_re = re.compile(r'(<[^>]+>|<!--.*?-->)', re.DOTALL)
    tokens = tag_re.split(html)
    # tokens[0::2] are text nodes, tokens[1::2] are tags
    return tokens

def is_inside_vw(tokens, idx):
    """Check if token at idx is currently inside a <span class="vw"> block."""
    # Walk backwards to find if there's an open .vw span without a close
    depth = 0
    for i in range(idx - 1, -1, -1):
        tok = tokens[i]
        if i % 2 == 1:  # it's a tag
            if re.search(r'<span[^>]+class="vw"', tok):
                return True
            if tok == '</span>':
                depth += 1
            elif tok.startswith('<span') and depth > 0:
                depth -= 1
    return False

def apply_vw_to_text(text, terms_patterns):
    """Apply vw spans to text node. Returns (new_text, count_added)."""
    count = 0
    for pattern, original in terms_patterns:
        def replacer(m):
            nonlocal count
            count += 1
            return f'<span class="vw">{m.group(0)}</span>'
        new_text = pattern.sub(replacer, text)
        text = new_text
    return text, count

def wrap_vw_in_notes(html, terms):
    """Wrap vocab terms in .vw spans within the #v-notes section only."""
    if not terms:
        return html, 0

    # Isolate the notes section
    notes_start_m = re.search(r'<div id="v-notes">', html)
    if not notes_start_m:
        return html, 0
    notes_start = notes_start_m.start()

    # Find the end of v-notes (next sibling div at same level)
    # Look for the closing pattern: </div>\n\n    <div id="v-vocab"
    notes_end_m = re.search(r'<div id="v-vocab"', html[notes_start:])
    if not notes_end_m:
        return html, 0
    notes_end = notes_start + notes_end_m.start()

    notes_html = html[notes_start:notes_end]

    # Build regex patterns for each term
    # Compile term patterns — whole word match, case insensitive
    terms_patterns = []
    for term in terms:
        # Escape special regex chars
        escaped = re.escape(term)
        # For multi-word terms, allow flexible spacing
        # Build a word-boundary pattern
        # Don't match if already inside a span.vw
        pat = re.compile(
            r'(?<![>"\'])(?<!\w)' + escaped + r'(?!\w)(?![^<]*</span>)',
            re.IGNORECASE
        )
        terms_patterns.append((pat, term))

    # Process token by token
    tokens = split_html_tokens(notes_html)
    total_added = 0
    in_vw = False
    skip_next = 0

    new_tokens = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if i % 2 == 0:  # text node
            if in_vw or skip_next > 0:
                # Don't wrap inside existing .vw span
                new_tokens.append(tok)
            else:
                new_tok, count = apply_vw_to_text(tok, terms_patterns)
                total_added += count
                new_tokens.append(new_tok)
        else:  # tag
            # Track if we enter/exit a .vw span
            if re.search(r'class="vw"', tok):
                in_vw = True
            elif tok == '</span>' and in_vw:
                in_vw = False
            # Skip wrapping inside other special elements
            if re.search(r'class="(kc-lbl|wlbl|vterm|vtag|vsec|note-h|afmt|eq-note|calc-|pmeta|pnum|ptag)"', tok):
                skip_next += 1
            elif tok.startswith('</') and skip_next > 0:
                skip_next -= 1
            new_tokens.append(tok)
        i += 1

    new_notes = ''.join(new_tokens)

    # Rebuild full HTML
    new_html = html[:notes_start] + new_notes + html[notes_end:]
    return new_html, total_added

def post_fix_doubles(html):
    """Remove double-wrapped spans: <span class="vw"><span class="vw">X</span></span>"""
    pattern = re.compile(
        r'<span class="vw"><span class="vw">([^<]+)</span></span>'
    )
    while pattern.search(html):
        html = pattern.sub(r'<span class="vw">\1</span>', html)
    return html

def process_file(fname):
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()

    terms = extract_vocab_terms(html)
    if not terms:
        return 0, []

    new_html, count = wrap_vw_in_notes(html, terms)
    new_html = post_fix_doubles(new_html)

    if count > 0:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(new_html)

    return count, terms

FILES = [
    'unit1-4.html',
    'unit5.html',
    'unit6.html',
    'unit7.html',
    'unit8.html',
    'unit9.html',
    'unit10.html',
    'unit11.html',
    'unit12.html',
    'unit13.html',
    'unit14.html',
    'unit15.html',
    'unit16.html',
]

print(f"{'File':<18} {'Terms found':<14} {'Spans added'}")
print('-' * 50)
results = {}
for fname in FILES:
    if not os.path.exists(fname):
        print(f'{fname:<18} NOT FOUND')
        continue
    count, terms = process_file(fname)
    results[fname] = count
    status = '✓ already clean' if count == 0 else f'+{count} spans added'
    print(f'{fname:<18} {len(terms):<14} {status}')

print()
missing = [f for f,c in results.items() if c > 0]
clean   = [f for f,c in results.items() if c == 0]
print(f'Files with new spans added ({len(missing)}): {", ".join(missing) or "none"}')
print(f'Files already clean ({len(clean)}): {", ".join(clean) or "none"}')
