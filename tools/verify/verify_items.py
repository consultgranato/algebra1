"""Independent verification of every answer key on the site.

Usage (from the repo root):
    node tools/extract-items.mjs          # dumps audit/raw/items.json from the live pages
    python tools/verify/verify_items.py   # writes audit/raw/verification.json

Each item is solved from its own text by SymPy (handlers.py) or, where the
item is a word problem, concept question or picture, by a hand-written
independent solution (manual.py). Neither path imports or evaluates site code.
"""
import json
import os
import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from handlers import HANDLERS, Verdict, norm_word, plain  # noqa: E402
from manual import MANUAL, AMBIGUOUS  # noqa: E402
from mathtext import MALFORMED_SUP  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = (ROOT / os.environ.get('A1_RAW', 'audit/raw')).resolve()  # tests/out under the harness
ITEMS = json.loads((RAW / 'items.json').read_text(encoding='utf-8'))


def item_id(f, it):
    return f'{f}:{it["kind"]}:{it["group"]}:{it["idx"]}'


def verify(f, it):
    iid = item_id(f, it)
    if iid in MANUAL:
        try:
            return MANUAL[iid](it)
        except Exception as ex:
            return Verdict('unverified', '', 'manual entry failed', [f'{type(ex).__name__}: {ex}'])
    for h in HANDLERS:
        try:
            v = h(it)
        except Exception as ex:  # a handler that cannot parse simply does not apply
            v = None
            last_err = f'{h.__name__}: {type(ex).__name__}: {ex}'
        if v is not None:
            return v
    return Verdict('unverified', '', 'no handler', ['no independent solver covers this item yet'])


# Topic labels whose items must all be special cases (no solution / all reals) or must not be.
SPECIAL_TOPICS = {'5.4', '6.4'}
LINEAR_TOPICS = {'5.1', '5.2', '5.3', '6.2', '6.3'}


def topic_of(f, it):
    return it['t'] or it['group']


def label_check(f, it, v):
    tp = topic_of(f, it)
    key = norm_word(it['a'])
    is_special = key in ('nosolution', 'allrealnumbers')
    if tp in SPECIAL_TOPICS and plain(it['q']).startswith('Solve') and not is_special:
        return f'topic {tp} is special cases, but the key is a single solution'
    if tp in LINEAR_TOPICS and is_special:
        return f'topic {tp} expects one solution, but the key is a special case'
    return None


def hint_check(it):
    """Explanation contradicts key: the hint's final '= N' differs from a numeric key."""
    h = plain(it.get('h') or '')
    a = plain(it['a'])
    if 'GCF' in h:  # "GCF(8,12)=4" names the common factor, not the answer
        return None
    if not re.fullmatch(r'(?:x\s*=\s*)?-?\d+(?:\.\d+)?(?:/\d+)?', a):
        return None
    nums = re.findall(r'[=→]\s*(?:x\s*=\s*)?(-?\d+(?:\.\d+)?(?:/\d+)?)\s*\.?\s*$', h)
    if not nums:
        return None
    want = re.sub(r'^x\s*=\s*', '', a)
    if nums[-1] != want and nums[-1] != want.lstrip('-') and want not in h:
        return f'hint ends "= {nums[-1]}" but key is {a}'
    return None


