# Algebra 1 — Niles North High School, D219

A static study site for Algebra 1. Every unit has notes, vocabulary cards, a
vocabulary quiz, topic practice with hints, and a practice test that reports a
per-topic breakdown.

**Live:** https://consultgranato.github.io/algebra1/

No build step or runtime package dependencies. Opening the graphing calculator
loads Desmos; video links open YouTube.

## Layout

```
index.html            Unit picker, with saved progress on each card
unit1-4.html          "Getting the Rust Off" — 13 topics, practice grouped by unit
unit5.html … unit16.html   One self-contained page per unit
assets/
  algebra1.js         Shared behaviour, loaded last on every page
  algebra1.css        Shared styles, loaded last in every <head>
  vikings-v.jpg       Header logo
Packetsite/           Packet images referenced from the notes modals
extracted-images/     Full image dump from the source packets (not served)
docs/                 Notes gap reports from the content review
scripts/legacy/       One-off Python patch scripts, already applied
```

### Each unit page owns its content

A unit page holds its own notes HTML, vocabulary cards, quiz bank, practice
banks and practice test inside a single inline `<script>`:

| Name | What it is |
| --- | --- |
| `UNIT` | `{id, name, topics[]}` — drives the progress key and topic list |
| `TOPICS` | Notes modal content, one entry per topic, plus video links |
| `BANKS` | `{ '11.1': [ {q, eq, a, fmt, h}, … ] }` — 15 problems per topic |
| `T` | Practice test, 5 questions per topic, each tagged with `t` |
| `VQB` | Vocabulary quiz — multiple choice, true/false, matching |
| `DESCS` | One-line description per topic, shown under the topic picker |

To add a problem, append to the relevant `BANKS` array. Answers go in `a` as
plain text — `x^12`, `1/x^4`, `(x+2)(x+3)`, `x=5 or x=-2`. Keep grading answers as plain math, never display HTML. Use item-level
`answerForm` and `absoluteTolerance` only when the prompt requires them.

### `assets/algebra1.js` owns the shared behaviour

It loads **after** each page's inline script, so its definitions win. That is
deliberate: the 13 unit pages had drifted into several different copies of the
same plumbing, and this is what stops them drifting again. It provides:

- **Answer matching** (`assets/math-engine.js`) parses a bounded algebra subset without
  evaluating student input as JavaScript. Polynomial identities use exact rational
  coefficients. Logical AND and OR, variable names, and ordered pairs stay distinct.
  Item metadata can require factored, expanded, or reduced form. Decimal tolerance
  is opt-in and printed in the question's answer instructions.
- **Progress**, saved to `localStorage` under `alg1.progress.v1`, keyed by unit
  id. Records notes read, best and last practice score per topic, and best
  practice-test and vocabulary-quiz scores.
- **Accessibility** — ARIA tablist with arrow-key navigation, dialog semantics
  and a focus trap on the notes and calculator modals, live regions on feedback
  and score panels, labelled inputs, a skip link.
- Keyboard entry on the built-in calculator, lazy loading of the Desmos iframe,
  and an unbiased shuffle.

Because it is shared, a fix here lands on all 14 pages at once.

## Local preview

Progress uses `localStorage`, which Chrome disables for `file://` URLs, so serve
the folder over HTTP to exercise it:

```sh
cd algebra1 && python3 -m http.server 8777
# then open http://localhost:8777
```

Everything else works fine opened directly from disk.

## Deploying

GitHub Pages serves `main` from the repository root, so pushing to `main`
deploys. `.nojekyll` is present so Pages serves the files as-is.

```sh
git add -A && git commit -m "…" && git push
```

## Assessment validity and repeatable verification

Run `node --test tests/*.test.cjs` for parser counterexamples, all 1,140 answer-key
round trips, content-notation checks, progress denominators, and legacy-score
preservation. A key round trip only checks input compatibility, not mathematics.

Install `sympy==1.14.0`, then run `python scripts/verify-math.py`. This separate
oracle solves 371 supported question/answer pairs from the raw banks and feeds
371 independently generated correct answers plus 371 incorrect variants into
the browser's actual grading engine. It reports unsupported questions separately;
the remaining 769 prose, graph, or unsupported items are not mathematically
certified by this check. Original packet PDFs are absent, so packet alignment
requires those sources and a teacher review.

GitHub Actions runs these checks and the browser regressions on every push and
pull request. `tests/browser-regressions.mjs` tests rendered student controls;
`scripts/browser-ci.mjs` runs it with Playwright. Local browser CI requires
`playwright@1.64.1` and its Chromium installation. The browser regressions cover
correct and incorrect inequalities, exponential input, solution wording,
keyboard navigation, hint use, and agreement between course and unit progress.

Practice distinguishes first attempts without hints from final success after
hints/retries. Progress is a study guide, not a validated grade or a diagnostic
of mastery. Notes are recorded as opened, not as evidence of understanding.
Scores produced before grading version 2 are preserved in `earlierScores` within
the same local-storage record and excluded from new progress calculations.

The earlier audit's graph preloading and graph-description findings are outside
this focused mathematical-grading change and still need separate work. The
supported expression parser is deliberately bounded; unsupported syntax is
rejected rather than guessed correct. No feature claims universal symbolic
algebra equivalence.
