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
  id. Records notes opened, best and last practice score per topic, and best
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

## Learning experience and verification

The course uses a shared visual system and note reader, equation-driven SVG graphs,
MathML assessment notation, labeled multipart inputs, and an on-site graph workspace.
It remains a static GitHub Pages site with no build step or graph service account.

Run `node --test tests/*.test.cjs` for parser counterexamples, all 1,140 answer-key
round trips, response contracts, graph invariants, progress, and score migration.
Round trips check compatibility; they do not prove answer-key correctness.

With SymPy 1.14.0 installed, run `python scripts/verify-math.py` to solve 451 raw
assessment entries independently and check 451 correct plus 451 incorrect inputs
against the actual grader. It reports the other 689 entries as unsupported.
Run `python scripts/verify-graphs.py` to independently check all 49 graph models,
24 marked coordinates, 343 curve samples, and six high-impact content calculations.
These coverage counts overlap; they must not be added as unique verified questions.

GitHub Actions runs these checks and Playwright regressions at desktop and mobile
widths. The design suite opens all 66 notes, checks diagrams and containment, exercises
six graph presets, traces values, handles invalid input, and submits multipart answers.
Local browser CI requires Playwright 1.64.1 and Chromium, then
`node scripts/browser-ci.mjs`.

See [the redesign review](docs/learning-experience-review.md) for scope and limits,
and [the correction ledger](docs/content-review.json) for the 34 reviewed corrections.
Six original course DOCX note packets informed the supplement/crosswalk work;
text extraction omits embedded equation objects and images, so complete visual
packet fidelity has not been certified. Private packet files are not in this repository.

Progress is study guidance, not a validated grade. Notes count as opened. First tries
without hints remain separate from eventual success. Grading version 3 archives
older assessment scores, retaining earlier archives, while preserving opened notes.
The mathematical parser is bounded and rejects unsupported syntax.
