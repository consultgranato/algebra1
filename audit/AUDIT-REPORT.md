# Algebra 1 site — evidence-first audit (Phase 0)

Branch `a1-evidence-pass`, base commit `2451289`. **No site file was changed.** Everything below was measured
from the raw source and from the pages running in headless Chrome. Each finding cites a file and line, a command
and its output, or a saved artifact under `audit/`. "Unverified" means I could not check it myself; those items are
collected in **Needs a human** and scripted in `HUMAN-CHECKS.md`.

Priority order, as briefed: (1) math correctness, (2) access, (3) usability, (4) polish.

## Contents of `audit/`

| File | What it is |
|---|---|
| `SOURCE-MAP.md` | How content, grading, progress and the "Topics 80%+" / unit-% rules work, with line references |
| `CONTENT-VERIFICATION.md` | Independent re-solve of all 1,140 practice and test items; every failing item with the site key beside the independent answer |
| `HUMAN-CHECKS.md` (+ `human/`) | Screen-reader, device, blind-review, pilot and standards scripts |
| `raw/items.json` | Every item as the browser sees it (`node tools/extract-items.mjs`) |
| `raw/verification.json` | Per-item verdicts (`python tools/verify/verify_items.py`) |
| `raw/checker-run.json`, `raw/key-roundtrip.json` | Checker corpus run and the "type the key back in" test |
| `raw/axe/*.json`, `raw/a11y-*.json`, `raw/math-a11y.json` | axe-core per page × view × viewport; DOM walk; behaviour probes; maths accessibility |
| `raw/lighthouse/*.json` | Lighthouse mobile + desktop for index, unit1-4, unit5, unit15 |
| `raw/notes.json`, `raw/videos.json`, `raw/learning.json` | Notes, YouTube oEmbed results, learning-design measurements |
| `raw/repro.json`, `raw/shots/*.png`, `raw/svgs/*.png` | UI reproductions of reported issues, screenshots, graph contact sheets |

---

## Ranked findings

Severity: **S1** a student is told something false or graded wrongly, or a student who relies on assistive tech is
locked out; **S2** a real barrier or loss of work; **S3** friction; **S4** polish.
"Progress risk" is the risk that *fixing* the finding disturbs data already saved under `alg1.progress.v1`.

| # | Sev | Finding | Units | Progress risk |
|---|---|---|---|---|
| 1 | S1 | 17 answer keys are wrong (12 practice, 5 test) | 6, 7, 9, 10, 12, 15 | None |
| 2 | S1 | Exponent answers are graded backwards: 81 keys reject the right answer typed with `^` and accept it typed without | 13 (57 of 80), 12 (17), 1–4 (7) | None |
| 3 | S1 | Maths is unreadable to screen readers: `(7/3)x = 14` is exposed as "7 3 x = 14", `x^9/x^3` as "x 9 x 3" | All | None |
| 4 | S1 | 10 Unit 13 problems display a different problem from the one keyed (broken `<sup>`) | 13 | None |
| 5 | S1 | Explanations shown to students contain the author's scratch work and contradict their own keys | 9, 10, 12 (6 items) | None |
| 6 | S2 | The checker rejects 92 of 310 fair answers in the corpus and accepts 3 wrong ones | All | None if lenient-only; see #6 |
| 7 | S2 | A vocabulary question offers "10" twice; choosing the second "10" is graded wrong | 1–4 | None |
| 8 | S2 | Practice Test answers are lost on refresh and the question set reshuffles | All | None (new key) |
| 9 | S2 | Submitting a test with blanks gives no warning and grades blanks wrong; focus is then lost | All | None |
| 10 | S2 | One tap on "Reset" deletes a unit's progress with no confirmation; target is 55×18 px | All units | **Is** the risk; fix lowers it |
| 11 | S2 | Text contrast below 4.5:1 on 20+ classes, including `.ptag`, `.afmt`, `.calc-title`, `.a1-step-n` | All | None |
| 12 | S2 | Index progress uses a different, inflated formula from the unit page (35% vs 5%) | Index | Display only; stored data unchanged |
| 13 | S2 | Notes warn about errors the practice sets never or rarely show | 5, 9, 10, 11, 14, 16 | None |
| 14 | S2 | Mobile layout shift (CLS 0.25–0.27, "poor") from content injected after first paint | All | None |
| 15 | S3 | No deep links: every reload returns to Notes | All | None |
| 16 | S3 | Results breakdown unsorted, with no route back to the notes or practice for a weak topic | All | None |
| 17 | S3 | At 390 px the calculator sits below all five problems (1,172 px below the first) | Pages with calculator | None |
| 18 | S3 | Streak pill renders as an empty outline below 600 px | All | None |
| 19 | S3 | "Clear all saved progress" is inside the Semester 2 `<h2>` and uses native `confirm()` | Index | Lowers risk |
| 20 | S3 | Text under 12 px and touch targets under 44 px are widespread; two are under the 24 px WCAG 2.2 AA minimum | All | None |
| 21 | S3 | Topic cards are `role="button"` containing a button (nested interactive) | 5–16 | None |
| 22 | S3 | Seven ambiguous items need a content decision | 1–4, 10, 12, 16 | None |
| 23 | S3 | Video gaps and apparent mismatches: Unit 10 has none; 8.3 and 8.4 look swapped; 13.1 and 15.4 off-topic | 8, 10, 13, 15, 16 | None |
| 24 | S3 | Graph drawings: parabolas as straight segments, uneven y-axis labels, growth curves that flatten | 7, 12, 15, 16 | None |
| 25 | S4 | Packet images: generic alt only; video links open new tabs unannounced; no `<header>` landmark; empty table headers; JS smooth-scroll ignores reduced motion | Various | None |

