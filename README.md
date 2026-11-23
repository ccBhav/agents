# Agent workflow scaffold — /ship

Repo-agnostic orchestrator–worker pattern for Claude Code. Agents learn each repo's standards, commands and skills at run time.

```
            /ship CC-123
                 │
   ┌─────────── orchestrator (main session, skills/ship) ───────────┐
   │                                                                │
 intake ─► planner ─► [HUMAN GATE] ─► implementer ─► verifier ──┐   │
                                          ▲            FAIL (≤3)│   │
                                          └─────────────────────┘   │
                                     PASS ▼                         │
                    reviewer-standards ║ reviewer-spec  (parallel)  │
                                     ▼                              │
                         fix pass (implementer → verifier)          │
                                     ▼                              │
                           commit ─► summary ─► [HUMAN GATE: push]  │
   └────────────────────────────────────────────────────────────────┘
        state: .agent/runs/<run-id>/{state.json, plan.md, verify-n.md, review-*.md}
```

## Design choices
- **Orchestrator in the main session** — subagents can't spawn subagents, so fan-out and loops live in the skill.
- **File-based handoffs** — agents pass paths, not content. Keeps each context small and makes runs resumable/auditable.
- **Bounded loops** — 3 implement↔verify iterations, 3 plan revisions, 1 re-review. Then stop and escalate.
- **Separation of duties** — planner and reviewers are read-only; verifier never edits; implementer can't leave the plan's file list without reporting a deviation.
- **Repo-adaptive** — every agent preloads the `repo-context` skill: read CLAUDE.md/AGENTS.md (nested too), docs, tooling config and nearby code; invoke matching repo skills via the Skill tool. The planner writes `context.md` once per run so all agents share the same standards.
- **Six-pager plans** — the planner writes `plan.md` as an Amazon-style six-pager (narrative sections 1–8 + FAQ, ≤ ~3,500 words) with appendices: A = code changes in TypeScript, JavaScript and Go, each with a worked "how it works" example; B = the execution plan the implementer follows; C = data and references.
- **Model tiering** — opus for planning/review (judgment), sonnet for implementation, haiku for running checks.
- **Guard hook** — blocks push, `rm -rf`, `reset --hard`, destructive Mongo, and `.env`/key edits regardless of what any agent decides.

## Layout
```
CLAUDE.snippet.md                 # snippet to APPEND to the target repo's CLAUDE.md
.claude/
  settings.json                   # permissions + PreToolUse hook
  hooks/guard.mjs
  agents/
    planner.md                    # read-only → plan.md
    implementer.md                # code + tests
    verifier.md                   # runs gates → verify-n.md
    reviewer-standards.md         # how it's written
    reviewer-spec.md              # does it meet the task
  skills/repo-context/SKILL.md    # discovery protocol, preloaded by all agents
  skills/ship/
    SKILL.md                      # the orchestrator
    templates/{state.json,task.md,summary.md}
.agent/runs/                      # per-run state (gitignore this)
```

## Install
1. Copy `.claude/` and `.agent/` into the repo root; append `CLAUDE.snippet.md` to the repo's own CLAUDE.md. (Or put `.claude/agents` + `.claude/skills` in `~/.claude/` to use across every repo.)
2. `echo ".agent/runs/*" >> .gitignore && echo "!.agent/runs/.gitkeep" >> .gitignore`
3. Optional: add a Commands section to the repo's CLAUDE.md — otherwise agents derive commands from package.json / Makefile / CI.
4. Run `/ship <small ticket>` as a smoke test. Add `--auto` to skip the plan gate.
