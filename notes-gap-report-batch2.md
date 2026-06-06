# Notes Gap Report — Batch 2: Units 8–16

**Date:** 2026-06-06  
**Scope:** Compare Notes tab content in the app vs. source teaching packets for units 8–16  
**Dimensions:** (A) Teaching method — definitions, vocabulary, named techniques, worked examples, concept sequence  
**             ** (B) Visuals — diagrams, SVGs, number lines, graphs, models  
**Method:** Read packet .docx/.doc files via python-docx / textutil; read app TOPICS arrays via grep  
**Constraint:** REVIEW ONLY — no unit HTML files were edited  

---

## File → Unit Mapping

| HTML File | Unit | Subject | Packet File(s) |
|-----------|------|---------|---------------|
| unit8.html | Unit 8 | Linear Functions | Unit 8 Packet 1 - Notes.docx |
| unit9.html | Unit 9 | Systems of Equations | Unit 9 Packet 1 - Notes.docx |
| unit10.html | Unit 10 | Word Problems | Unit 10 Packet 1 - Notes.docx |
| unit11.html | Unit 11 | Exponent Properties | Unit 11 Packet 1 - Notes.docx |
| unit12.html | Unit 12 | Exponential Functions | Unit 12 Packet 1 - Notes.docx |
| unit13.html | Unit 13 | Polynomials | Unit 13 Packet 1 - Notes.docx |
| unit14.html | Unit 14 | Factoring | Unit 14 Packet 1 - Notes.docx |
| unit15.html | Unit 15 | Quadratic Functions | Unit 15 Packet 1 - Notes.docx |
| unit16.html | Unit 16 | Solving Quadratics | ⚠️ PARTIAL: `16.1 Notes (2021).doc` + `16.3 Notes.doc` only |

---

## ⚠️ Unit 16 Packet Coverage Warning

Unit 16 does not have a full notes packet. Only two .doc files exist:
- `16.1 Notes (2021).doc` — covers solving by factoring and solving by graphing (practice problems only, mostly EMBED placeholders)
- `16.3 Notes.doc` — covers the Square Root Method

**No source packets exist for:**
- App topic 16.3: The Quadratic Formula
- App topic 16.4: Discriminant & Types of Solutions
- App topic 16.2: Solving by Factoring (the packet "16.1" is practice problems, not notes)

All four app topics in unit16.html are self-contained and cannot be verified against a complete teaching packet.

---

## Unit 8: Linear Functions

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 8.1 | Slope — rise/run; 4 types; from two points; from table | What is Slope? — rise/run; 4 types; 2 worked examples | ✅ Close |
| 8.2 | Graphing Lines — slope-intercept form; x & y intercepts | Slope-Intercept Form — y=mx+b; 3-step graphing | ✅ Close |
| 8.3 | Horizontal & Vertical Lines (dedicated topic) | Writing Equations of Lines — point-slope, given point+slope | ⚠️ Reordered |
| 8.4 | Writing Equations — "backward" problems; point-slope | Standard Form & Special Lines — Ax+By=C; H&V lines | ⚠️ Reordered |
| 8.5 | Graphing Linear Inequalities — dashed/solid; shading | **MISSING** | ❌ Not in app |

### (A) Teaching Method Gaps

**8.1 — Slope:**
- The packet introduces slope via a "describe a line to a friend" warm-up, building intuition before the formula. The app jumps directly to the rise/run definition. The motivational framing is absent.
- The packet teaches slope from a table as a distinct exercise (read consecutive y-differences / x-differences). The app has no worked example for slope from a table.

**8.2 — Slope-Intercept Form:**
- The app's 3-step graphing process matches the packet's sequence closely (y-intercept → slope → draw line).
- The packet also teaches identifying x-intercepts from a graph and from slope-intercept form. The app 8.2 does not cover x-intercept identification.

**8.3 / 8.4 — Reordering:**
- The packet teaches H&V lines as topic 8.3 with its own pedagogical note ("the confusing part is mixing up x and y labels"). The app folds H&V lines into 8.4 as a brief "Special Lines" section.
- The packet frames 8.4 as "backward" problems (find equation from graph or description), explicitly using the word "backward" as a signature framing. The app's 8.3 covers the same algebraic content but without the backward-problem narrative.

