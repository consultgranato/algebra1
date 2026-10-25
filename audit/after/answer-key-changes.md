# Answer-key and explanation changes

Phase 0 baseline (`audit/raw/items.json`) vs current pages. Solver = independent SymPy/hand solution (`tools/verify/`). Regenerate: `node tests/run-all.mjs --skip-axe && python tools/key_diff.py`.

| Item | Field | Before | After | Solver says | Solver verdict |
|---|---|---|---|---|---|
| unit1-4.html:bank:unit4:9 | explanation | `The constant is the term with no variable.` | `The constant is the term with no variable. 5x - 7 is 5x + (-7), so the constant term is -7.` |  |  |
| unit1-4.html:bank:unit4:9 | format | `numerical answer` | `numerical answer, with its sign` |  |  |
| unit6.html:bank:6.4:11 | key | `no solution` | `all real numbers` | Reals | match |
| unit6.html:test:6.3:14 | key | `x >= ≈ 1.6` | `x >= 16/5` | Interval(16/5, oo) | match |
| unit9.html:bank:9.1:7 | key | `yes` | `no` | no | match |
| unit9.html:bank:9.1:12 | key | `yes` | `no` | no | match |
| unit9.html:bank:9.3:14 | key | `infinite solutions` | `no solution` | NO SOLUTION | match |
| unit9.html:bank:9.3:14 | explanation | `Sub y=6−2x: 2x+(6−2x)=8 → 6=8? No... wait: 2x+6−2x=8 → 6=8. Contradiction: no solution. (These are parallel lines.)` | `Sub y=6−2x: 2x+(6−2x)=8 → 2x+6−2x=8 → 6=8. False, so there is no solution. (The lines are parallel.)` |  |  |
| unit9.html:bank:9.4:3 | explanation | `Add: 4x=12 → x=3. Sub: 3+2y=10 → 2y=7... actually: 3x+2y=10, x=3, so 9+2y=10 → y=1/2.` | `Add the equations: 4x=12 → x=3. Substitute into 3x+2y=10: 9+2y=10 → y=1/2.` |  |  |
| unit9.html:bank:9.4:6 | key | `(2, 2)` | `(5/2, 4)` | (5/2, 4) | match |
| unit9.html:bank:9.4:6 | explanation | `Add: 2y=8 → y=4... wait: −y+3y=2y, 6+2=8, 2y=8, y=4. Sub: 4x−4=6 → x=5/2. Let me recalc: 4x−y=6, −4x+3y=2 → 2y=8 → y=4, 4x=10 → x=5/2.` | `Add the equations: 2y=8 → y=4. Substitute: 4x−4=6 → 4x=10 → x=5/2.` |  |  |
| unit9.html:test:9.1:2 | key | `yes` | `no` | no | match |
| unit9.html:test:9.4:18 | key | `(1, 2) — wait: add: 4y=20 → y=5, 4x+15=18 → x=3/4` | `(3/4, 5)` | (3/4, 5) | match |
| unit10.html:bank:10.3:12 | explanation | `s+10+3s=30 → 4s=20 → s=4. Hmm: let s=short, s+10+3s=30→4s=20→s=5. Recheck: 5+10+15=30 ✓` | `Let s = shortest: s + 10 + 3s = 30 → 4s = 20 → s = 5. Check: 5 + 10 + 15 = 30 ✓` |  |  |
| unit10.html:bank:10.3:14 | explanation | `2(2x−1)+(x+4)=31 → 5x+2=31 → x=6 (but: 2(11)+10=32≠31; try: 5x−2+4=31→5x=29... Actually: 2(2x-1)+(x+4)=4x-2+x+4=5x+2=31→5x=29→x=5.8. Use x=6 for integer: let's fix the problem to perimeter=32: 5x+2=32→x=6 ✓)` | `2(2x − 1) + (x + 4) = 32 → 4x − 2 + x + 4 = 32 → 5x + 2 = 32 → 5x = 30 → x = 6. Check: 11 + 11 + 10 = 32 ✓` |  |  |
| unit10.html:bank:10.3:14 | problem | `An isosceles triangle has two equal sides of length 2x−1 and a base of x+4. Perimeter = 31. Find x.` | `An isosceles triangle has two equal sides of length 2x−1 and a base of x+4. Perimeter = 32. Find x.` |  |  |
| unit10.html:bank:10.4:7 | explanation | `30+5m < 8m → 30 < 3m → m > 10. After 11 months cable is cheaper.` | `30 + 5m < 8m → 30 < 3m → m > 10. At 10 months both cost $80; from month 11 cable is cheaper.` |  |  |
| unit10.html:bank:10.4:7 | problem | `Streaming service: $8/month. Cable: $30 setup + $5/month. After how many months does cable cost less?` | `Streaming service: $8/month. Cable: $30 setup + $5/month. In which month does cable first cost less than streaming?` |  |  |
| unit10.html:bank:10.4:7 | format | `after ___ months` | `month ___` |  |  |
| unit10.html:bank:10.6:6 | problem | `A plane flies 2400 miles with a tailwind in 4 hours. What is the plane's speed?` | `A plane flies 2400 miles in 4 hours. What is the plane's average speed?` |  |  |
| unit10.html:bank:10.7:0 | explanation | `42j + 12(5-j) = 126 → 30j = 66 → j ≈ 2.2 → 2 jeans, 3 shirts` | `42j + 12(5 − j) = 120 → 30j + 60 = 120 → 30j = 60 → j = 2. So 2 jeans and 3 shirts. Check: 84 + 36 = 120 ✓` |  |  |
| unit10.html:bank:10.7:0 | problem | `You went shopping for jeans ($42 each) and shirts ($12 each). Bought 5 items for $126. How many of each?` | `You went shopping for jeans ($42 each) and shirts ($12 each). Bought 5 items for $120. How many of each?` |  |  |
| unit10.html:bank:10.7:7 | explanation | `0.20x + 0.50(50-x) = 15 → -0.30x = -10 → x ≈ 33.3` | `0.20x + 0.50(50 − x) = 15 → −0.30x = −10 → x = 33.3 mL of 20%, and 50 − 33.3 = 16.7 mL of 50%` |  |  |
| unit10.html:bank:10.7:7 | problem | `A chemistry student needs 50 mL of 30% alcohol. She has 20% and 50% solutions. How much of each?` | `A chemistry student needs 50 mL of 30% alcohol. She has 20% and 50% solutions. How much of each? Round to the nearest tenth of a mL.` |  |  |
| unit10.html:bank:10.7:7 | format | `mL of each` | `mL of 20%, mL of 50%` |  |  |
| unit10.html:test:10.7:31 | key | `4 lbs of each` | `2 lbs of A, 6 lbs of B` | 2, 6 | match |
| unit10.html:test:10.7:31 | explanation | `4x + 6(8-x) = 44 → -2x = -8 → x = 4` | `4x + 6(8 − x) = 44 → 4x + 48 − 6x = 44 → −2x = −4 → x = 2. So 2 lbs of A and 6 lbs of B.` |  |  |
| unit10.html:test:10.7:31 | format | `# lbs of each` | `lbs of A, lbs of B` |  |  |
| unit12.html:bank:12.3:10 | key | `175` | `143` | 143 | match |
| unit12.html:bank:12.3:10 | explanation | `50(1.3)^4 = 50(2.8561) ≈ 143. (Actually 50×1.3^4=50×2.8561=142.8≈143)` | `50(1.3)^4 = 50(2.8561) = 142.8 ≈ 143.` |  |  |
| unit12.html:bank:12.3:12 | key | `72379` | `72314` | 72314 | match |
| unit13.html:bank:13.2:3 | explanation | `Distribute -: 4x^2-3x+5 - x^2-x+2 = 3x^2-4x+7` | `Distribute -: 4x^2-3x+5 - x^2-x+2 = 3x^2-4x+7` |  |  |
| unit13.html:bank:13.2:5 | explanation | `3x^2+x-4 - x^2+2x-3 = 2x^2+3x-7` | `3x^2+x-4 - x^2+2x-3 = 2x^2+3x-7` |  |  |
| unit13.html:bank:13.2:7 | explanation | `5x^2+8-2x^2+3 = 3x^2+11` | `5x^2+8-2x^2+3 = 3x^2+11` |  |  |
| unit13.html:bank:13.2:8 | explanation | `All like terms cancel: 0x^2+0x+0 = 0` | `All like terms cancel: 0x^2+0x+0 = 0` |  |  |
| unit13.html:bank:13.2:10 | explanation | `No x^2 and x terms to combine: 4x^2+3x-7` | `No x^2 and x terms to combine: 4x^2+3x-7` |  |  |
| unit13.html:bank:13.2:11 | explanation | `9x^2+4x-1-4x^2-4x-3 = 5x^2-4` | `9x^2+4x-1-4x^2-4x-3 = 5x^2-4` |  |  |
| unit13.html:bank:13.2:12 | explanation | `(2+1)x^3+(3-3)x^2+x = 3x^3+x` | `(2+1)x^3+(3-3)x^2+x = 3x^3+x` |  |  |
| unit13.html:bank:13.2:12 | problem | `(2x^3 + 3x^2) + (x^3 - 3x^2 + x)` | `(2x^3 + 3x^2) + (x^3 - 3x^2 + x)` |  |  |
| unit13.html:bank:13.2:13 | explanation | `6x^2-2x+1-6x^2-2x+1 = -4x+2` | `6x^2-2x+1-6x^2-2x+1 = -4x+2` |  |  |
| unit13.html:bank:13.2:14 | explanation | `(-1+1)x^2+(4-1)x+(-3+5) = 3x+2` | `(-1+1)x^2+(4-1)x+(-3+5) = 3x+2` |  |  |
| unit13.html:bank:13.3:3 | problem | `5x^2(x - 3)` | `5x^2(x - 3)` |  |  |
| unit13.html:bank:13.3:5 | problem | `-2x^2(3x + 5)` | `-2x^2(3x + 5)` |  |  |
| unit13.html:bank:13.3:7 | problem | `3x^3(x^2 - 2x)` | `3x^3(x^2 - 2x)` |  |  |
| unit13.html:bank:13.3:9 | problem | `6x^2(x^2 + 3x - 1)` | `6x^2(x^2 + 3x - 1)` |  |  |
| unit13.html:bank:13.3:12 | problem | `7x^2(2x - 1)` | `7x^2(2x - 1)` |  |  |
| unit13.html:bank:13.3:13 | problem | `x^2(x^3 - x + 2)` | `x^2(x^3 - x + 2)` |  |  |
| unit13.html:bank:13.4:0 | explanation | `F:x^2, O:5x, I:3x, L:15 → x^2+8x+15` | `F:x^2, O:5x, I:3x, L:15 → x^2+8x+15` |  |  |
| unit13.html:bank:13.4:1 | explanation | `F:x^2, O:2x, I:-4x, L:-8 → x^2-2x-8` | `F:x^2, O:2x, I:-4x, L:-8 → x^2-2x-8` |  |  |
| unit13.html:bank:13.4:2 | explanation | `Difference of squares: x^2-36` | `Difference of squares: x^2-36` |  |  |
| unit13.html:bank:13.4:3 | explanation | `F:2x^2, O:8x, I:x, L:4 → 2x^2+9x+4` | `F:2x^2, O:8x, I:x, L:4 → 2x^2+9x+4` |  |  |
| unit13.html:bank:13.4:4 | explanation | `F:3x^2, O:15x, I:-2x, L:-10 → 3x^2+13x-10` | `F:3x^2, O:15x, I:-2x, L:-10 → 3x^2+13x-10` |  |  |
| unit13.html:bank:13.4:5 | explanation | `F:x^2, O:-7x, I:-3x, L:21 → x^2-10x+21` | `F:x^2, O:-7x, I:-3x, L:21 → x^2-10x+21` |  |  |
| unit13.html:bank:13.4:6 | explanation | `Difference of squares: 4x^2-9` | `Difference of squares: 4x^2-9` |  |  |
| unit13.html:bank:13.4:7 | explanation | `(x+4)(x+4): F:x^2, O:4x, I:4x, L:16 → x^2+8x+16` | `(x+4)(x+4): F:x^2, O:4x, I:4x, L:16 → x^2+8x+16` |  |  |
| unit13.html:bank:13.4:8 | explanation | `F:3x^2, O:-6x, I:x, L:-2 → 3x^2-5x-2` | `F:3x^2, O:-6x, I:x, L:-2 → 3x^2-5x-2` |  |  |
| unit13.html:bank:13.4:9 | explanation | `(x-5)^2: F:x^2, O:-5x, I:-5x, L:25 → x^2-10x+25` | `(x-5)^2: F:x^2, O:-5x, I:-5x, L:25 → x^2-10x+25` |  |  |
| unit13.html:bank:13.4:10 | explanation | `F:4x^2, O:-4x, I:3x, L:-3 → 4x^2-x-3` | `F:4x^2, O:-4x, I:3x, L:-3 → 4x^2-x-3` |  |  |
| unit13.html:bank:13.4:11 | explanation | `F:2x^2, O:6x, I:-5x, L:-15 → 2x^2+x-15` | `F:2x^2, O:6x, I:-5x, L:-15 → 2x^2+x-15` |  |  |
| unit13.html:bank:13.4:12 | explanation | `Difference of squares: x^2-1` | `Difference of squares: x^2-1` |  |  |
| unit13.html:bank:13.4:13 | explanation | `F:5x^2, O:20x, I:-2x, L:-8 → 5x^2+18x-8` | `F:5x^2, O:20x, I:-2x, L:-8 → 5x^2+18x-8` |  |  |
| unit13.html:bank:13.4:14 | explanation | `Difference of squares: x^2-9` | `Difference of squares: x^2-9` |  |  |
| unit13.html:test:13.2:5 | explanation | `(2+1)x^2+(3-1)x+4` | `(2+1)x^2+(3-1)x+4` |  |  |
| unit13.html:test:13.2:6 | explanation | `5x^2+2x-3-2x^2+x-1=3x^2+3x-4` | `5x^2+2x-3-2x^2+x-1=3x^2+3x-4` |  |  |
| unit13.html:test:13.2:7 | explanation | `(1+2)x^3+4x-4` | `(1+2)x^3+4x-4` |  |  |
| unit13.html:test:13.3:12 | problem | `x^2(3x - 4)` | `x^2(3x - 4)` |  |  |
| unit13.html:test:13.3:13 | problem | `3x^2(2x^2 + x - 5)` | `3x^2(2x^2 + x - 5)` |  |  |
| unit13.html:test:13.4:15 | explanation | `F:x^2, O:3x, I:5x, L:15 → x^2+8x+15` | `F:x^2, O:3x, I:5x, L:15 → x^2+8x+15` |  |  |
| unit13.html:test:13.4:16 | explanation | `F:x^2, O:8x, I:-2x, L:-16 → x^2+6x-16` | `F:x^2, O:8x, I:-2x, L:-16 → x^2+6x-16` |  |  |
| unit13.html:test:13.4:17 | explanation | `F:2x^2, O:-8x, I:3x, L:-12 → 2x^2-5x-12` | `F:2x^2, O:-8x, I:3x, L:-12 → 2x^2-5x-12` |  |  |
| unit13.html:test:13.4:18 | explanation | `Difference of squares: x^2-49` | `Difference of squares: x^2-49` |  |  |
| unit13.html:test:13.4:19 | explanation | `Difference of squares: 9x^2-1` | `Difference of squares: 9x^2-1` |  |  |
