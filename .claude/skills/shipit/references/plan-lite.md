# Lite plan

For a small, low-risk change: at most 3 files, no schema, public API, auth, payments, money or time-math change. One short paragraph, then the appendices. Snippets are in the repo's language only.

When the work turns out bigger or riskier than that, say so in the paragraph and recommend re-planning as `full`.

~~~markdown
# <Title as a decision>

**Run:** <run-id> · **Size:** lite · **Status:** Awaiting approval

<Two to four sentences: what changes, why, and the one risk worth knowing.>

## Appendix A — Code changes
### A.1 <Name> — `<path>`
```<repo language>
// snippet
```
**Example: how it works**: input → output, plus one edge case.

## Appendix B — Execution plan
### Standards & skills in effect
### Files
| File | Change | Why | Snippet |
|------|--------|-----|---------|
### Steps
### Tests
### Pattern to follow
### Open questions
~~~
