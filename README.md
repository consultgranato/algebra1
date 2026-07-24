# Algebra 1 — Niles North High School, D219

A static study site for Algebra 1. Every unit has notes, vocabulary cards, a
vocabulary quiz, topic practice with hints, and a practice test that reports a
per-topic breakdown.

**Live:** https://consultgranato.github.io/algebra1/

No build step, no dependencies, no third-party requests at runtime.

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
plain text — `x^12`, `1/x^4`, `(x+2)(x+3)`, `x=5 or x=-2`. You do not need to
anticipate how a student will format it; see below.

### `assets/algebra1.js` owns the shared behaviour

It loads **after** each page's inline script, so its definitions win. That is
deliberate: the 13 unit pages had drifted into several different copies of the
same plumbing, and this is what stops them drifting again. It provides:

- **Answer matching** (`isMatch`) — accepts any equivalent form of a correct
  answer: `x^-4` for `1/x^4`, `3+2x` for `2x+3`, `(x+3)(x+2)` for `(x+2)(x+3)`,
  `0.5` for `1/2`, `x = 5` for `5`, `3<x` for `x>3`, unicode superscripts and
  minus signs, `NS` for "no solution". It still rejects genuinely wrong answers,
  and it rejects an unreduced fraction such as `2/4` for `1/2`, since
  simplifying is the point of several units.
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
