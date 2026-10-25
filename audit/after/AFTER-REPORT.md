# Phase 1 — what changed, and the evidence

Branch `a1-evidence-pass`, PR [consultgranato/algebra1#1](https://github.com/consultgranato/algebra1/pull/1). One command
re-checks everything below: `node tests/run-all.mjs` (also runs in GitHub Actions on every PR). Raw outputs from the
final run are in `audit/after/raw/`; the Phase 0 originals are untouched in `audit/raw/`.

## Before and after

| Measure | Phase 0 | Now | Evidence |
|---|---|---|---|
| Answer keys that disagree with the independent solver | 17 of 1,140 | **6**, all waiting on your decision (D1–D6) | `raw/verification.json`, `answer-key-changes.md` |
| Problems/explanations with broken `<sup>` markup | 51 items + 1 quiz question | **0** | same |
| Explanations with drafting ("wait", "Let me recalc") shown to students | 6 | **1** (the isosceles item, D6) | same |
| Items whose own key, typed normally (`x^2 + 8x + 15`), is marked wrong | 81 (57 of 80 in Unit 13) | **0** | `raw/key-roundtrip.json` |
| Checker corpus: fair answers rejected | 92 of 310 judged | **0** of 343 | `raw/checker-run.json` |
| Checker corpus: wrong answers accepted | 3 | **1** (`x5` for x⁵, D13) | same |
| Answers accepted at Phase 0 that are now rejected | — | **0**, apart from the two wrong-accepts the audit named | `tests/checker-baseline-exceptions.json` |
| Fraction `(7/3)x = 14` as read by assistive technology | "7 3 x = 14" | "7 over 3 x = 14" | `raw/math-a11y.json` |
| axe-core violations (14 pages × 9 views × 2 viewports) | 408 page/view/rule combinations | **0** | `raw/axe-run.json` |
| Lighthouse accessibility (index / unit1-4 / unit5 / unit15) | 95 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | `lighthouse/summary.json` |
| Mobile layout shift (index / unit1-4 / unit5 / unit15) | 0.197 / 0.253 / 0.253 / 0.27 | **0 / 0.003 / 0.003 / 0.017** | same |
| Mobile Lighthouse performance | 91 / 85 / 87 / 85 | 100 / 97 / 99 / 98 | same |
| Mobile LCP | 1.36 / 2.43 / 1.82 / 1.98 s | 1.58 / 2.57 / 2.12 / 2.26 s (**worse**, see below) | same |
| `algebra1.js` over the wire (gzip) | 17 KB | 29 KB | `gzip -c assets/algebra1.js \| wc -c` |
| Student-experience checks through the UI | — | 51 pass | `raw/ux-run.json` |

**The cost.** Doing the page additions before the first paint (to stop the jump) and the larger script add 140–300 ms
to mobile LCP. Unit 1–4 is now 2.57 s, just over Lighthouse's 2.5 s "good" line on a throttled mid-range phone. If
you would rather keep LCP under 2.5 s there, the next step is splitting the notes HTML out of that page (backlog).

## Saved progress is safe

`tests/run-ux.mjs` seeds `alg1.progress.v1` in the Phase 0 shape for three units, opens the unit pages and the
index, and checks that every original field is byte-for-byte unchanged and that the saved scores display
(`raw/progress-compat.json`). New data lives in new keys (`alg1.test.v1.<unit>`, `alg1.attempts.v1`) or in two
additive fields on a unit record (`pct`, `topics`), which older code ignores.

## What changed, by step (one commit group each)

1. **Safety net** — `tests/run-all.mjs` + `.github/workflows/tests.yml`; known failures recorded in `tests/expected/`.
2. **Maths** — 11 keys fixed (each pinned in `tests/content-regressions.json`), 55 broken superscripts repaired,
   drafting removed from explanations, duplicate quiz option removed. Diff with solver output:
   `answer-key-changes.md`.
3. **Checker** — exponents in keys, inequality tag bug, "and" vs "or", `y = 5` vs `x = 5`; a lenient second pass for
   units, `$`, commas, mixed numbers, `.5`, `±`, `sqrt`, counts, `m/b` labels, equivalent line and exponential forms,
   rearranged factored forms; 38 guard cases pin what must still be rejected.
4. **Maths for screen readers** — hidden spoken form for every fraction and exponent.
5. **Student experience** — test autosave/restore, deep links, blank warning and "Skipped", sorted results with
   links, phone calculator sheet, streak pill, in-page confirmations, one percentage on index and unit page.
6. **Accessibility** — contrast, 12 px text floor, 44 px targets, no nested buttons, section headings, landmarks,
   named dropdowns, new-tab labels, reduced-motion scrolling, alt text.
7. **Local learning data** — `alg1.attempts.v1`, "Export my data", `tools/item-analysis.mjs`
   (sample output: `raw/item-analysis-sample.md`).
8. **Performance** — reserved space for the injected progress blocks; script builds them before first paint.

## Screenshots (`screens/`)

At 360×740, 390×844 and 1280×800: `1-home`, `2-unit`, `3-notes-modal`, `4-practice`, `5-calculator-open` (phones),
`6-test-blank-warning`, `7-results`, `8-results-by-topic`. Regenerate with `node tools/after-screens.mjs`.

## Still open

- **Your decisions:** `DECISIONS.md` (D1–D21). Until you choose, D1–D6 stay listed as known failures.
- **Human checks:** `../HUMAN-CHECKS.md` — screen readers, real devices, the 50-item blind review, the pilot, and the
  proposed standards table. None of these is claimed as verified.
- **Deferred:** `../../BACKLOG.md`.
