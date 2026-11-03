# Learning experience review — November 2, 2026

## Professional standard

A professional educational-product review follows a student's full learning loop:
read a mathematically sound explanation, interpret an accurate representation,
try the skill, receive valid feedback, and use progress without mistaking it for
a grade. Visual polish alone cannot establish that loop.

Start from raw question stems, equations, keyed answers, worked calculations,
SVG coordinates, event handlers, saved records, and original course packets.
This review inspected 1,140 practice/test entries, 243 vocabulary questions,
66 note topics, and 49 assessment graph models. Six original DOCX note packets
were read as extracted text for targeted alignment; embedded objects and images
were not fully available in that extraction. The scanned foundations PDF was
not visually certified. Complete packet fidelity is therefore an open limit.

Methods include manual mathematical recalculation, an independent SymPy solver,
exact rational parsing, equation-driven SVG rendering, structured response types,
keyboard interaction tests, and rendered desktop/mobile checks. GitHub Actions
runs repeatable tests independently of this chat. Actual classroom learning gains
would require student observation and assessment evidence; they are not claimed.

## Delivered changes

- Shared purple, teal, and paper visual system across the home page and all units;
  responsive cards, clearer spacing, readable examples and note navigation.
- Rebuilt 49 assessment graphs and 34 note figures from mathematical definitions,
  with equal coordinate units where appropriate, labeled physical scales where
  units differ, correct number-line endpoints, dashed strict boundaries,
  asymptotes, and descriptions/coordinate tables.
- A native graph workspace on every page: presets, multiple relations, zoom,
  coordinate tracing, readable input errors, keyboard focus management, and no
  external calculator account. Shaded inequalities require x or y isolated on
  the left; implicit equations such as circles are supported.
- An interactive a/h/k quadratic explorer; factored-form and conversion examples;
  coefficient interpretation; special-system outcomes; source numbering crosswalks;
  reflection prompts; and targeted practice replacing redundant items.
- All 34 records in `content-review.json` applied, including incorrect system
  solutions, impossible/degenerate word problems, exponential arithmetic,
  ambiguous requests, and rate/rounding wording. Foundations wording and broken
  exponent entities were also repaired.
- Labeled multipart fields and explicit contracts for sets, function outputs,
  money, dimensions, intercepts, counts, and formulas. Expansion and simplified
  exponent tasks enforce the requested form. A0/A₀ represents one initial-amount
  symbol, preventing a zero-product false positive.
- Removed the 13 stale inline answer-matcher implementations and legacy external
  calculator loaders. Shared modules own the corrected behavior. Version 3
  preserves older score archives without reusing them as current evidence.

## Evidence and limits

83 Node tests pass, including all canonical answer round trips and new negative
counterexamples. Round trips do not prove the keyed mathematics.

SymPy independently solves 451 of 1,140 assessment entries and checks 451 correct
answers and 451 wrong variants through the real grader. The other 689 entries
remain outside that automated oracle, although they were included in manual
content review. Graph verification independently checks 24 marked coordinates
and 343 curve samples across all 49 assessment graph specifications, plus six
high-impact calculations. Graph and solver coverage overlap.

The browser suite checks all 66 notes, diagrams, all unit sections, six graph
presets, tracing, invalid input, multipart submission, and containment at 1280px
and 390px. These checks establish the tested behavior, not universal accessibility
conformance or demonstrated classroom learning gains. Screen-reader observation
and student use remain the appropriate next external validation.
