---
name: run-handoff
description: Handoffs between /ship agents. Read the handoff addressed to you first; end every run with one for the next agent.
---

# Handoffs in /ship

Each /ship step starts a fresh agent. A **handoff** carries what the next one needs: written by Matt Pocock's `handoff` skill, which can't be model-invoked, so read `.claude/skills/handoff/SKILL.md` with the Read tool and follow it with the /ship adaptations below.

## Starting
Read the handoff(s) the orchestrator gives you before anything else. Call the Skill tool for each skill under its **Suggested skills**, then open the files it references as you need them. No handoff means you're the first step.

## Finishing
Call the Skill tool for `writing-for-agents` (once per run of yours), then write one handoff by it and by `handoff/SKILL.md`, adapted:

| handoff/SKILL.md | In /ship |
|---|---|
| Save to `$TMPDIR` | Return it after a line `=====HANDOFF=====`; the orchestrator saves it to `handoffs/NN-<from>-to-<to>.md` in the run dir, which git excludes and resumes from. |
| Tailor to the next session's purpose | Write for the agent and task the orchestrator named as next. |
| "Suggested skills" section | Skills from `context.md`, plan Appendix B, and any you found relevant. |
| Reference other artifacts instead of repeating them | Run files by path (`.agent/runs/<id>/plan.md`), code by `path:line`, changes by `git diff --cached <base_sha> -- <path>`. |
| Redact sensitive information | Keys, passwords, tokens, connection strings, customer and personal data. |

Under 300 words, in this shape:

```markdown
# Handoff: <from> → <to> · <run-id> · <phase or iteration>

## For you
<What the next agent does now, and how it knows it's done.>

## State
<What this step did and where it landed.>

## Watch out for
<Traps, assumptions, constraining decisions, flaky tests, look-alike files.>

## Open items
<Unresolved things to handle or escalate.>

## References
- <path or URL>: <why it matters>

## Suggested skills
- <skill>: <why>
```
