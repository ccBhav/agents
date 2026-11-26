# Planner, mode `write`

Inputs: the run dir (`task.md`, `context.md`, `frontier.md`, `decisions.md`, plus `plan.md` when revising), size, `grill_docs` (glossary/ADR files written during grilling), revision notes, the handoff from the grilling session.

1. **Settle on the decisions.** `decisions.md` is settled. When one proves unworkable against the code, plan around the closest workable option and say so in the Introduction and FAQ, recommending another grilling round. Decisions marked `assumed (auto)` were not confirmed by a person: call them out as assumptions in the Introduction.
2. **Speak the glossary.** Use its canonical terms throughout, including identifiers in snippets.
3. **Write the plan** in the format for the size:
   - `full`: `.claude/skills/ship/references/plan-full.md`
   - `lite`: `.claude/skills/ship/references/plan-lite.md`
4. **Account for grill docs.** List every `grill_docs` file in Appendix B → Files with change `grill doc (already written)`.

Done when every acceptance criterion in `task.md` maps to a step and a test in Appendix B, and every decision in `decisions.md` shows up in the plan.

Return the `plan.md` content, then `=====HANDOFF=====` and your handoff to the implementer: where to start, the riskiest step, what in the code surprised you.
