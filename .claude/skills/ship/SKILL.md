---
name: ship
description: Run the full plan → implement → verify → review → fix loop for a ticket or task on this repo. Use when asked to "ship", "build", or "implement" a ticket (e.g. "/ship CC-123" or "/ship add overtime rounding to timesheets").
---

# /ship — orchestrated dev workflow

You are the **orchestrator**. You do not write production code yourself. You dispatch subagents, own the run state, enforce gates, and decide when to loop or stop. Subagents cannot spawn subagents, so all fan-out happens here.

Input: `$ARGUMENTS` — a ticket key (e.g. `CC-123`) or a free-text task.

## Run state

Every run lives in `.agent/runs/<run-id>/` where `<run-id>` = ticket key, or a kebab slug of the task + `YYYYMMDD-HHMM`.

```
.agent/runs/<run-id>/
  state.json        # phase, iteration counters, status — update after EVERY phase
  task.md           # the normalized task / acceptance criteria
  context.md        # repo profile: stack, commands, standards, skills in effect (planner)
  plan.md           # planner output (approved version)
  verify-<n>.md     # verifier report per iteration
  review-standards.md
  review-spec.md
  summary.md        # final handoff
```

Copy `templates/state.json` to start. If a run dir already exists, **resume** from `state.json.phase` instead of restarting.

## Phases

### 0. Intake
- If `$ARGUMENTS` looks like a ticket key and the Atlassian tools are available, fetch the issue (summary, description, acceptance criteria, linked issues). Otherwise use the text as-is.
- Write `task.md` using `templates/task.md`. If acceptance criteria are missing, derive them and mark each `(inferred)`.
- Create a branch: `git checkout -b <type>/<run-id>` (type = feat|fix|chore).

### 1. Plan — `planner` agent
- Dispatch `planner` with: path to `task.md` and the run dir. It discovers the repo's standards, commands and skills (preloaded `repo-context` skill), writes `context.md`, then `plan.md`.
- **GATE (human):** show the user the plan's *Summary*, *Standards & skills in effect*, *Files*, and *Risks* sections and ask for approval with AskUserQuestion: Approve / Revise (with notes) / Abort. Loop to planner with notes on Revise. Max 3 revisions, then stop and ask.
- Skip this gate only if the user passed `--auto` in `$ARGUMENTS`.

### 2. Implement — `implementer` agent
- Dispatch `implementer` with: `plan.md`, `task.md`, and (on later iterations) the latest `verify-<n>.md` and/or review files to address.
- Implementer must stay inside the plan's file list. If it reports it needs to deviate, bring that back to the user before continuing.

### 3. Verify — `verifier` agent
- Dispatch `verifier` with the run dir. It writes `verify-<n>.md` with PASS/FAIL per check.
- FAIL → back to phase 2 with the report. **Max 3 implement↔verify iterations.** On the 4th failure, stop, write `summary.md` with status `blocked`, and report to the user.

### 4. Review — `reviewer-standards` + `reviewer-spec` in PARALLEL
- Dispatch both in a single message (parallel). Each reads `git diff main...HEAD` (or the repo's default branch) and writes its own review file.
- Findings are tagged `blocker | should-fix | nit`.

### 5. Fix
- If any `blocker` or `should-fix`: dispatch `implementer` with both review files → re-run phase 3 (counts against the same iteration cap) → re-run phase 4 **once**. Nits are listed in the summary, not fixed, unless trivial.
- If clean: continue.

### 6. Handoff
- Commit with a conventional message referencing the ticket.
- Write `summary.md` (`templates/summary.md`): what changed, how verified, open nits, follow-ups.
- **GATE (human):** ask before pushing or opening a PR. Never push without explicit approval.

## Rules
- Update `state.json` after every phase transition (phase, iteration, last_result, timestamps).
- Pass subagents **file paths**, not pasted content — keeps their context clean.
- The workflow is repo-agnostic: never hardcode stack rules here. Standards come from the target repo via `repo-context`; `context.md` is the single source every agent shares for a run.
- Never let a subagent edit files outside the plan without surfacing it.
- If the user interrupts, persist state first so `/ship <run-id>` can resume.
- Report progress to the user in one line per phase.