Refuted or narrowed from the teacher's own audit (details in §R):
- **Notes modal (refuted at runtime).** It has `role="dialog"`, `aria-modal` and an accessible name.
- **`<h1>` count (narrowed).** There is exactly one `<h1>`, but only after JavaScript runs, and it is the only heading on the page.
- **Calculator distance (narrowed).** It is 1,172 px below the first problem, not about 1,900 px. It is still below the whole problem list.

---

## Details

### 1. Seventeen wrong answer keys — S1

Evidence: `audit/CONTENT-VERIFICATION.md` § "Every failing item" (file:line links, site key, independent answer,
method); `audit/raw/verification.json`. Independent solver: SymPy over the problem text, sharing no code with the
site (`tools/verify/`). Picture items were read back from the SVG source (`tools/verify/svgread.py`).

| Location | Problem | Site key | Correct |
|---|---|---|---|
| [unit6.html:486](../unit6.html#L486) | 4(x + 1) ≥ 4x + 3 | no solution | all real numbers |
| [unit6.html:524](../unit6.html#L524) (test) | 4(2x − 1) ≥ 3(x + 4) | `x >= ≈ 1.6` | x ≥ 16/5 |
| [unit7.html:477](../unit7.html#L477) | "Use the graph to find f(2)", f(x) = x + 1 | f(2) = 3 | the graph is drawn as y = 0.5x + 1 with the point at (2, 2); formula and picture disagree |
| [unit7.html:510](../unit7.html#L510) (test) | same, f(x) = x − 1, find f(3) | f(3) = 2 | graph drawn as y = 0.5x, point at (3, 1.5) |
| [unit9.html:420](../unit9.html#L420) | Is (1, 1) a solution of y = 2x − 1, x + y = 3? | yes | no (1 + 1 ≠ 3) |
| [unit9.html:425](../unit9.html#L425) | Is (2, 3) a solution of y = x + 2, 3x − y = 3? | yes | no |
| [unit9.html:484](../unit9.html#L484) (test) | Is (2, 5) a solution of y = 2x + 1, x + y = 8? | yes | no |
| [unit9.html:461](../unit9.html#L461) | 2x + y = 8 and y = 6 − 2x | infinite solutions | no solution (6 = 8) |
| [unit9.html:470](../unit9.html#L470) | 4x − y = 6 and −4x + 3y = 2 | (2, 2) | (5/2, 4) |
| [unit9.html:500](../unit9.html#L500) (test) | 4x + 3y = 18 and −4x + y = 2 | `(1, 2) — wait: add: 4y=20 → y=5, 4x+15=18 → x=3/4` | (3/4, 5) — the key text cannot be typed |
| [unit10.html:466](../unit10.html#L466) | isosceles: 2(2x − 1) + (x + 4) = 31 | 6 | 29/5; the hint says "let's fix the problem to perimeter=32" |
| [unit10.html:520](../unit10.html#L520) | 5 jeans ($42) and shirts ($12) for $126 | 2 jeans, 3 shirts ($120) | no whole-number answer; the problem needs new numbers |
| [unit10.html:569](../unit10.html#L569) (test) | 8 lb of $4 and $6 coffee for $44 | 4 lb of each ($40) | 2 lb of A, 6 lb of B |
| [unit12.html:462](../unit12.html#L462) | 50 bacteria, +30%/h, 4 h | 175 | 143 (the hint itself says ≈ 143) |
| [unit12.html:464](../unit12.html#L464) | 80,000 people, −2%/yr, 5 yr | 72379 | 72314 (the hint says 72314) |
| [unit15.html:509](../unit15.html#L509) (test) | "Read the vertex from the graph" | (1, −3) | the dot is drawn at y = −2 |
| [unit15.html:513](../unit15.html#L513) (test) | "Read the vertex from the graph" | (−1, −4) | the parabola is drawn as y = x² − 4, vertex (0, −4) |

Other checks: no item has a special-case type (no solution / all reals / one solution) that contradicts its
topic label; no 5-problem set or assembled test can contain the same problem twice (10,000 seeded draws per
unit, 0 duplicates). Two test items repeat a practice item verbatim (unit10 `T[23]`, unit11 `T[10]`).

**Fix.** Correct each key. For the four picture items and the jeans problem the right fix is a content decision
(redraw the graph, or change the formula; change the prices). I will list those for you rather than choose.
Each fix gets a regression case in the verifier. **Risk:** keys are not stored in progress, so none.

### 2. Exponent answers graded backwards — S1

`clean()` strips HTML tags from the key before comparing ([algebra1.js:42](../assets/algebra1.js#L42)), so the
key `x<sup>2</sup> + 8x + 15` becomes `x2+8x+15`. A student who types the right answer `x^2 + 8x + 15` is told
"Not quite"; one who types `x2 + 8x + 15` is told "Correct!".

- Reproduced through the real practice UI on Unit 13, topic 13.4: five of five correct answers typed with `^`
  were rejected, and `4x2 - 9` was accepted (`audit/raw/repro.json` → `unit13`;
  `audit/raw/shots/repro-unit13-correct-marked-wrong.png`).
- Measured across the whole site by typing every key back in normal notation (`node tests/run-key-roundtrip.mjs`):
  **81 of 1,140 items reject their own key** — Unit 13: 57 of 80, Unit 12: 17 (every "write the equation" item),
  Units 1–4: 7 (`audit/raw/key-roundtrip.json`).

**Fix.** In `clean()`, turn `<sup>…</sup>` into `^(…)` before stripping tags (one line). Corpus cases already
cover it (#217–#235, #266–#272). **Ground-rule tension:** case #210 (`x5` for x⁵) is accepted today, and
it is wrong. The rules allow changing a baseline that a finding shows was wrong. Because students may have learned
to type `x2`, the safe default is to keep accepting a digit directly after a variable as an exponent while also
accepting `^`. That is your call (see **Decisions for you**). **Risk:** none to stored progress.

### 3. Maths is not accessible to screen readers — S1

Fractions are two stacked `<span>`s and exponents are bare `<sup>`. There is no MathML, `role="math"` or
`aria-label` anywhere (`grep -c "<math\|role=\"math\"\|aria-label" unit*.html` → 0 in content). Chrome's computed
accessibility tree, which NVDA and VoiceOver consume (`node tools/probe-math-a11y.mjs` →
`audit/raw/math-a11y.json`):

| Source | What assistive tech receives |
|---|---|
| (7/3)x = 14 | "7 3 x = 14" |
| 1/3 + 1/4 | "1 3 + 1 4" |
| x^9 / x^3 | "x 9 x 3" |
| 4x<sup>3</sup> − 2x + 7 | "4x 3 − 2x + 7" |
| y = (1/2)(x − 4)^2 − 3 | "y = 1 2 (x − 4) 2 − 3" |
| −5x + 10 ≥ −2x − 5, \|x\|, √3 | passed through as Unicode; whether they are spoken depends on the reader's symbol settings — **unverified** |

The same flattening affects the notes (`node tools/probe-notes-ax.mjs`: "x 4 + 3 = 8" for x/4 + 3 = 8).

**Options.**
- **(a) MathML with a plain-text fallback.** This is native in Chrome 109+ and Safari. VoiceOver reads it.
  NVDA reads MathML only with the MathCAT or MathPlayer add-on, which school machines will not have.
  ChromeVox support is partial.
- **(b) Keep the visual markup, mark it `aria-hidden="true"`, and add a visually hidden spoken form** next to it,
  for example "7 over 3 x equals 14" or "x to the 9th power over x to the 3rd power". It is generated by the same
  `formatEq` pass that builds the visual.
- **(c) `role="math"` plus `aria-label`.** Support for naming a `math` role is uneven. Some readers announce
  "math" and stop; copy/paste gives the visual text.

**Recommendation: (b), with (a) as a later enhancement.** (b) works the same in NVDA, JAWS, VoiceOver, TalkBack and
ChromeVox with no add-ons, needs no dependency, is generated (so no math content is hand-authored), and can be
checked by a test that reads the accessibility tree. **Risk:** none.

### 4. Ten Unit 13 problems display the wrong problem — S1

The authoring left a parenthesis inside `<sup>`: `5x<sup>2(x</sup> - 3)` displays as 5x raised to "2(x", minus 3,
instead of 5x²(x − 3). Affected: unit13 `BANKS['13.3']` items 3, 5, 7, 9, 12, 13; `BANKS['13.2'][12]`; test
`T[12]`, `T[13]`; plus three explanations (`CONTENT-VERIFICATION.md` § Other flags, `MARKUP`). Keys match the
intended problems. **Fix:** correct the markup. **Risk:** none.

### 5. Explanations contradict keys and show drafting — S1

The explanation is shown after a wrong answer, so a student who answers correctly is shown a contradiction:
- unit9 `BANKS['9.1'][7]`: key "yes", hint "Not a solution."
- unit12 `BANKS['12.3'][10]`: key 175, hint "≈ 143".

Six explanations contain scratch work, for example "Let me recalc", "Hmm: let s=short…", and "Use x=6 for integer:
let's fix the problem to perimeter=32" (`CONTENT-VERIFICATION.md` § hint table; flag `HINT-WORKING`). One
explanation has wrong arithmetic: unit10 `T[31]`, "−2x = −8". **Fix:** rewrite those explanations; the verifier
gains a check that fails the build on drafting words. **Risk:** none.

### 6. Checker fairness — S2

`tests/checker-corpus.json` has 318 realistic inputs, each with the verdict a student deserves. The current
behaviour is recorded in `tests/checker-baseline.json` (`node tests/run-checker-corpus.mjs`). Every unit page
grades with the shared `isMatch` (verified on all 13 pages). Result: **215 fair, 92 correct answers rejected,
3 wrong answers accepted, 8 unjudged.** The largest groups of correct answers rejected:

- **Units and labels on word problems:** "4 hours", "60 mph", "$230", "30°, 60°, 90°", "5 lbs each", "6 by 11"
  written as "6, 11".
- **Commas and dollar signs:** "4,000" or "$4000" for `$4,000`; "14,580" for `14580`.
- **Count words and numbers:** "2", "two" or "0" for "two solutions" / "no real solutions" (the item's own format
  line offers "0, 1, or 2"); "no real solution" vs "no real solutions".
- **Plus-minus and roots:** "±5", "2±√3", "2+sqrt(3), 2-sqrt(3)", and decimals for an item whose format says
  "exact or decimal form".
- **Mixed numbers and fraction forms:** "1 1/2" for 3/2; ".5" and "-.5"; "(3/2)".
- **Lines and multi-part answers:** "y = 0.5x + 1", "y = 1/2x + 1" or "y = x/2 + 1" for `y = (1/2)x + 1`;
  "m = 3, b = 5" or "3, 5" for "slope = 3, y-intercept = 5"; "3" for "f(2) = 3".
- **Order:** "x < -2 or x > 4" (order of the two parts); "{2, 4, -1}" (set order); "-2x^2+10x" (term order).
- **Synonyms:** "max", "min", "open circle", "nonlinear", "x axis".

The 3 wrong answers accepted:
- "x > 4 and x < -2" for "x > 4 or x < -2". `and` and `or` are both folded to a comma
  ([algebra1.js:67](../assets/algebra1.js#L67)), and the "and" version is the empty set.
- "x5" for x⁵ (finding #2).
- "y = 5" for "x = 5". `varStripEq` drops the variable name ([algebra1.js:313](../assets/algebra1.js#L313)).

**Fix (Phase 1 step 3).** Add only lenient rules, plus the three wrong-accept fixes, each with corpus entries, and
prove with `--check` that no answer accepted in the baseline is now rejected, apart from the three above.
**Risk:** none to storage. Grades change only in the student's favour, except for the three.

### 7. Duplicate vocabulary option — S2

unit1-4 `VQB[20]` "Evaluate 4x − 2 when x = 3" has options `['10','14','10','2']`, `a: 0`. A student who taps the
second "10" is marked wrong (`python tools/verify/verify_items.py` → `VOCAB`). **Fix:** replace the duplicate.
**Risk:** none.

### 8. Practice Test lost on refresh — S2

Unit 8 test: typed 3 answers, reloaded. The view returned to Notes, all inputs were empty, and 1 of 25 questions
was in the same position (`audit/raw/repro.json` → `testLostOnRefresh`). Cause: `tset` and input values live only
in memory ([SOURCE-MAP.md](SOURCE-MAP.md) § set assembly). **Fix:** autosave the drawn question IDs and the typed
values under a new key `alg1.test.v1.<unit>`, restore them on load, and clear them on submit. **Risk:** additive.
`alg1.progress.v1` is not touched.

### 9. Blank submit — S2

Unit 6: 5 answered, 20 blank, Submit. No native dialog, no in-page warning, score 5/25, and blank cards marked
"✗ Answer: …" (`repro.json` → `blankSubmit`). After grading, keyboard focus is on `<body>`
(`audit/raw/a11y-behaviour.json` → `keyboard.focusAfterSubmit`), so a screen-reader user hears nothing.
**Fix:** an in-page warning naming the blank questions, "Skipped" state on blank cards, and focus moved to the
score. **Risk:** none.

### 10. Unconfirmed Reset — S2

The unit-page "Reset" button deletes that unit's record immediately ([algebra1.js:1012](../assets/algebra1.js#L1012)).
At 390 px it is 55×18 px and sits under the "Next step" button (`a11y-domwalk.json`). This is the single
biggest current threat to saved progress. **Fix:** an in-page confirmation, and a target of at least 44 px.
**Risk:** reduces risk.

### 11. Contrast — S2

axe-core, 4 pages × 8 views × 2 viewports (`audit/raw/axe/`). An own-ratio DOM walk (`a11y-domwalk.json`)
confirms the classes from your audit and finds more:

| Element | Ratio | Where |
|---|---|---|
| `.ptag` | 3.54:1 (11 px) | practice/test cards |
| `.afmt` | 3.48:1 (11 px) | "Answer format" line |
| `.calc-title` | 3.48:1 (10 px) | calculator |
| `.a1-step-n` | 3.28:1 / 2.95:1 (10 px) | tab step numbers |
| `.a1-streak-hint` | 2.66:1 (axe) | streak pill |
| `.u-state.new` | 2.47:1 (9 px) | index "Not started" |
| `.u-meta`, `.vsec`, `.vex-lbl`, section labels | 3.06–3.48:1 | index, vocabulary |
| `.u-arrow` | 1.89:1 | index card arrow (decorative, `aria-hidden`) |
| unit-nav separators | 1.85:1 | header |

**Fix:** one shared grey that passes. `#6b6b80` gives 5.20:1 on white, 4.77:1 on `#f5f5f7` and 4.57:1 on
`#f0f0f2`, but only 4.19:1 on the tab-number chip `#e6e6ef`, which needs a darker text or lighter chip. **Risk:**
none.

### 12. Index percentage formula — S2

The unit page uses `0.15·notes/topics + 0.35·strong/topics + 0.35·test + 0.15·vocab`. The index uses the topics
*attempted* as the denominator and counts notes as complete after any 4
([algebra1.js:1405](../assets/algebra1.js#L1405)). Measured: one Unit 10 topic at 100% shows 5% on the unit page
and 35% ("1/1 topics strong") on the index (`node tools/probe-progress.mjs`). **Fix:** give the index each unit's
topic count (static list in `index.html`) and reuse one function. **Risk:** display only. Stored data is
unchanged and reads the same.

### 13. Practice cannot show what the notes warn about — S2

`tools/learning_review.py` → `audit/raw/learning.json`. For each "warn" callout, it counts the bank items that
exercise the error and the probability that a random 5-of-15 set has none:

| Topic | Notes warn about | Items in bank | P(set shows none) |
|---|---|---:|---:|
| 5.1 | the invisible −1 in −x | 0 | **100%** |
| 5.2 | sign errors in a numerator like (6 − 3x)/5 | 0 | **100%** |
| 5.3 | negative sign before parentheses | 2 | 43% |
| 10.1 | "less than" reverses order | 2 | 43% |
| 11.1 | (−a)⁰ vs −a⁰ | 2 | 43% |
| 16.2 | never divide by x | 2 | 43% |
| 9.2 | parallel lines / no solution | 3 | 26% |
| 14.3 | negative leading coefficient | 3 | 26% |
| 6.2 | flip when dividing by a negative | 4 | 15% |
| 9.4 | multiply before eliminating | 4 | 15% |
| 13.2, 11.3, 15.4, 16.1 | (various) | 7–13 | ≤ 2% |

Practice sets are a random 5 of 15 with no easy-to-hard order ([unit5.html:654](../unit5.html#L654)). Every topic's
notes have at least one worked example (66 of 66). **This is a content decision;** I will not write new problems.
**Risk:** none.

### 14. Mobile layout shift — S2 (performance)

Lighthouse mobile (`audit/raw/lighthouse/summary.json`):

| Page | Perf | LCP | TBT | CLS |
|---|---:|---:|---:|---:|
| index | 91 | 1.36 s | 0 | 0.197 |
| unit1-4 | 85 | 2.43 s | 0 | **0.253** |
| unit5 | 87 | 1.82 s | 0 | **0.253** |
| unit15 | 85 | 1.98 s | 0 | **0.270** |

Shift sources (`node tools/probe-cls.mjs`): the course hero and "Not started" chips inserted into the index grid,
and the unit progress hero inserted above the tabs, both after first paint. Weight is not the problem: the
unit pages gzip to 21–26 KB on the live site (`curl` with `Accept-Encoding: gzip`; Lighthouse ran against an
uncompressed local server, so its byte counts are pessimistic). There is one long task per page (52–126 ms).
**Fix (Phase 1 step 8):** reserve the hero's space in the static HTML. **Risk:** none.

### 15–19. Usability bugs from your audit — S3 (all reproduced, `audit/raw/repro.json`)

- **15 Deep links.** Opening `unit8.html#test`, `#practice` or `#v-test` in a fresh tab shows Notes. Clicking a
  tab never changes the URL. No code reads `location.hash` (grep, 0 matches).
- **16 Results.** In Unit 6 the rows came out 6.1, 6.2, 6.4, 6.5, 6.3 — neither topic order nor score order — and
  no row has a link.
- **17 Calculator at 390×844.** The calculator is 1,172 px below the first problem and 26 px after the last.
  Cause: [unit5.html:212](../unit5.html#L212) collapses the grid to one column below 600 px (`.pt-calc-col` follows
  the list). Screenshot: `raw/shots/repro-practice-390-fullpage.png`.
- **18 Streak pill.** It is 26×10 px with its only child hidden at ≤ 600 px
  ([algebra1.css:215](../assets/algebra1.css#L215)), which leaves an empty dashed outline
  (`raw/shots/repro-streak-pill-390.png`).
- **19 Clear all.** The button is inside `<h2>`, so the heading reads "Semester 2 Clear all saved progress"
  ([index.html:117](../index.html#L117)). Clicking it raises a native `confirm` ("Clear saved progress for every
  unit on this device?").

### 20. Small text and targets — S3

Text below 12 px appears on about 60 element classes (`a11y-domwalk.json`), including the answer-format line,
the topic tags, Check/Hint buttons, results labels and fractions in notes (9.9–11.25 px).

At 390 px, almost every control is under 44 px tall: tabs are 40, Check 38, Hint 38, notes Close 30, video
buttons 28, unit-nav links 28×40, and "Practice this" 24. Two controls are under the WCAG 2.2 AA minimum of
24 px: unit Reset (55×18) and Clear all (181×21).

### 21. Nested interactive — S3

The topic cards get `role="button"` ([algebra1.js:1059](../assets/algebra1.js#L1059)) and then a "Practice this"
`<button>` inside them (axe `nested-interactive`, serious, on 5–16). Lighthouse `label-content-name-mismatch`:
card names drop the visible tag and arrow.

### 22. Ambiguous items — S3 (content decisions, listed not resolved)

`CONTENT-VERIFICATION.md` § Ambiguous:
- Constant of 5x − 7: 7 or −7.
- Cable "after how many months": 10 or 11.
- Plane "with a tailwind": ground speed or airspeed.
- 33.3 / 16.7 mL rounding and units.
- "losing r%" with A0(1 − r)^t.
- Two "how many x-intercepts / solutions" formats that contradict their keys.

### 23. Videos — S3

`node tools/check-videos.mjs` → `audit/raw/videos.json`. All 66 links are live (HTTP 200).

- **Unit 10:** no video for any of its 7 topics.
- **Topics with no video in other units:** 8.5, 15.2, 15.3, 15.5, 16.2, 16.4. Units 15 and 16 have two topics with
  video each, as you reported.
- **8.3 and 8.4 look swapped by title.** 8.3 "Writing Equations of Lines" links "Horizontal & Vertical Lines
  (Behling 8.3)". 8.4 "Standard Form & Special Lines" links "Writing Linear Functions / Writing Equations of Lines
  Part 2–3".
- **13.1** "Introduction to Polynomials" links "7.0 Add/Subtract/Multiply/Divide Terms".
- **15.4** links a college lecture ("Intermediate Algebra Lecture 11.5", Professor Leonard). Its length is
  **unverified**, because oEmbed gives no duration.
- **Unit 5 vocabulary:** topic 5.2 has no questions at all, which is why there is no 5.2 filter.

I will not add or change video links.

### 24. Graph drawing accuracy — S3

Beyond the four graphs that change the answer (#1):
- Parabolas are drawn as 5–7 straight segments (`polyline`).
- Several y-axes have labels with uneven spacing (unit15 `T[6]`: −1, −2, −3 at 124/136/148 px, but 20 px for the
  first unit).
- Three exponential growth curves bend back to concave-down at the top (`raw/svgs/unit12.png`).

These are not wrong answers, but they teach a wrong picture.

### 25. Polish — S4

- **Packet images.** The two unit1-4 images have no `alt` in the source ([unit1-4.html:427](../unit1-4.html#L427),
  [463](../unit1-4.html#L463)). At runtime they get the generic "Diagram from the course packet", which describes
  nothing.
- **Video links.** They open a new tab with no warning (`target="_blank"`,
  [unit5.html:787](../unit5.html#L787)).
- **Header.** Not in a landmark (axe `region`).
- **Undo table (unit5).** Empty `<th>` cells.
- **Smooth scrolling.** `scrollIntoView({behavior:'smooth'})` in every unit's grading functions is not covered by
  the CSS reduced-motion rule ([algebra1.css:640](../assets/algebra1.css#L640) covers CSS only).

### §R. Checked and found working

- **Notes modal.** In the rendered DOM it has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
  and the name "Solving Basic Equations". Focus moves to Close, Tab is trapped (40 presses), and Escape closes and
  returns focus to the card (`repro.json` → `notesModal`; `a11y-behaviour.json` → `keyboard`). The static HTML has
  none of this; it depends on `algebra1.js` running.
- **One `<h1>`.** Each page has exactly one `<h1>` in the rendered DOM (the unit hero) and zero in the static
  source, and there are no other headings on unit pages. The real issue is missing section headings, not too
  many `<h1>`s.
- **Reflow (WCAG 1.4.10).** No horizontal scroll at 320 and 640 CSS px on index and unit5 (notes, modal,
  practice, test) or unit15 practice (`a11y-behaviour.json` → `reflow`).
- **Reduced motion.** A CSS reduced-motion block exists and stops CSS animation; confetti is skipped in JS when
  reduced motion is set.
- **Forced colours.** The selected tab and the selected quiz option stay distinguishable; correctness is also
  stated in text (`raw/shots/forced-colors-*.png`).
- **Keyboard.** The skip link works, arrow keys move between tabs, Enter on a card opens the notes, Enter in a
  practice box checks it, and the calculator accepts typed `7*6⏎` = 42.

---

## Needs a human

I could not verify these myself; each has a script in `HUMAN-CHECKS.md`.
1. What NVDA, VoiceOver, TalkBack and ChromeVox actually *say*. I measured Chrome's accessibility tree, which is
   the input to those readers, not their speech, and in particular not how they voice ≥, |x| and √.
2. Behaviour on a real school-managed Chromebook, iPhone and Android phone: the on-screen keyboard's minus sign,
   access to `^`, autocapitalisation, and storage behaviour under managed policies.
3. A blind hand-solve of 50 random items (`audit/human/blind-review-sheet.md`; keys in `blind-review-KEY.md`), as
   an independent check on the verifier itself.
4. A classroom pilot including students who use accommodations.
5. The proposed standards alignment (`audit/human/standards-alignment-PROPOSED.md`).
6. Reading level. Flesch–Kincaid on the notes' prose gives unit medians from 6.0 (Unit 5) to 14.8 (Unit 13)
   (`raw/learning.json`), but samples are 40–310 words per topic and maths-heavy. Treat these as a flag for
   Units 9, 13 and 16, not a measurement.
7. Whether the 8.3/8.4, 13.1 and 15.4 videos are on-topic (titles suggest not), and video lengths.

## Decisions for you

- **Keys you must choose:** the four picture items (redraw or change the formula), the jeans problem (new
  prices), and the isosceles problem (perimeter 32, or a non-integer answer).
- **Ambiguous items in #22:** pick the intended answer for each.
- **Accepting `x2` for x²:** keep it (recommended, so no student who learned it is suddenly marked wrong) or
  reject it.
- **Lenient checker scope:** whether units ("4 hours"), number words ("two") and rounded decimals for exact
  roots should be accepted. My recommendation is yes for units and number words. For rounded decimals, only where
  the item's own format line invites them.
- **Writing new problems:** whether I should draft extra problems for 5.1 and 5.2 so their warnings appear in
  practice, which you would then approve.

---

## Phase 1 plan (for approval)

Each step is its own commit group on `a1-evidence-pass`. A PR opens against `main`, and `main` is never pushed.

1. **Safety net first.**
   - `tests/run-all.mjs` runs the item verifier, the checker corpus with `--check` against the baseline, the key
     round-trip, and an axe pass over every unit page and view.
   - `.github/workflows/tests.yml` runs the same on every PR (Ubuntu runner with Chrome, Node, and Python with
     SymPy).
   - On the base commit it passes except for the findings above, which are recorded as expected failures, so a
     fix flips them to passing.
2. **Maths correctness.**
   - Fix the keys in #1 that have one right answer (12 items).
   - Fix markup (#4), explanations (#5) and the duplicate option (#7).
   - Add a regression case per fix.
   - List the content decisions instead of choosing.
3. **Checker.**
   - The `<sup>` fix (#2), lenient rules for confirmed corpus failures, and the three wrong-accepts (#6).
   - Proof: `node tests/run-checker-corpus.mjs --check` shows 0 regressions except the three documented
     wrong-accepts.
4. **Maths accessibility.** Option (b) from #3 across all 13 pages via the shared `formatEq`/notes renderer.
   - A test asserts that the accessibility tree reads "7 over 3 x equals 14" for the sample set.
5. **Student-experience bugs:**
   - Test autosave and restore (stable set, cleared on submit, new key `alg1.test.v1.<unit>`).
   - Hash deep links (`#notes|vocab|practice|test`, plus `#practice/5.2`).
   - Blank warning and "Skipped" state.
   - Results sorted weakest first, with links to notes and practice.
   - Calculator as a bottom sheet with 44 px keys below 600 px.
   - Streak pill text visible on phones.
   - Clear-all moved out of the `<h2>`, with an in-page confirmation; confirmation on unit Reset (#10).
   - One index/unit scoring function (#12).
6. **Accessibility fixes:**
   - Section headings.
   - Contrast to ≥ 4.5:1.
   - Labels ≥ 12 px.
   - 44 px targets.
   - Card/button nesting.
   - Descriptive alt text (written from the image, for your approval).
   - "(opens in new tab)" on video links.
   - Header landmark.
   - Reduced-motion smooth scroll.
7. **Local learning data.**
   - An `alg1.attempts.v1` log, capped at 2,000 entries, holding item id, correct, tries, hint used and time on
     item. No identifiers.
   - "Export my data", plus a note that says what is stored and that it never leaves the device.
   - `tools/item-analysis.mjs`.
8. **Performance.** Only the layout-shift fix (#14), with before/after Lighthouse.

Verification for Phase 1 goes in `audit/after/`:
- re-runs of every raw output;
- old-shape `alg1.progress.v1` seeded and shown to load intact;
- screenshots at 360×740, 390×844 and 1280×800;
- a key/explanation diff beside the solver output.

**Deferred to `BACKLOG.md` (not built):** dark mode, service worker/manifest, social preview tags, progress import,
MathML, redrawing every graph from its formula, new practice problems, the 945 KB packet JPEG
(`Packetsite/unit6-img-025.jpeg`).

## Where the brief and the ground rules pull apart

- **The CI workflow must live in `.github/workflows/`, not `tools/` or `tests/`.** It is configuration that GitHub
  reads, not a runtime dependency of the site, so it does not break "no build step or runtime dependency". All the
  code it runs stays under `tools/` and `tests/`.
- **"No previously accepted answer may become rejected" vs the three wrong answers accepted today.** The rule's
  own exception ("except where a finding says a baseline answer was wrong") covers them. They are listed in #6, and
  `x2` is left for you to decide.
- **"At least 10,000 seeded draws per generator."** The site has no generators: every item is static. I applied
  the 10,000 draws to set assembly instead (practice sets and tests), and checked every static item once.
