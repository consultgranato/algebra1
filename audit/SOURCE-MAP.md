# Source map

How the site works, read from the raw source on branch `a1-evidence-pass` (base `2451289`). Line numbers are
for that commit. Where a statement is about runtime behaviour, it was also confirmed in headless Chrome; the
command is given.

## Files and load order

| File | Size | Role |
|---|---:|---|
| `index.html` | 8.9 KB | Unit picker. Inline `<style>`, 14 unit cards, "Clear all saved progress" button. No inline script. |
| `unit1-4.html`, `unit5.html` … `unit16.html` | 74–130 KB each | One page per unit. Inline `<style>`, all HTML views, and **one inline `<script>`** holding the unit's content data *and* its own copy of the page logic. |
| `assets/algebra1.js` | 60.5 KB | Shared enhancement layer, loaded **last** on every page (`<script src="assets/algebra1.js">` after the inline script, e.g. [unit5.html:798](../unit5.html#L798)). Its assignments to `window.*` replace the page's own functions of the same name. |
| `assets/algebra1.css` | 28.9 KB | Shared styles, linked last in every `<head>`. |
| `Packetsite/*.png|jpeg` | 12 images, 2.0 MB total | Packet scans shown inside notes. `unit6-img-025.jpeg` alone is 945 KB. |
| `extracted-images/`, `docs/`, `scripts/legacy/` | — | Not served to students (dev material). |

There is no build step, no framework, no backend. Runtime third-party requests: YouTube (video buttons are
plain links that open a new tab) and the Desmos iframe on units 8, 9, 15, 16, which `algebra1.js` loads lazily
([algebra1.js:757](../assets/algebra1.js#L757)).

## Where content lives

Every unit page declares, inside its inline script:

| Name | Shape | Example location |
|---|---|---|
| `UNIT` | `{id, name, topics[{id,label,videos}]}`; `id` is the progress key | [unit5.html:399](../unit5.html#L399) |
| `TOPICS` | notes modal content: `{tag, title, videos[{label,url}], html}` (the notes are an HTML string) | [unit5.html:407](../unit5.html#L407) |
| `BANKS` | `{ '5.1': [ {q, eq, a, fmt, h, svg?, graphIt?} × 15 ] }` | [unit5.html:441](../unit5.html#L441) |
| `T` | practice-test pool, same item shape plus `t` (topic) | [unit5.html:511](../unit5.html#L511) |
| `VQB` | vocabulary quiz: `{topic, type:'mc'|'tf'|'match', q, opts, a}` | [unit5.html:534](../unit5.html#L534) |
| `DESCS` | one-line topic descriptions | [unit5.html:554](../unit5.html#L554) |

Item fields: `q` question text, `eq` the maths (rendered through the page's `formatEq`), **`a` the answer key**
(plain text, sometimes with `<sup>` markup), `fmt` the "Answer format" hint line, **`h` the explanation** (shown as
the hint, and again after a wrong answer), `svg` an inline picture, `graphIt` an expression sent to Desmos.

`unit1-4.html` differs: `UNIT.topics` is empty, `BANKS` is keyed by unit (`'unit1'`…`'unit4'`) with a `t` per item,
`T` items carry `u` (unit) and `t`, and the notes are hidden DOM sections addressed through `TOPIC_TAGS`
([unit1-4.html:1426](../unit1-4.html#L1426)) instead of a `TOPICS` array.

**Problems are not generated.** There are no generator functions; every item is a static literal. Totals
(`node tools/extract-items.mjs`): 855 practice items, 285 test-pool items, 243 vocabulary items.

## How a problem set is assembled

- **Practice** — `loadP()` ([unit5.html:654](../unit5.html#L654)): `pset = shuffle(BANKS[curTopic]).slice(0, 5)`.
  Five problems from the topic's fifteen. `shuffle` is replaced by the unbiased Fisher–Yates in
  [algebra1.js:349](../assets/algebra1.js#L349). Nothing about the set is stored; reloading draws a new one.
- **Practice test** — `loadT()`: most units take `shuffle(pool).slice(0, 5)` per topic and concatenate
  ([unit8.html:657](../unit8.html#L657)), so test length = 5 × topics (15–35 questions). `unit5.html` instead takes
  `shuffle(T).slice(0, 20)` of the whole 20-item pool ([unit5.html:674](../unit5.html#L674)); `unit1-4` takes 5 per
  unit. The test set lives only in the in-memory `tset` array; typed answers live only in the `<input>` elements.
  **Nothing is written to storage, and nothing reads `location.hash` or `history` anywhere in the site**
  (`grep -n "location.hash\|history\.\|sessionStorage" *.html assets/*.js` → no matches).
- **Vocabulary quiz** — `loadVQ()`: up to 12 random questions from `VQB`, optionally filtered by topic button.

## How an answer is checked

1. The student types into `<input class="ai">` and presses **Check** (practice) or **Submit** (test).
2. Practice: the page's `check()`/`chk()` is replaced by `runCheck()` ([algebra1.js:1200](../assets/algebra1.js#L1200),
   installed at [algebra1.js:1247](../assets/algebra1.js#L1247)). A blank input just refocuses
   ([algebra1.js:1207](../assets/algebra1.js#L1207)). A wrong first try gets "Not quite — try once more" and a
   **Show a hint** button; a wrong second try reveals the key and the explanation. A right answer on either try
   marks the card `ok`, so a second-try success counts as fully correct.
3. Test: the page's own `gradeT()` ([unit5.html:684](../unit5.html#L684)) loops over every question and calls
   `isMatch(input.value, p.a)` once. Blank inputs are passed straight in and fail (`isMatch` returns `false` for
   blank, [algebra1.js:322](../assets/algebra1.js#L322)). There is no confirmation step.
4. **Which checker runs.** Every page defines its own `isMatch`/`matches`/`norm`, but these are global function
   declarations, so the assignments `W.isMatch = isMatch; W.matches = isMatch` at
   [algebra1.js:343–345](../assets/algebra1.js#L343) overwrite them. Confirmed on all 13 pages:
   `node tests/run-checker-corpus.mjs` prints `every page grades with the shared isMatch: true`.

### The checker, step by step ([algebra1.js:23–341](../assets/algebra1.js#L23))

- `clean()` strips HTML tags (**including the `<sup>` in keys, without inserting `^`** — this is the source of the
  biggest grading bug, see the audit report), decodes a few entities, maps Unicode superscripts to `^(n)`, folds
  `− – —` to `-`, `× · ∙` to `*`, `÷` to `/`, `≤ ≥` to `<= >=`, and lower-cases.
- `norm()` folds ` or `/` and ` to a comma, deletes all whitespace, normalises `=<`/`=>`, unwraps `^(n)`, drops
  `*` between a number/variable and a variable or `(`, removes `^1` and a leading coefficient `1`, a leading `+`,
  and one trailing `,` or `.`.
- `isMatch(u, c)` then accepts if any of these hold: identical normal forms; both sides map to the same alias
  (`ALIASES` [algebra1.js:81](../assets/algebra1.js#L81): no solution / all real numbers / yes / no / undefined /
  function); `numEq` (equal values, but two unreduced fractions are rejected); `monoEq` (single monomials with
  coefficients and integer exponents, so `x^-4 = 1/x^4`); `factorKey` (product of parenthesised factors in any
  order); `canonSum` (terms of a sum in any order); stripping a leading `x=`; ordered pairs (named or bare);
  solution sets in any order; an inequality and its mirror image.
- Any exception falls back to a case-insensitive string comparison ([algebra1.js:336](../assets/algebra1.js#L336)).

The checker has no notion of units ("4 hours"), commas in numbers ("4,000"), mixed numbers, ±, `sqrt`, decimals
without a leading zero, or "and" versus "or" (both become a comma). Measured behaviour is in
`tests/checker-corpus.json` / `tests/checker-baseline.json`.

## How progress is scored and stored

Storage: `localStorage['alg1.progress.v1']`, one JSON object keyed by `UNIT.id` as a string
([algebra1.js:362–386](../assets/algebra1.js#L362)). Shape actually written:

```json
{
  "5": {
    "notesRead": { "0": true, "2": true },
    "practice":  { "5.1": { "attempts": 3, "last": 80, "best": 100 } },
    "test":      { "attempts": 1, "last": 65, "best": 65 },
    "vocab":     { "attempts": 2, "last": 75, "best": 83 },
    "updated":   1761170000000
  }
}
```

- `notesRead[i]` is set when the notes modal for topic index `i` opens (the wrapper on `openTopic`,
  [algebra1.js:508](../assets/algebra1.js#L508)), whether or not anything is read.
- `practice[topic]` is written when a 5-problem set is finished (`checkAllDone` wrapper,
  [algebra1.js:1324](../assets/algebra1.js#L1324)): `last` = % of the five cards marked `ok`, `best` = max.
- `test` and `vocab` are written after grading, from the `n/m` text in `#snum` / `#vq-sn`
  ([algebra1.js:1346](../assets/algebra1.js#L1346), [1360](../assets/algebra1.js#L1360)).
- **Reset** on a unit page deletes that unit's record immediately, with no confirmation
  ([algebra1.js:1012](../assets/algebra1.js#L1012)). **Clear all saved progress** on the index uses `window.confirm`
  then deletes the whole key ([algebra1.js:1488](../assets/algebra1.js#L1488)).

### "Topics 80%+" chip ([algebra1.js:987–991](../assets/algebra1.js#L987))

`strong / topics`, where `topics` = the unit's practice-topic buttons and `strong` = topics whose **best** 5-problem
set is ≥ 80%, that is, 4 or 5 of 5, with second-try successes counting as correct. One good set is enough; it never
decays.

### Unit percentage (the ring on a unit page) — `mastery()` ([algebra1.js:942](../assets/algebra1.js#L942))

```
round(100 × ( 0.15 × notesOpened / topicCount
            + 0.35 × strongTopics / practiceTopics
            + 0.35 × test.best / 100
            + 0.15 × vocab.best / 100 ))
```

The "Next step" box walks the same order: open every note → every topic to 80% → vocab quiz once → practice test
→ test to 80% ([algebra1.js:916](../assets/algebra1.js#L916)).

### Unit percentage on the index — `unitScore()` ([algebra1.js:1405](../assets/algebra1.js#L1405))

A **different** formula, because the index does not know each unit's topic list:

```
round(100 × ( 0.35 × strongTopics / topicsAttempted
            + 0.35 × test.best / 100
            + 0.15 × vocab.best / 100
            + 0.15 × min(1, notesOpened / 4) ))
```

The denominator is topics *attempted*, not topics in the unit, and notes count as complete after any four. So
the index overstates progress. Example: one Unit 10 topic practised to 100% and nothing else shows **5%** on the
unit page but **35%** ("1/1 topics strong") on the index card (measured: `node tools/probe-progress.mjs`). The card shows "Strong" at ≥ 80; "Course progress" is the mean of the
13 card scores.
