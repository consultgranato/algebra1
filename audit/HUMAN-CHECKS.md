# Checks that need a person

Nothing in this file has been verified by the audit tooling. Each section is a script for a person to run, with
the result I expect so a deviation is easy to spot. Where an expected result comes from a machine measurement,
the source is named, but a measurement is not the same as hearing a real screen reader or holding a real phone.

Run every check twice: once on the **current live site** (baseline, to confirm the problems are real for your
students) and once on the Phase 1 build (to confirm the fixes).

---

## 1. Screen reader pass — Unit 5

**Setups**

- **NVDA + Chrome on Windows.** NVDA 2024.x or later, default settings (punctuation/symbol level "some"),
  browse mode. No MathCAT or MathPlayer add-on, because a student's school device will not have one.
- **VoiceOver + Safari on iPhone.** iOS 17 or later, default verbosity. Navigate by swiping right; use the rotor
  for headings.

Open `https://consultgranato.github.io/algebra1/unit5.html` (after Phase 1, the preview URL from the PR).

Expected phrases below come from Chrome's computed accessibility tree (`audit/raw/math-a11y.json`,
`node tools/probe-notes-ax.mjs`). NVDA and VoiceOver add role words ("button", "dialog", "heading level 1") and may
say `=` as "equals" and `−` as "minus" or "dash" depending on symbol settings. Judge the **maths**, not the filler
words.

| Step | Do this | Baseline: what you should hear today | Pass after Phase 1 |
|---|---|---|---|
| 1 | Press `H` (NVDA) / rotor → Headings (VO) | One heading only: "Solving Linear Equations, heading level 1". No headings for Notes / Vocabulary / Practice / Test. | Each section has a heading you can jump to. |
| 2 | Tab to the second topic card and press Enter | "Solving Equations with Fractions, dialog", then focus on "✕ Close, button" | Same (this already works). |
| 3 | Arrow down into the first worked example | "x 4 + 3 = 8 …" — **the fraction x/4 is read as "x 4"** | "x over 4, plus 3, equals 8" (or "x divided by 4…") |
| 4 | Press Escape | Dialog closes; focus returns to "Solving Equations with Fractions — already read, button" | Same. |
| 5 | Practice tab → topic 5.2 → read the first problem | e.g. "2 3 x = 8" for (2/3)x = 8 — **fraction read as two separate numbers** | "two thirds x equals 8" or "2 over 3 times x equals 8" |
| 6 | In Unit 11 practice, read `x^9 / x^3` | "x 9 x 3" — **no exponent, no division** | "x to the 9th power over x to the 3rd power" (wording may vary) |
| 7 | Type `zzz` in the answer box, press Enter | "Not quite — try once more. Show a hint" is announced without moving focus | Same. |
| 8 | Vocabulary tab → Quiz → first option | "<option text>, toggle button, not pressed" (NVDA) / "<option text>, button" (VO) | Same; after choosing, "pressed" / "selected". |
| 9 | Practice Test tab → leave every box blank → activate Submit | **No warning**. Score "0/20" appears; focus is lost (NVDA says nothing or jumps to the top of the page). | A warning names how many questions are blank before grading; after grading, focus lands on the score and it is read. |
| 10 | Read the results | Per-topic rows "Topic 5.1 … 0% Needs work" in test order, with no links | Rows sorted weakest first; each has a link to that topic's notes and practice. |
| 11 | Index page → "Clear all saved progress" | Heard inside the heading: "Semester 2 Clear all saved progress, heading level 2"; activating it opens a browser confirm box | A separate button outside the heading; an in-page confirmation that is announced. |

Record for each step: what you heard (exact words), pass / fail, device, screen reader version.

---

## 2. Real devices

Use a **school-managed Chromebook** (as students get it, logged in as a student test account if one exists), an
**iPhone** (Safari) and an **Android phone** (Chrome). For each device:

