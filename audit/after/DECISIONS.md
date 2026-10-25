# Content decisions for the teacher

Items I have **not** changed because the right answer is a teaching choice, not a computation. Each is
still listed as a known failure in `tests/expected/content.json` (or `checker.json`), so the safety net
keeps flagging it until you decide. Reply with the letter for each.

## Wrong keys that need you to choose the fix

| # | Where | Problem | Options |
|---|---|---|---|
| D1 | [unit7.html:477](../../unit7.html#L477) practice 7.4 | "The graph shows f(x) = x + 1. Use the graph to find f(2)." The drawn line is y = 0.5x + 1 and the dot sits at (2, 2) although labelled (2, 3). | **a)** redraw the graph as y = x + 1 (key stays f(2) = 3) · **b)** change the formula to f(x) = 0.5x + 1 and the key to f(2) = 2 |
| D2 | [unit7.html:510](../../unit7.html#L510) test 7.4 | Same, f(x) = x − 1, find f(3). Drawn as y = 0.5x; dot at (3, 1.5) labelled (3, 2). | **a)** redraw as y = x − 1 (key stays 2) · **b)** change formula to f(x) = 0.5x, key f(3) = 1.5 |
| D3 | [unit15.html:509](../../unit15.html#L509) test 15.2 | "Read the vertex from the graph", key (1, −3). Dot drawn at y = −2; y-labels unevenly spaced. | **a)** redraw so the vertex sits on −3 (key stays) · **b)** key becomes (1, −2) and the graph is relabelled to match |
| D4 | [unit15.html:513](../../unit15.html#L513) test 15.3 | "Read the vertex from the graph", key (−1, −4). The parabola is drawn as y = x² − 4 (vertex on the y-axis). | **a)** redraw as y = (x + 1)² − 4 (key stays) · **b)** key becomes (0, −4) |
| D5 | [unit10.html:520](../../unit10.html#L520) practice 10.7 | Jeans $42, shirts $12, 5 items for $126. No whole-number answer (j = 2.2); the key's 2 jeans + 3 shirts costs $120. | **a)** change the total to $120 (key stays) · **b)** you supply new prices |
| D6 | [unit10.html:466](../../unit10.html#L466) practice 10.3 | Isosceles: sides 2x − 1, 2x − 1, base x + 4, perimeter 31 → x = 29/5; key 6. The hint itself says "let's fix the problem to perimeter=32". | **a)** change the perimeter to 32 (key stays 6; hint rewritten without the drafting) · **b)** keep 31, key 29/5 = 5.8 |

## Ambiguous items (both answers defensible)

| # | Where | Question | Options |
|---|---|---|---|
| D7 | unit1-4 `BANKS['unit4'][9]` | Constant of 5x − 7 | **a)** −7 only (today) · **b)** accept 7 and −7 · **c)** reword to "the constant term, with its sign" |
| D8 | unit10 `BANKS['10.4'][7]` | Streaming $8/mo vs cable $30 + $5/mo: "after how many months does cable cost less?" Key 11 (equal at 10). | **a)** accept 10 and 11 · **b)** reword: "In which month does cable first cost less?" (key 11) |
| D9 | unit10 `BANKS['10.6'][6]` | "A plane flies 2400 miles with a tailwind in 4 hours. What is the plane's speed?" | **a)** drop "with a tailwind" · **b)** ask for "ground speed" |
| D10 | unit10 `BANKS['10.7'][7]` | 50 mL of 30% from 20% and 50%: exact 100/3 and 50/3 mL; key "33.3 mL of 20%, 16.7 mL of 50%". The checker now accepts "33.3, 16.7". | **a)** keep · **b)** say "round to the nearest tenth" in the question |
| D11 | unit12 `BANKS['12.3'][13]` | "losing r% per year", key A = A0(1 − r)^t | **a)** reword to "losing a rate r (as a decimal) per year" · **b)** keep |
| D12 | unit16 `BANKS['16.3'][12]`, `BANKS['16.4'][3..5]`, `T[15..16]` | "How many solutions / x-intercepts", keys "two solutions" / "no real solutions". The checker now accepts 2, two, 0, none. | **a)** keep keys · **b)** change keys to numbers |

## Checker policy

| # | Question | Options |
|---|---|---|
| D13 | `x2` typed for x² (today accepted; corpus case #210 calls it wrong) | **a)** keep accepting (recommended: students may have learned it) · **b)** reject from now on |

## Content you may want written (I will not invent it without your yes)

| # | Gap | Proposal |
|---|---|---|
| D14 | 5.1 and 5.2 notes warn about the invisible −1 in −x and sign errors in a numerator like (6 − 3x)/5; no practice item exercises either (0 of 15). | I draft 3–4 items per topic for your approval |
| D15 | Unit 1–4 vocabulary "Evaluate 4x − 2 when x = 3" had "10" twice; I removed the duplicate, leaving 3 options. | **a)** keep 3 options · **b)** add a fourth distractor, e.g. 12 (forgot to subtract) |
| D16 | Unit 5 topic 5.2 has no vocabulary questions (so no 5.2 quiz filter) | **a)** leave · **b)** I draft 2–3 for your approval |
| D17 | Videos: Unit 10 has none; 8.3 and 8.4 look swapped by title; 13.1 and 15.4 look off-topic | You choose links; I will wire them in |

## Wording I wrote that you should approve

| # | Where | Text |
|---|---|---|
| D18 | unit1-4 PEMDAS chart (`Packetsite/unit1-4-img-023.png`) alt text | "PEMDAS order of operations: Parentheses ( ), Exponents a², Multiply × or Divide ÷, Add + or Subtract −." |
| D19 | unit1-4 fraction wall (`Packetsite/unit1-4-img-064.png`) alt text | "Fraction wall: one whole bar divided into equal parts — halves, thirds, fourths, fifths, sixths, eighths, tenths and twelfths." |
| D20 | Spoken maths (screen readers) | Fractions read as "7 over 3"; powers as "squared", "cubed", "to the power 9", "to the power negative 4". Say if you teach a different reading (e.g. "seven thirds"). |
| D21 | Blank-answer warning on the practice test | "N questions are blank (3, 7, 12). If you submit now, they are marked Skipped and count as wrong." — Skipped still counts as wrong; say if it should not count. |