def main():
    report = {'units': {}, 'items': [], 'duplicates': [], 'draws': {}}
    for f, unit in ITEMS.items():
        counts = Counter()
        for it in unit['items']:
            v = verify(f, it)
            iid = item_id(f, it)
            flags = list(v.notes)
            if iid in AMBIGUOUS:
                flags.append('AMBIGUOUS: ' + AMBIGUOUS[iid])
            lc = label_check(f, it, v)
            if lc:
                flags.append('LABEL: ' + lc)
            hc = hint_check(it)
            if hc:
                flags.append('HINT: ' + hc)
            for fld in ('q', 'eq', 'a', 'fmt', 'h'):
                if it.get(fld) and MALFORMED_SUP.search(str(it[fld])):
                    flags.append(f'MARKUP: <sup> contains a parenthesis in {fld}: {it[fld]}')
            if re.search(r"\b(wait|actually|let me|let's fix|recalc|hmm|oops)\b|No\.\.\.", plain(it.get('h') or ''), re.I):
                flags.append('HINT-WORKING: explanation shown to students contains drafting/scratch work')
            if v.status == 'mismatch' and it.get('h'):
                flags.append('HINT-VS-KEY: see hint text; compare with key')
            if re.search(r'≈|wait', str(it['a'])):
                flags.append('KEY: contains working or an approximation symbol')
            counts['checked'] += 1
            counts[v.status] += 1
            if iid in AMBIGUOUS:
                counts['ambiguous'] += 1
            if any(fl.startswith(('LABEL', 'HINT:', 'HINT-WORKING', 'MARKUP')) for fl in flags):
                counts['flagged'] += 1
            report['items'].append({'id': iid, 'unit': f, 'kind': it['kind'], 'topic': topic_of(f, it),
                                    'q': it['q'], 'eq': it['eq'], 'key': it['a'], 'fmt': it['fmt'], 'hint': it['h'],
                                    'status': v.status, 'independent': v.independent, 'method': v.method,
                                    'flags': flags})
        report['units'][f] = dict(counts)

        # duplicates: practice sets are 5 drawn from one bank; tests 5 per topic from T
        for kind in ('bank', 'test'):
            groups = defaultdict(list)
            for it in unit['items']:
                if it['kind'] == kind:
                    groups[it['group'] if kind == 'bank' else (it['u'] or it['t'] or it['group'])].append(it)
            for g, its in groups.items():
                seen = defaultdict(list)
                for it in its:
                    seen[(plain(it['q']), plain(it['eq']), bool(it['svg']) and it['svg'][-400:])].append(it['idx'])
                for k, idxs in seen.items():
                    if len(idxs) > 1:
                        report['duplicates'].append({'unit': f, 'kind': kind, 'group': g, 'idx': idxs,
                                                     'q': k[0], 'eq': k[1]})
        # cross bank/test exact repeats (a test question the student already practised verbatim)
        bank_keys = {(plain(i['q']), plain(i['eq'])) for i in unit['items'] if i['kind'] == 'bank' and i['eq']}
        rep = [i['idx'] for i in unit['items'] if i['kind'] == 'test' and i['eq'] and (plain(i['q']), plain(i['eq'])) in bank_keys]
        if rep:
            report['duplicates'].append({'unit': f, 'kind': 'test-repeats-practice', 'group': '*', 'idx': rep,
                                         'q': 'test items identical to a practice item', 'eq': ''})

        # seeded draws, mirroring the site's assembly (5 per practice set; 5 per topic per test)
        rng = random.Random(219)
        dup_sets = 0
        draws = 10000
        banks = defaultdict(list)
        for it in unit['items']:
            if it['kind'] == 'bank':
                banks[it['group']].append((plain(it['q']), plain(it['eq']), it['svg'] or ''))
        for g, pool in banks.items():
            for _ in range(draws):
                s = rng.sample(pool, min(5, len(pool)))
                if len(set(s)) < len(s):
                    dup_sets += 1
        tests = defaultdict(list)
        for it in unit['items']:
            if it['kind'] == 'test':
                tests[it['u'] or it['t'] or it['group']].append((plain(it['q']), plain(it['eq']), it['svg'] or ''))
        dup_tests = 0
        sizes = Counter()
        for _ in range(draws):
            s = []
            for g, pool in tests.items():
                s += rng.sample(pool, min(5, len(pool)))
            sizes[len(s)] += 1
            if len(set(s)) < len(s):
                dup_tests += 1
        report['draws'][f] = {'practice_sets_drawn': draws * len(banks), 'practice_sets_with_duplicate': dup_sets,
                              'tests_drawn': draws, 'tests_with_duplicate': dup_tests,
                              'test_length': dict(sizes)}

    out = RAW / 'verification.json'
    out.write_text(json.dumps(report, indent=1, ensure_ascii=False, default=str), encoding='utf-8')
    tot = Counter()
    for f, c in report['units'].items():
        tot.update(c)
        print(f'{f:14} ' + ' '.join(f'{k}={c.get(k, 0)}' for k in ('checked', 'match', 'mismatch', 'ambiguous', 'unverified', 'flagged')))
    print('TOTAL          ' + ' '.join(f'{k}={tot.get(k, 0)}' for k in ('checked', 'match', 'mismatch', 'ambiguous', 'unverified', 'flagged')))
    return report


if __name__ == '__main__':
    main()


def vocab_checks():
    """Vocabulary quiz items: answer index in range, no duplicate options,
    and a filter button for every topic that has questions."""
    out = []
    for f, unit in ITEMS.items():
        vqb = unit.get('vqb') or []
        topics = sorted({q['topic'] for q in vqb})
        filters = [x for x in unit.get('vqFilters') or [] if x and x != 'all']
        for i, q in enumerate(vqb):
            if q['type'] in ('mc', 'tf'):
                if not (0 <= q['a'] < len(q['opts'])):
                    out.append({'unit': f, 'idx': i, 'issue': 'answer index out of range', 'q': q['q']})
                dup = [o for o in set(q['opts']) if q['opts'].count(o) > 1]
                if dup:
                    graded_wrong = [j for j, o in enumerate(q['opts']) if o == q['opts'][q['a']] and j != q['a']]
                    out.append({'unit': f, 'idx': i, 'q': q['q'], 'opts': q['opts'],
                                'issue': f'duplicate option(s) {dup}' + (
                                    f'; option {graded_wrong} shows the correct answer but is graded wrong' if graded_wrong else '')})
            elif q['type'] == 'match':
                rights = [p[1] for p in q['pairs']]
                if len(set(rights)) != len(rights):
                    out.append({'unit': f, 'idx': i, 'issue': 'duplicate right-hand choices', 'q': q['q']})
        missing = [t for t in topics if t not in filters]
        if filters and missing:
            out.append({'unit': f, 'idx': None, 'issue': f'no quiz filter button for topic(s) {missing}', 'q': ''})
        no_vocab = [t for t in (unit.get('practiceButtons') or []) if t not in topics]
        if no_vocab:
            out.append({'unit': f, 'idx': None, 'issue': f'practice topic(s) with no vocabulary questions: {no_vocab}', 'q': ''})
    return out


if __name__ == '__main__':
    rep = json.loads((RAW / 'verification.json').read_text(encoding='utf-8'))
    rep['vocab'] = vocab_checks()
    (RAW / 'verification.json').write_text(json.dumps(rep, indent=1, ensure_ascii=False, default=str), encoding='utf-8')
    for v in rep['vocab']:
        print('VOCAB', v)
