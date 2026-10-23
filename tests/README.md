# Safety net

```bash
cd tools && npm install && cd .. && pip install -r tools/requirements-dev.txt
node tests/run-all.mjs                    # everything (about 3 minutes)
node tests/run-all.mjs --skip-axe         # faster local loop
node tests/run-all.mjs --update-expected  # after a reviewed fix
```

| Check | What fails the run |
|---|---|
| Item verification (`tools/verify/`) | an answer key, explanation or markup problem not in `expected/content.json` |
| Checker corpus (`checker-corpus.json`) | any input accepted in `checker-baseline.json` that is now rejected; any verdict change not in `expected/checker.json` |
| Key round-trip | an item whose key, typed in normal notation, is rejected and is not in `expected/key-roundtrip.json` |
| axe-core, 14 pages × 9 views × 2 viewports | a new violation, or more nodes for a known one, than `expected/axe.json` |

A known failure that starts passing also stops the run (`UPDATE-EXPECTED`), so the expected
lists only ever shrink on purpose, in a commit that says which finding was fixed.