**8.5 — Graphing Linear Inequalities (MISSING):**
- The packet teaches this as a full topic bridging Unit 6 (inequalities) and Unit 8 (graphing): dashed vs. solid boundary lines; shading above vs. below; a "quick way to remember how to shade after you get y by itself."
- The app has no corresponding topic. Students who learned this in class will find no review material here.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 8.1 | ✅ SVG grid with 4 labeled slope directions (Positive / Negative / Zero / Undefined) | None | App enhances |
| 8.2 | ✅ SVG graph of y=2x+1 with annotated rise/run arrows | None | App enhances |
| 8.4 | ✅ SVG graph of 3x+2y=12 with labeled intercepts | None | App enhances |
| 8.5 | ❌ No shading/dashed-line diagram | No packet | Missing topic + missing visual |

---

## Unit 9: Systems of Equations

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 9.1 | What is a System — real-world analogy; checking ordered pairs | What is a System? — checking ordered pairs; definition | ✅ Close |
| 9.2 | Solving by Graphing — intersection point | Solving by Graphing — intersection; 3 possibilities (1/0/∞) | ✅ Enhanced |
| 9.3 | Solving by Substitution | Solving by Substitution — 6-step process; 2 worked examples | ✅ |
| 9.4 | Solving by Elimination — add to cancel; multiply first | Solving by Elimination — "when to use" guide; 2 worked examples | ✅ Enhanced |
| 9.5 | Special Cases — all three methods produce parallel/coincident | **Folded into 9.2** | ⚠️ Restructured |

### (A) Teaching Method Gaps

**9.1 — System Definition:**
- The packet uses real-world analogies (digestive system, HVAC system, transportation system) to build conceptual meaning of "system." This motivational framing is reduced to a single Mr. Behling quip in the app.

**9.5 — Special Cases (restructured):**
- The packet teaches special cases (no solution / infinite solutions) as a capstone topic (9.5) after students have learned all three methods — the intent is that students discover these anomalies apply to ALL methods.
- The app moves this content into 9.2 (graphing only) and presents only the graphical interpretation (parallel lines / coincident lines).
- **Gap:** The app does not explicitly teach that substitution and elimination also produce special-case outputs (e.g., 0 = 5 → no solution; 0 = 0 → infinite solutions). Students relying on the app for exam review may not recognize these algebraic signals.

**9.4 — Enhancement:**
- The app includes a "when to use each method" comparison guide (Graphing / Substitution / Elimination) that is not present at this point in the packet. This is a genuine app improvement.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 9.2 | ✅ Two SVGs: small quick graph + large labeled graph showing intersection at (2,3) | None | App enhances |
| 9.2 | ❌ No diagram for parallel lines (no solution) or coincident lines (infinite solutions) | None | Missing — special cases shown only as text |

---

## Unit 10: Word Problems

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 10.1 | Math Words — operation vocabulary | Translating Words to Algebra — key words; 4-step process | ✅ |
| 10.2 | Interpreting Words in Equations | One-Variable Word Problems — number/age/consecutive int. | ✅ Close |
| 10.3 | Geometry Word Problems — perimeter/area/angles | Rate, Time & Distance — d=rt; 3 situations | ❌ Topic swap |
| 10.4 | "b + mx = y" Word Problems | Mixture & Multi-Step Problems | ❌ Topic swap |
| 10.5 | Two-variable Word Problems (systems) | **MISSING** | ❌ Not in app |

### (A) Teaching Method Gaps

**10.3 — Geometry Word Problems (MISSING from app):**
- The packet teaches perimeter, area, and angle-relationship word problems as a dedicated topic (10.3). This is a standard Algebra 1 exam category.
- The app replaces this with Rate/Time/Distance (d = rt), which is not a packet topic and does not appear in the packet's topic list.

**10.4 — "b + mx = y" Framing (MISSING from app):**
- The packet's 10.4 uses the signature framing "b + mx = y" — this deliberately connects word problems back to the linear equation form from Unit 8. Students learn to recognize the initial value (b) and rate of change (m) in word problem language.
- The app's 10.4 (Mixture & Multi-Step) covers a different class of problems and does not use this linking framing.

