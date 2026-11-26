# Agent workflow scaffold — /shipit

Repo-agnostic orchestrator–worker pattern for Claude Code. Agents learn each repo's standards, commands and skills at run time.

```
/shipit CC-123
  intake ─► planner(prep) ─► GRILL with you ─► planner(write) ─► [GATE: approve plan]
            frontier.md      glossary · ADRs    plan.md
                             decisions.md
     ─► implementer ─► verifier ──FAIL (≤3)──► implementer
                          │ PASS
                          ▼
        reviewer-standards ║ reviewer-spec (parallel) ─► fix pass (once)
                          ▼
        commit ─► summary.md ─► [GATE: push]  (+ Claude Code's own push prompt)

state: .agent/runs/<run-id>/{state.json, task, context, frontier, decisions, plan, verify-n, review-*, summary, handoffs/}
```

## Design choices
- **Orchestrator in the main session** — subagents can't spawn subagents, so fan-out and loops live in the skill.
- **File-based handoffs** — agents pass paths, not content. Keeps each context small and makes runs resumable/auditable.
- **Bounded loops** — 3 implement↔verify iterations, 3 plan revisions, 1 re-review. Then stop and escalate.
- **Review sees everything**: nothing is committed until handoff, so before each verify and review the orchestrator stages the change set (`git add -A`) and agents read `git diff --cached <base_sha>`, which includes new files. Run files are kept out of git via `.git/info/exclude`.
- **Enforced read-only**: planner, verifier and reviewers have Edit/Write disallowed and return their reports for the orchestrator to save. The orchestrator also snapshots `git status` + diff around each one and stops if anything changed.
- **Clean start**: intake refuses a dirty working tree and branches from the default branch.
- **Separation of duties** — planner and reviewers are read-only; verifier never edits; implementer can't leave the plan's file list without reporting a deviation.
- **Repo-adaptive** — every agent preloads the `repo-context` skill: read CLAUDE.md/AGENTS.md (nested too), docs, tooling config and nearby code; invoke matching repo skills via the Skill tool. The planner writes `context.md` once per run so all agents share the same standards.
- **Grill before planning** ([grill-with-docs](https://www.aihero.dev/skills-grill-with-docs) by Matt Pocock): the planner first maps the open design decisions (`frontier.md`, facts already looked up); `/shipit` then interviews you round by round using the `grilling` and `domain-modeling` skills, writes resolved terms to `GLOSSARY.md` and hard-to-reverse decisions as ADRs in `docs/adr/`, and saves every answer in `decisions.md`. The planner writes the plan from those decisions. Skipped with `--no-grill` or `--auto`, and for lite tasks with nothing to decide.
- **Handoffs between agents** ([handoff](https://www.aihero.dev/skills-handoff)): every agent starts by reading the handoff addressed to it and ends with one for the next step, written per `handoff/SKILL.md` via the preloaded `run-handoff` skill (returned to the orchestrator and saved in `.agent/runs/<id>/handoffs/` instead of `$TMPDIR`, so runs stay resumable). Handoffs point at run files, code and diffs instead of copying them, list the skills the next agent should load, and redact secrets. The orchestrator writes them too: after grilling, on interruption, and at the end of the run.
- **Writing for agents** ([writing-for-agents](https://www.aihero.dev/skills-writing-for-agents)): every document an agent reads (handoffs, `task.md`, `decisions.md`, `context.md`, `frontier.md`, the plan's execution appendix) is written by it, and the workflow's own agent and skill files were rewritten by it. Agents load it on demand just before writing for another agent, rather than at startup. Material only some runs need (grilling, each planner mode, each plan format) lives in `skills/shipit/references/` and is read only when that branch runs; every step ends on a "Done when…" criterion.
- **Lite or full plans**: intake sizes the task. *Lite* (≤ 3 files, no schema/API/auth/money/time-math changes) gets a short plan in the repo's language only; *full* gets the six-pager. Override with `--lite` / `--full`.
- **Six-pager plans** — the planner writes `plan.md` as an Amazon-style six-pager (narrative sections 1–8 + FAQ, ≤ ~3,500 words) with appendices: A = code changes in TypeScript, JavaScript and Go, each with a worked "how it works" example; B = the execution plan the implementer follows; C = data and references.
- **Model tiering** — opus for planning/review (judgment), sonnet for implementation, haiku for running checks.
- **Permissions do the real work**: only named check scripts are pre-approved (no blanket `npm run:*`); `git push`, `git stash` and `gh pr create` always trigger Claude Code's own prompt, so a push needs your yes even after the handoff gate.
- **Guard hook (a seatbelt, not a sandbox)**: blocks recursive force deletes in any spelling, `find -delete`, force-push and remote branch deletes, `reset --hard`, `clean -f`, discard-all checkouts, history rewrites, destructive Mongo/SQL, publish, `curl | sh`, and any command or file access naming `.env*` (except `.example`/`.sample`/`.template`) or key files. For stronger isolation, run `/shipit` in a separate git worktree.
- **Safe test runs**: the planner never runs tests; the verifier uses check-only commands (no `--fix`, no snapshot updates) and runs integration tests only when `context.md` marks them safe locally (isolated DB or containers).

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
  skills/run-handoff/SKILL.md     # how agents read/write handoffs (preloaded by all)
  skills/grill-with-docs/ grilling/ domain-modeling/ handoff/ writing-for-agents/   # Matt Pocock's skills (MIT)
  skills/THIRD_PARTY_NOTICES.md
  skills/shipit/
    references/                   # grilling, planner-prep/-write, plan-full/-lite: read only when needed
    SKILL.md                      # the orchestrator
    templates/{state.json,task.md,summary.md}
.agent/runs/                      # per-run state (gitignore this)
```

## Install

Matt Pocock's skills (`grill-with-docs`, `grilling`, `domain-modeling`, `handoff`, `writing-for-agents`) are bundled in `.claude/skills/`, copied unmodified from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT); see `.claude/skills/THIRD_PARTY_NOTICES.md`. Copying `.claude/` installs them with everything else.

1. Copy `.claude/` and `.agent/` into the repo root; append `CLAUDE.snippet.md` to the repo's own CLAUDE.md. (Or put `.claude/agents` + `.claude/skills` in `~/.claude/` to use across every repo.)
2. `echo ".agent/runs/*" >> .gitignore && echo "!.agent/runs/.gitkeep" >> .gitignore`
3. Optional: add a Commands section to the repo's CLAUDE.md — otherwise agents derive commands from package.json / Makefile / CI.
4. Run `/shipit <small ticket>` as a smoke test. Add `--auto` to skip the plan gate.

## Notes
- Ticket intake (`/shipit CC-123`) needs the Atlassian connector authorised in claude.ai connector settings. Without it, `/shipit` asks you to paste the ticket instead of guessing.
