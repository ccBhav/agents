---
name: ship
description: Run the full plan → implement → verify → review → fix loop for a ticket or task on this repo. Use when asked to "ship", "build", or "implement" a ticket (e.g. "/ship CC-123" or "/ship add overtime rounding to timesheets").
---

# /ship — orchestrated dev workflow

You are the **orchestrator**. You do not write production code yourself. You dispatch subagents, own the run state, write the run files, enforce gates, and decide when to loop or stop. Subagents cannot spawn subagents, so all fan-out happens here.

Input: `$ARGUMENTS` — a ticket key (e.g. `CC-123`) or a free-text task, plus optional flags: `--auto` (skip the plan gate), `--lite` / `--full` (force the plan size).

## Run state

Every run lives in `.agent/runs/<run-id>/` where `<run-id>` = ticket key, or a kebab slug of the task + `YYYYMMDD-HHMM`.

```
.agent/runs/<run-id>/
  state.json        # phase, counters, base, size, status — update after EVERY phase
  task.md           # the normalized task / acceptance criteria
  context.md        # repo profile: stack, commands, standards, skills (from planner)
  plan.md           # planner output (approved version)
  verify-<n>.md     # verifier report per iteration
  review-standards.md
  review-spec.md
  summary.md        # final handoff
```

Copy `templates/state.json` to start. If a run dir already exists, **resume** from `state.json.phase` instead of restarting.

**You write every run file.** The planner, verifier and reviewers have no Write or Edit tool: they return their document as their final message and you save it to the path above, verbatim.

## The change set (used by verify and review)

Nothing is committed until handoff, and new files start untracked, so `git diff` alone misses work. Before every verify and every review:

```bash
git add -A                                   # stage tracked + new files (.agent/ is excluded, see intake)
git diff --cached --name-only <base_sha>     # files in the change set
git diff --cached <base_sha>                 # the full change set
```

Pass `base_sha` to the verifier and reviewers and tell them to use exactly these commands. Staging is not committing; the commit happens at handoff.

## Read-only check

Before dispatching the planner, verifier or a reviewer, record `git status --porcelain=v1 -uall` and `git diff HEAD | sha256sum`. When it returns, compare. If anything changed, the agent modified the repo: stop, show the user `git status` and the diff, and ask whether to keep or discard the changes (`git checkout -- <files>` / delete new files). Never continue silently. Build or test output in gitignored paths doesn't count.

## Phases

### 0. Intake
1. **Ticket.** If `$ARGUMENTS` looks like a ticket key (`ABC-123`), fetch it with the Atlassian tools: summary, description, acceptance criteria, linked issues. If those tools are missing or unauthorised, **don't treat the key as the task**: tell the user the Jira connector needs authorising in their claude.ai connector settings, and ask them to paste the ticket text or continue without it.
2. **Clean tree.** Run `git status --porcelain`. If anything is listed, stop and ask: commit it, stash it (`git stash push -u -m "before /ship <run-id>"`), or abort. Never carry uncommitted work onto the new branch.
3. **Branch from the default branch.** Default = `git symbolic-ref --short refs/remotes/origin/HEAD` minus `origin/`, else `main`, else `master`. Run `git switch -c <type>/<run-id> <default>` (type = feat|fix|chore). Record `base_branch` and `base_sha` (`git rev-parse <default>`) in `state.json`.
4. **Keep run files out of git** without touching the repo's `.gitignore`: append `.agent/` to `.git/info/exclude` if it isn't there.
5. **Task.** Write `task.md` from `templates/task.md`. If acceptance criteria are missing, derive them and mark each `(inferred)`.
6. **Size.** Classify and record `size` in `state.json`:
   - `lite`: touches ≤ 3 files, and changes no schema/migration, public API, auth, payments, money or time math.
   - `full`: anything else.
   `--lite` / `--full` override. Tell the user the size and why in one line.

### 1. Plan — `planner` agent
- Run the read-only check around it.
- Dispatch `planner` with: path to `task.md`, the run dir, and the size (`lite` or `full`). It returns two documents, `context.md` and `plan.md`, separated by a line `=====PLAN=====`. Save both.
- **GATE (human), skipped only with `--auto`:**
  - `full`: show *1. Introduction*, *2. Goals and non-goals*, *7. Risks and mitigations*, and from Appendix B the *Files* table and *Standards & skills in effect*, plus the path to `plan.md` (the full read includes the TypeScript/JavaScript/Go snippets in Appendix A).
  - `lite`: show the whole plan; it's short.
  - Ask with AskUserQuestion: **Approve** / **Revise** (with notes) / **Abort**. Revise → back to the planner with the notes. Max 3 revisions, then stop and ask. The user may also answer "make it full/lite" to re-plan at the other size.

### 2. Implement — `implementer` agent
- Dispatch `implementer` with the run dir (it reads `task.md`, `context.md`, `plan.md`) and, on later iterations, the latest `verify-<n>.md` and/or review files to address.
- It must stay inside Appendix B → Files. If it returns `DEVIATION`, bring that to the user before continuing.

### 3. Verify — `verifier` agent
- Stage the change set (above). Run the read-only check around the verifier.
- Dispatch `verifier` with the run dir, `base_sha` and the iteration number. Save its report as `verify-<n>.md`.
- FAIL → back to phase 2 with the report. **Max 3 implement↔verify iterations.** On the 4th failure: stop, write `summary.md` with status `blocked`, report to the user.

### 4. Review — `reviewer-standards` + `reviewer-spec` in PARALLEL
- Stage the change set. Run the read-only check around both.
- Dispatch both in one message with the run dir and `base_sha`. Save their reports as `review-standards.md` and `review-spec.md`.
- Findings are tagged `blocker | should-fix | nit`.

### 5. Fix
- Any `blocker` or `should-fix`: dispatch `implementer` with both review files → phase 3 (same iteration cap) → phase 4 **once more**. Nits go in the summary, not fixed unless trivial.
- Clean: continue.

### 6. Handoff
1. Stage the change set and show the user `git diff --cached --stat <base_sha>`.
2. Commit with a conventional message referencing the ticket.
3. Write `summary.md` from `templates/summary.md`: what changed, how it was verified, open nits, follow-ups.
4. **GATE (human):** ask with AskUserQuestion whether to push (and open a PR). On approval, run `git push -u origin <branch>`. Claude Code then shows its own permission prompt for the push (`settings.json` puts `git push` in `ask`), so the push needs the user's yes twice and an agent can never push on its own. Force-push is always blocked by the guard hook.
5. If `gh` is available and the user asked for a PR, open it with the summary as the body.

## Rules
- Update `state.json` after every phase transition (phase, iteration, last_result, timestamps).
- Pass subagents **file paths**, not pasted content.
- The workflow is repo-agnostic: never hardcode stack rules here. Standards come from the target repo via `repo-context`; `context.md` is the single source every agent shares for a run.
- Never let a subagent change files outside the plan without surfacing it.
- If the user interrupts, persist state first so `/ship <run-id>` can resume.
- Report progress to the user in one line per phase.
