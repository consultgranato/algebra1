# Proposed new content (not live)

Drafted for decisions D14 and D16. **None of this is on the site.** Each answer was checked with SymPy before it
went in this file. Approve, edit or reject each block. On approval I add the items to the page, the safety net checks
them like every other item, and the bank sizes and the "Showing 5 of 15" text are updated to match.

## D14 — practice for errors the notes warn about

### Topic 5.1 — "the invisible −1 in −x" (no current item exercises it)

```js
{q:"Solve:",eq:"−x + 4 = 10",a:"x = −6",fmt:"x = ___",h:"Subtract 4: −x = 6. −x means −1·x, so divide by −1: x = −6."},
{q:"Solve:",eq:"9 − x = 2",a:"x = 7",fmt:"x = ___",h:"Subtract 9: −x = −7. Divide by −1: x = 7."},
{q:"Solve:",eq:"−x − 5 = 3",a:"x = −8",fmt:"x = ___",h:"Add 5: −x = 8. Divide by −1: x = −8."},
{q:"Solve:",eq:"12 = −x + 3",a:"x = −9",fmt:"x = ___",h:"Subtract 3: 9 = −x. Divide by −1: x = −9."},
```

### Topic 5.2 — "sign errors in a numerator like (6 − 3x)/5" (no current item exercises it)

```js
{q:"Solve:",eq:"(6 − 3x)/5 = 3",a:"x = −3",fmt:"x = ___",h:"Multiply by 5: 6 − 3x = 15. Subtract 6: −3x = 9. Divide by −3: x = −3."},
{q:"Solve:",eq:"(2x − 8)/4 = 1",a:"x = 6",fmt:"x = ___",h:"Multiply by 4: 2x − 8 = 4. Add 8: 2x = 12. x = 6."},
{q:"Solve:",eq:"(10 − 4x)/2 = 9",a:"x = −2",fmt:"x = ___",h:"Multiply by 2: 10 − 4x = 18. Subtract 10: −4x = 8. x = −2."},
{q:"Solve:",eq:"(x + 7)/3 = −2",a:"x = −13",fmt:"x = ___",h:"Multiply by 3: x + 7 = −6. Subtract 7: x = −13."},
```

Adding four to each bank makes it 19 items, so a random set of 5 would show at least one of these about 74% of
the time. If you would rather keep 15 per topic, tell me which existing items to swap out.

## D16 — vocabulary questions for topic 5.2 (there are none today)

```js
{topic:'5.2',type:'mc',q:'To solve (2/3)x = 8, you multiply both sides by...',opts:['2/3','3/2','8','3'],a:1},
{topic:'5.2',type:'mc',q:'What is the reciprocal of 5/6?',opts:['5/6','6/5','−5/6','1'],a:1},
{topic:'5.2',type:'mc',q:'In x/4 + 3 = 8, what happens to x first?',opts:['It is divided by 4','3 is added to it','It is multiplied by 4','8 is subtracted from it'],a:0},
```

Adding these also gives the vocabulary quiz a 5.2 filter button.
