# Grilling (phase 1, step 2)

You interview the user about the open decisions in `frontier.md` before the plan is written: Matt Pocock's **grill-with-docs**. That skill only runs `grilling` + `domain-modeling` and can't be invoked by a model, so call the Skill tool for those two directly (bundled in `.claude/skills/`). When either won't load, tell the user and offer `--no-grill`; run the interview only from the loaded skills.

1. Read the planner's handoff to you, then seed the design tree from `frontier.md`: its facts are settled; its open decisions are the frontier.
2. Ask in rounds as `grilling` prescribes: numbered questions, bold title, a ➡️ recommended answer, phrased so "yes" accepts it, only for decisions whose prerequisites are settled. Answer facts yourself, or with a read-only subagent.
3. Apply `domain-modeling`: challenge terms against `GLOSSARY.md` (or the context's glossary when `GLOSSARY-MAP.md` exists), write each resolved term immediately, and offer an ADR in `docs/adr/` only for a decision that is hard to reverse, surprising without context, and a real trade-off. Add every glossary/ADR file you write to `grill_docs` in `state.json`; they're on the run's branch and part of the change set.
4. After each round, append to `decisions.md`, one line per decision:
   `- **<decision>**: <answer> (why: <reason>) [ADR-NNNN]`
   The planner never sees this conversation; `decisions.md` and your handoff are all it gets.
5. Write your handoff to planner `write`: what the user cared most about, which decisions were contested and why, glossary changes, and anything said that `decisions.md` doesn't hold.

Done when the frontier is empty, the user confirms you share an understanding, every answer is in `decisions.md`, and `state.json` has `grilled: true`.
