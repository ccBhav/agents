# Full plan: Amazon six-pager

A narrative memo a reader absorbs in one sitting, making the case for a decision. The narrative carries the argument; the appendices carry the detail.

## Writing the narrative (sections 1–8 + FAQ)
- **Prose.** Sections 1–8 are paragraphs; use a table only where it carries data. Bullets and checklists belong in the appendices.
- **Six pages.** Sections 1–8 run 2,500–3,500 words. Over that, the thinking isn't finished: cut.
- **Answer first.** The first paragraph says what we'll do and why, so a reader who stops there can decide.
- **Numbers, not adjectives.** "p95 drops from 820 ms to 140 ms", file paths, names, dates. An unknown is stated with how we'll find out.
- **Facts apart from assumptions.** Label each assumption.
- **Code in Appendix A.** The narrative cites snippets by label ("A.2").

Map the grilling into it: decisions → 2, 3 and 5; rejected options → 6; new ADRs and glossary entries → Appendix C.

## Writing Appendix A (code changes)
- Each change appears in **TypeScript, JavaScript and Go**. The repo's language goes first, marked "(repo)"; the implementer builds from that one, and the other two are faithful translations: same inputs, outputs, edge cases and errors, in each language's idiom (TS types and narrowing; JS with JSDoc; Go with explicit errors and `context.Context` where I/O happens).
- Each snippet compiles alone or is marked as an excerpt (`// ...`).
- Each change ends with **Example: how it works**: realistic input, the output, a short trace or table, and at least one edge case (empty input, boundary value, error path).
- A change with no meaningful code (config, docs) says so in one line.

## Template

~~~markdown
# <Title as a decision: "Round shift durations to the nearest 15 minutes at clock-out">

**Run:** <run-id> · **Size:** full · **Status:** Awaiting approval

## 1. Introduction
<What we propose, the outcome, why now. Enough to approve or reject.>

## 2. Goals and non-goals
<Measurable outcomes, each tied to an acceptance criterion; then what's out of scope and why.>

## 3. Tenets
<Two to five principles that settled trade-offs, each with a short justification, e.g. "Payroll correctness over speed: an extra query per clock-out beats a rounding mismatch with the export.">

## 4. Current state
<How it works today in the area we touch, with file references and data; what's wrong or missing, and the evidence.>

## 5. Proposal
<The design: components touched, data flow, fit with the repo's layering, the pattern we copy (path:line), snippets cited by label.>

## 6. Alternatives considered
<At least two real alternatives and why each lost, judged against the tenets.>

## 7. Risks and mitigations
<Risk, likelihood/impact, mitigation, and how we'd detect it in production: migrations, auth, tenancy, money/time math, performance, public API.>

## 8. Rollout and verification
<Tests per acceptance criterion, flags or migrations, how we roll back.>

## FAQ
<The skeptical reviewer's questions, two to four sentences each. Always include: "What happens to existing data?", "How do we know it works?", "What's the blast radius if it's wrong?">

---

## Appendix A — Code changes

### A.1 <Name> — `<repo path>`
<One sentence: what this code does and why.>

**TypeScript (repo)**
```ts
// minimal snippet in the repo's style
```

**JavaScript**
```js
// same logic, idiomatic JS
```

**Go**
```go
// same logic, idiomatic Go
```

**Example: how it works**
```ts
roundShift({ start: "2026-11-20T08:07:00Z", end: "2026-11-20T16:52:00Z" });
// → { minutes: 525 }
```
| Input | Output | Why |
|---|---|---|

## Appendix B — Execution plan (for the implementer)

### Standards & skills in effect
- Skills: <names>; the implementer and reviewers load these
- Key rules: <the 3–7 repo rules that matter most here, with source>

### Files
| File | Change | Why | Snippet |
|------|--------|-----|---------|

### Steps
1. <ordered, concrete, each verifiable; cite snippet labels>

### Tests
- New: <file + cases, mapped to acceptance criteria and to each "how it works" example>
- Existing to keep green: <files>

### Pattern to follow
<path:line>

### Open questions
- <blocking only; otherwise the assumption you made>

## Appendix C — Data and references
<Numbers gathered, test or log excerpts, tickets, ADRs, glossary entries, prior PRs.>
~~~