**10.5 — Two-Variable Word Problems (MISSING from app):**
- The packet explicitly teaches word problems that require a system of equations (connecting to Unit 9). This is missing entirely from the app's four-topic structure.

**App Additions (not in packet):**
- App 10.3 (d=rt, Rate/Time/Distance) is an enhancement not in the packet. Well-taught content, but occupies a slot where Geometry Word Problems should be.
- App 10.4 (Mixture problems with the system approach) partially substitutes for packet 10.5, but without the explicit "two-variable" framing.

### (B) Visual Gaps

No visuals in either the app or the packet for Unit 10 (appropriate for a word-problem unit).

---

## Unit 11: Exponent Properties

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 11.1 | Zero & Negative Exponents | Zero & Negative Exponents | ✅ |
| 11.2 | Multiplying & Dividing Powers | Multiplying & Dividing Powers | ✅ |
| 11.3 | Raising a Power to a Power | Raising a Power to a Power | ✅ |

### (A) Teaching Method

**Strong alignment.** All three topics match the packet in sequence and content.

**Enhancements in app (beyond packet):**
- App 11.1: Explicit warning callout about parentheses — `(-3)^0 = 1` vs. `-3^0 = -1`. Packet leaves this as an exercise discovery.
- App 11.2: "Top-heavy-bottom-heavy approach" for division — a named shortcut not present in the packet.
- App 11.3: "Distribute to ALL factors" warning with `(2x²)³` example — clarifies a common student error.
- The joke "Exponents are number 4^0 in my heart" (= #1 since 4^0=1) is preserved in the app.

**Minor gap:**
- Packet 11.2 opens with "Let's multiply powers, but before we do, don't forget [base rule]" — a prerequisite reminder. The app assumes this prior knowledge without the same warm-up structure.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 11.2 | ✅ SVG block diagram showing x³·x² = x⁵ (colored tiles for each factor) | None | App enhances |
| 11.1, 11.3 | No SVG | No visual expected | None |

---

## Unit 12: Exponential Functions

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 12.1 | Exp. Functions (Part 1) — patterns; y=ab^x; growth/decay; graph; AoRC | Exp. Functions (Part 1) — same content | ✅ |
| 12.2 | Exp. Functions (Part 2) — "backward" problems; find equation | Exp. Functions (Part 2) — same framing | ✅ |
| 12.3 | Word Problems — A=A₀(1+r)^t; growth/decay; examples | Word Problems — same formulas; 3 worked examples | ✅ |
| 12.4 | Solving Exp. Equations — same base; convert base; calculator | Solving Exp. Equations — 3 methods; powers to know | ✅ |

### (A) Teaching Method

**Excellent alignment.** This is the best-matched unit in Batch 2.

- The "backward" framing (12.2) is preserved and explicitly called out.
- The growth/decay formula using (1+r) and (1-r) is taught identically.
- App 12.4 preserves all three methods from the packet: (1) same base already → set exponents equal; (2) convert to same base; (3) use graphing calculator for "find intersection."
- The app 12.3 uses the same worked examples as the packet (frog population growth, bird population decay, and car depreciation with Mr. Behling personally buying a car). Context-fidelity is high.

**Enhancements in app:**
- App 12.4 includes a "Powers to know cold" reference card (powers of 2, 3, 4, 5) — helpful self-study tool.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 12.1 | ✅ Side-by-side SVG growth/decay curves with y-intercept annotation | None | App enhances |
| 12.2 | ✅ SVG decay graph for y=8(1/2)^x with labeled intercepts and asymptote | None | App enhances |

---

## Unit 13: Polynomials

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 13.1 | Arithmetic with Variables Review (like terms warm-up) | Introduction to Polynomials — classification/vocab | ⚠️ Restructured |
| 13.2 | Introduction to Polynomials — standard form; add/subtract | Adding & Subtracting Polynomials | ⚠️ Split |
| 13.3 | Multiplying Polynomials — **Clamshell Method** (named) | Multiplying Polynomials — Monomial × Polynomial | ⚠️ Reordered |
| 13.4 | Multiplying Polynomials — **Area Method** (named) | Multiplying Polynomials — **FOIL** (Binomial × Binomial) | ⚠️ Name differs |

### (A) Teaching Method Gaps

**Naming discrepancy — Clamshell vs. FOIL (significant):**
- The packet names the binomial × binomial technique "**Clamshell Method**" (13.3). The app calls the same technique "**FOIL**" (13.4).
- Both methods produce the same algebra, but students who took notes during class instruction labeled their technique "Clamshell." When they open the app and see "FOIL," they may not recognize it as the same technique.
- **Recommendation:** Add a note in app 13.4 that FOIL is the same process as the Clamshell Method, just with different labeling.

**Area Method:**
- The packet teaches the Area (box) method as a dedicated topic (13.4) as an alternative visual approach.
- The app's 13.4 (FOIL) includes an area/box SVG diagram and a "Reverse Box" SVG in 14.2, but there is no standalone "Area Method" topic in unit13.html.

**Restructuring — 13.1 Review Topic:**
- Packet 13.1 is an arithmetic-with-variables warm-up (like terms, combining terms — no new content). The app skips this review topic and begins with polynomial classification.
- Students who found the review useful as a retrieval exercise before polynomials will not find that scaffolding in the app.

**13.3 — Monomial × Polynomial:**
- The app adds this as a separate topic (monomial × polynomial using the distributive property). The packet does not have this as a standalone step — it goes directly to binomial × binomial.
- This is an app improvement (helpful intermediate step), not a gap.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 13.3 | ✅ SVG distribution arrow diagram (3x → each term) | None | App enhances |
| 13.4 | ✅ SVG FOIL box / area box for (x+3)(x+5) | Packet teaches area box as 13.4 | App has same visual, different name |

---

## Unit 14: Factoring

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 14.1 | Intro to Factoring — GCF; "distribution in reverse" | Intro to Factoring — GCF; same framing | ✅ |
| 14.2 | Factoring Trinomials (Part 1) — **X Method**; a=1 | Factoring Trinomials (Part 1) — **X Method**; a=1 | ✅ |
| 14.3 | Factoring Trinomials (Part 2) — negative leading; Difference of Squares | Factoring Trinomials (Part 2) — negative leading; DoS + **Split the Middle** (a≠1) | ⚠️ App adds content |
| 14.4 | Solving Equations by Factoring — ZPP; 5 steps | Solving Equations by Factoring — ZPP; 5 steps | ✅ |

### (A) Teaching Method

**Strong alignment.** The packet and app agree on naming ("X Method," "Difference of Squares"), framing ("distribution in reverse"), and process (5-step ZPP).

**App enhancement in 14.3 — Split the Middle Term (a≠1):**
- The packet's 14.3 covers only two cases: (1) negative leading coefficient → factor out -1 first; (2) Difference of Squares.
- The app's 14.3 adds a third method: "Split the Middle Term" (AC method) for trinomials where a ≠ 1, including a worked example and an area box SVG.
- This content is not in the packet. It is likely material covered in class but not in a written packet. Students may find this helpful, but its presence here (but not in the source packet) creates a small inconsistency in app-vs-packet coverage.

**Big-picture framing:**
- Packet 14.1 explicitly tells students they will learn "four or five techniques" for solving quadratic equations. The app preserves "distribution in reverse" and the big-picture setup.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 14.2 | ✅ SVG "Reverse Box" showing x²+7x+12 = (x+3)(x+4) | None | App enhances |
| 14.3 | ✅ SVG box model for a≠1 case (2x²+7x+3) | None | App enhances |
| 14.4 | ✅ SVG parabola with roots labeled on x-axis | None | App enhances |

---

## Unit 15: Quadratic Functions

### Topic Coverage

| # | Packet Topic | App Topic | Match? |
|---|-------------|----------|--------|
| 15.1 | Intro + Standard Form — parabola; vertex; AOS; graphing calc | Intro to Quadratic Functions — standard form; opening direction; y-intercept | ✅ Partial |
| 15.2 | Intercept (Factored) Form — x-intercepts from factors; zeros; "a" inquiry | Intercept (Factored) Form — same | ✅ |
| 15.3 | Vertex Form + Transformations — translate/reflect/stretch; inquiry | Vertex Form + Transformations — same | ✅ |
| 15.4 | Converting Between Forms | Converting Between Forms | ✅ |
| 15.5 | Word Problems — projectile motion; real-world quadratics | **MISSING** | ❌ Not in app |

### (A) Teaching Method Gaps

**15.1 — Key attributes missing in app:**
- The packet's 15.1 explicitly teaches: **axis of symmetry** (x = -b/2a), **vertex as max or min**, **domain and range**, **increasing/decreasing intervals**, and graphing with a calculator.
- The app's 15.1 covers opening direction, y-intercept, and parent function table, but does not explicitly present the axis-of-symmetry formula (x = -b/2a) or domain/range for quadratics.
- **This is a meaningful exam-readiness gap.** Students asked "what is the axis of symmetry?" or "what is the domain/range?" on a test will not find that content in the app's 15.1.

**15.2 — Inquiry-based framing:**
- The packet dedicates a section to inquiry-based learning about how the "a" value affects the parabola shape. Students are asked to discover the effect before being told.
- The app covers the effect of "a" but without the explicit inquiry framing. Minor difference in pedagogy.

**15.5 — Word Problems (MISSING):**
- The packet's 15.5 includes projectile motion word problems (height of a cliff, objects thrown upward), writing equations from zeros, and real-world quadratic modeling.
- None of this appears in the app's four-topic structure.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 15.1 | ✅ Table of values for y=x² (parent function) | None | App has table |
| 15.1 | ❌ No labeled parabola diagram (vertex, AOS, intercepts) | Students sketch by hand | Missing labeled diagram |
| 15.3 | ✅ Transformation content (inferred from topic structure) | Students work with calculator | App enhances |

---

## Unit 16: Solving Quadratics (PARTIAL PACKET COVERAGE)

### Topic Coverage

| # | Packet Source | App Topic | Match? |
|---|-------------|----------|--------|
| 16.1 | `16.3 Notes.doc` — Square Root Method (3 steps, ±) | Solving by Square Roots | ✅ Partial |
| 16.2 | `16.1 Notes (2021).doc` — practice problems only (EMBED placeholders) | Solving by Factoring | ⚠️ Packet = practice only |
| 16.3 | **No packet exists** | The Quadratic Formula | ❌ No source packet |
| 16.4 | **No packet exists** | Discriminant & Types of Solutions | ❌ No source packet |

Note: The topic numbering between packets and app is inverted — the .doc labeled "16.1" is about factoring/graphing, while the app's 16.1 is Square Roots. The packet's .doc labeled "16.3" is the Square Root Method, which the app covers as 16.1.

### (A) Teaching Method Gaps

**16.1 — Square Root Method:**
- The packet's 16.3 Notes.doc teaches: (1) get squared term alone; (2) take ± square root; (3) simplify. It also warns that the method "does not always work" (when there is an x term or when left side is not factorable as a perfect square).
- The app's 16.1 captures this content well: 3-step process, ± rule, three-case SVG (D>0, D=0, D<0), and warning for "no x term required."
- Minor gap: The packet shows the more complex form ¼(x+3)² = 9 and -3(x-1)² + 53 = 5 (square roots of binomials), which the app's worked examples don't reach.

**16.2 — Solving by Factoring:**
- The packet's "16.1" source file contains only practice problems (mostly EMBED equation placeholders), not instructional notes. The app's 16.2 is self-contained and well-taught (ZPP, 5-step process, 3 worked examples, warning not to divide by variable).
- Since Unit 14.4 already teaches ZPP in detail, the app's 16.2 functions as a review/extension.

**16.3 — Quadratic Formula (no packet):**
- The app provides full instruction: x = (-b ± √(b²-4ac)) / 2a; 4-step process; 2 worked examples including a=2 case. Well-structured despite having no source packet to verify against.

**16.4 — Discriminant (no packet):**
- The app provides clean instruction: D = b²-4ac; three cases (D>0 → two solutions; D=0 → one; D<0 → none); 3 worked examples. No source packet to verify.

### (B) Visual Gaps

| Topic | App | Packet | Gap |
|-------|-----|--------|-----|
| 16.1 | ✅ Three-panel SVG: two roots / one root / no roots (parabola cases) | None | App enhances |
| 16.2 | ✅ SVG parabola with roots on x-axis (y=x²-7x+12) | None | App enhances |
| 16.3, 16.4 | No SVGs (formula display only) | No packet | Adequate for content type |

---

## Priority-Ranked Overall Findings

### Priority 1 — Missing Topics (major exam coverage gaps)

| # | Gap | Unit | Impact |
|---|-----|------|--------|
| P1-A | **8.5 Graphing Linear Inequalities is entirely absent** | Unit 8 | High — full topic taught in class, nothing in app |
| P1-B | **10.3 Geometry Word Problems is absent** (replaced by d=rt) | Unit 10 | High — standard exam category |
| P1-C | **10.5 Two-variable Word Problems is absent** | Unit 10 | High — bridges Units 9 and 10 |
| P1-D | **15.5 Quadratic Function Word Problems is absent** | Unit 15 | High — projectile motion type |
| P1-E | **9.5 Special Cases (algebraic signals)** only shown graphically | Unit 9 | Medium — students won't recognize 0=5 or 0=0 in algebra |

### Priority 2 — Topic Name Mismatches (student confusion risk)

| # | Gap | Unit | Impact |
|---|-----|------|--------|
| P2-A | **Clamshell Method (packet) vs. FOIL (app)** — same technique, different name | Unit 13 | Medium — students recall class name "Clamshell" |
| P2-B | **"b+mx=y" framing** (packet 10.4) not preserved — connecting word problems to linear equations | Unit 10 | Medium — signature teaching technique lost |
| P2-C | **Topic ordering 8.3/8.4** — packet's H&V lines topic restructured into "Standard Form & Special Lines" | Unit 8 | Low — content present, just merged |

### Priority 3 — Missing Key Attributes

| # | Gap | Unit | Impact |
|---|-----|------|--------|
| P3-A | **Axis of Symmetry formula (x = -b/2a)** not explicitly in app 15.1 | Unit 15 | High — exam tested |
| P3-B | **Domain, range, increasing/decreasing** for quadratics not in app 15.1 | Unit 15 | Medium — exam tested |
| P3-C | **Slope from a table** not a worked example in app 8.1 | Unit 8 | Medium — packet 8.1 includes table cases |
| P3-D | **Square roots of binomials** [e.g., ¼(x+3)²=9] not in app 16.1 | Unit 16 | Low — advanced extension only |

### Priority 4 — App Enhancements (beyond packet, verified good)

These are items the app adds that are **improvements over the packet** — not gaps, but worth noting so they are preserved in future edits:

- All units: SVG diagrams for visual learners (slope directions, intersection graphs, decay curves, FOIL box, parabola roots, etc.)
- Unit 9.4: "When to use each method" comparison guide
- Unit 11: Parentheses warning (11.1), top-heavy approach (11.2), distribute-to-all warning (11.3)
- Unit 12: Powers-to-know reference card (12.4)
- Unit 13.3: Intermediate monomial × polynomial step not in packet
- Unit 14.3: Split the Middle Term method for a≠1 (extends beyond packet)

---

## Unit-Level Summary

| Unit | Alignment | Primary Issue |
|------|-----------|--------------|
| 8 | ⚠️ Partial | Missing topic 8.5 (Linear Inequalities); topics 8.3/8.4 reordered |
| 9 | ✅ Good | Special-case algebraic signals (0=5, 0=0) not taught — only graphical cases |
| 10 | ❌ Weak | Topics 10.3–10.5 differ significantly from packet; geometry WP and two-variable WP missing |
| 11 | ✅ Strong | Full match + helpful enhancements |
| 12 | ✅ Excellent | Near-perfect match in content, framing, and examples |
| 13 | ⚠️ Partial | Clamshell/FOIL naming mismatch; Area Method not standalone; review topic missing |
| 14 | ✅ Good | Strong match on X Method + ZPP; app adds a≠1 method beyond packet scope |
| 15 | ⚠️ Partial | Missing 15.5 (word problems); 15.1 missing AOS formula + domain/range |
| 16 | ⚠️ Partial | Source packets incomplete; app 16.3/16.4 have no packet to verify against |