| # | Step | What to record |
|---|---|---|
| 1 | Open the index, then Unit 13. Practice → topic 13.4. Type the answer to one problem **with a caret**, e.g. `x^2+8x+15`. | Marked right or wrong? (Today it is marked wrong; `audit/raw/repro.json`.) Is `^` easy to find on the on-screen keyboard? How many taps? |
| 2 | Same problem, type `x²+8x+15` using the phone's superscript key if it has one | Accepted? |
| 3 | Unit 5 practice: type a negative answer | Which character does the keyboard insert (`-`, `–`, `−`)? Was it accepted? Did the keyboard auto-capitalise `X`? |
| 4 | Unit 5 practice at phone width: where is the calculator? | Distance you must scroll from problem 1 to the calculator. (Measured today: 1,172 px at 390×844, below all five problems.) |
| 5 | Look at the "streak" pill next to "Showing 5 of 15 problems" | Today it is an empty outline on a phone (`audit/raw/shots/repro-streak-pill-390.png`). |
| 6 | Unit 8 Practice Test: answer three questions, switch to another app for a minute, come back; then pull to refresh | Are your answers still there after switching apps? After refresh? (Today a refresh loses them and reshuffles the test.) |
| 7 | Open notes for any topic, scroll to the bottom, close | Does the page behind scroll? Does the close button stay reachable? |
| 8 | Pinch-zoom to 200% on Unit 5 notes and practice | Any text cut off, or any need to scroll sideways? (Measured fine at 320 CSS px; confirm by hand.) |
| 9 | Complete a practice set, close the browser, reopen the unit | Is the progress ring and "Topics 80%+" updated? |
| 10 | Chromebook only: Settings → Accessibility → turn on ChromeVox, repeat steps 3 and 5 from section 1 | What ChromeVox reads for a fraction. |
| 11 | Chromebook only: high-contrast / colour inversion on | Can you still tell which tab is selected and which quiz answer you picked? |

---

## 3. Blind review of 50 items

1. Print `audit/human/blind-review-sheet.md` (50 items drawn at random, seed 2026, every unit represented).
2. You or your co-teacher solve every item on paper **without** looking at the site or the key file.
3. Open `audit/human/blind-review-KEY.md` and mark each row ✅ / ❌ / ❓.
4. Send me the ❌ and ❓ rows. Any ❌ that the automated verifier did not also flag means the verifier missed
   something, and I will add a regression case for it.

The automated verifier found 17 wrong keys in 1,140 items (1.5%). If the sample is representative, expect zero
or one ❌ among 50. More than two would mean the verifier is missing a class of error.

---

## 4. Fifteen-minute pilot with one section

**Who.** One class section, including at least two students who use accommodations (for example, a student who
uses a screen reader or text-to-speech, one with extended time or reduced-distraction needs, one who works on a
phone). Get consent in the way D219 requires for classroom piloting. **No names go into any file.**

**Before.** Load the Phase 1 build on the devices students normally use. Pick one unit the class has just
finished (so the content is review). Prepare a seating list that maps seats to anonymous IDs (S01, S02, …), kept on
paper by you and never typed into the site.

**Minutes 0–2.** "Open Unit N. Do one practice set on topic N.2. If anything confuses you, say it out loud." Do not
demonstrate the site first.

**Minutes 2–10. Observe.** One observer per 4–6 students, silent. For each student, note on paper:

| Observe | Record as |
|---|---|
| Time from opening the page to the first answer typed | seconds |
| Any answer the student believes is right but the site marks wrong | the exact text they typed, and the problem |
| Hesitation over how to type something (exponent, fraction, negative, "no solution") | the symbol, and what they tried |
| Use of the hint, the calculator, the notes link | yes / no, and when |
| Where they stalled for more than 20 seconds | screen + what was on it |
| For students with accommodations: whether their tool (screen reader, zoom, TTS) read the problem correctly | what they heard or saw |

**Minutes 10–13. Ask (whole class, then the two accommodation students one-to-one):**
1. "Was there an answer you got right that the site said was wrong?"
2. "Was there anything you couldn't figure out how to type?"
3. "Did the hint help, or did it give the answer away?"
4. "If you could change one thing, what would it be?"

**Minutes 13–15. Export.** Each student presses "Export my data" (added in Phase 1) and saves the file with their
anonymous seat ID as the filename, into a shared folder you control. The export contains item IDs, right/wrong,
number of tries, hint used and time on item, and nothing that identifies the student.

**After.** Run `node tools/item-analysis.mjs <folder>` (Phase 1). It lists, per item, percent correct on the first
try, the most common wrong answers, and items nobody or everybody got right. Match the most common wrong answers
against your observation notes: a wrong answer that is actually a correct answer typed differently is a checker
bug, not a student error, and goes into `tests/checker-corpus.json`.

---

## 5. Standards alignment

`audit/human/standards-alignment-PROPOSED.md` maps all 66 topics to the Illinois Learning Standards for
Mathematics, which are the Common Core codes. Every row is marked **proposed**. Review it against the D219 course
map and fill in the last column. Two rows need particular attention: 12.4 (same-base exponential equations are not
an explicit Algebra 1 standard in CCSS) and the middle-school codes on Units 1–4, 11.
