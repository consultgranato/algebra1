# Backlog

Deferred on purpose during the evidence pass (see `audit/AUDIT-REPORT.md` and `audit/after/AFTER-REPORT.md`).
Nothing here is built.

| Item | Why deferred / note |
|---|---|
| Dark mode | Out of scope for the audit. |
| Service worker / web app manifest (offline use) | Out of scope; would also need a cache-invalidation plan so students never see stale keys. |
| Social preview tags (Open Graph) | Out of scope. |
| Progress import (the counterpart to "Export my data") | Out of scope; export alone is enough for the pilot. |
| MathML alongside the spoken-text fallback | The hidden spoken form works in every screen reader today; MathML helps VoiceOver and NVDA+MathCAT users further. |
| Redraw every graph from its own formula | Several parabolas are straight-segment polylines, some y-axes are unevenly labelled, three growth curves flatten at the top (`audit/AUDIT-REPORT.md` #24). Four that change answers are decisions D1–D4. |
| New practice items for warned-about errors (5.1, 5.2, and low-coverage 5.3, 10.1, 11.1, 16.2) | Content needs teacher approval (D14). |
| Unit 10 videos; 8.3/8.4, 13.1, 15.4 video choices | Teacher to choose links (D17). |
| Split notes HTML out of the unit pages | Would bring Unit 1–4 mobile LCP back under 2.5 s (now 2.57 s). |
| Compress `Packetsite/unit6-img-025.jpeg` (945 KB) | Loads only when that topic's notes open; worth doing with the image swap. |
| 11px exponent letters in notes body text | Typographic superscript in 14.6 px text; left as is. |
