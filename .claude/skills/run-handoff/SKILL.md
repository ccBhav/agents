---
name: run-handoff
description: How /ship agents pass context to each other with the handoff skill. Preloaded by every /ship agent; also used by the /ship orchestrator. Read handoffs addressed to you before working, and end every run with a handoff for the next agent.
---

# Handoffs between /ship agents

Every step of a `/ship` run starts a fresh agent with no memory of what came before. Context passes between them as **handoff documents**, written with Matt Pocock's `handoff` skill (`.claude/skills/handoff/SKILL.md`).

That skill can only be started by a person, so it can't be preloaded or invoked by an agent. Instead, **read `.claude/skills/handoff/SKILL.md` with the Read tool and follow it**, with the `/ship` adaptations below.

## When you start

1. The orchestrator gives you the path(s) of the handoff(s) addressed to you, in `<run-dir>/handoffs/`. **Read them first, before anything else.**
2. Call the Skill tool for each skill listed in the handoff's **Suggested skills** section (skip any already preloaded).
3. Open the artifacts it references (`task.md`, `context.md`, `decisions.md`, `plan.md`, reports, diffs) as you need them. The handoff points at them instead of repeating them.

If no handoff was given, you are the first step; carry on from your inputs.

## When you finish

A handoff is a document an agent consumes, so call the Skill tool for `writing-for-agents` first (skip if already loaded) and write by it: lead with what the next agent must do, give its step a clear completion criterion, point at material instead of restating it, state the target behaviour positively, and prune every line the next agent wouldn't act on.

Then write one handoff for the next step, following `handoff/SKILL.md`, with these adaptations:

| handoff/SKILL.md says | In /ship |
|---|---|
| Save it to `$TMPDIR` / `/tmp` | **Don't save it.** Return it at the end of your final message after a line `=====HANDOFF=====`. The orchestrator saves it as `<run-dir>/handoffs/NN-<from>-to-<to>.md`. The run dir is already excluded from git, so it still stays out of the workspace's history, and the run stays resumable. |
| Tailor it to the arguments describing the next session | The orchestrator tells you who's next and what they'll do (e.g. "verifier: run the gates on iteration 2"). Write for exactly that reader and task. |
| Include a "suggested skills" section | Name the skills the next agent should call with the Skill tool: the ones in `context.md`, plan Appendix B → Standards & skills in effect, and any you found relevant. |
| Don't duplicate content in other artifacts; reference them | Reference run files by path (`.agent/runs/<id>/plan.md#appendix-b`), code by `path:line`, and the change set by `git diff --cached <base_sha> -- <path>`. Never paste the plan, a report or a diff. |
| Redact sensitive information | Same: no keys, passwords, tokens, connection strings, customer data or personal data. |

Keep it short, usually under 300 words. Use this shape:

```markdown
# Handoff: <from> → <to> · <run-id> · <iteration or phase>

## For you
<One or two sentences: what the next agent must do now.>

## State
<What was done in this step and where it landed; status of each acceptance criterion if relevant.>

## Watch out for
<Non-obvious things: traps, assumptions made, decisions that constrain the next step, flaky tests, files that look related but aren't.>

## Open items
<Anything unresolved the next agent must handle or escalate.>

## References
- <path or URL>: <why it matters>

## Suggested skills
- <skill-name>: <why>
```
