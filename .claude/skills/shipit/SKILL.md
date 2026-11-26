---
name: shipit
description: Ship a ticket or task end to end (plan, implement, verify, review, commit) with gated subagents. Use for /shipit, or a request to build or implement a ticket.
---

# /shipit

You are the **orchestrator**: you dispatch the agents, own the run files, hold the gates, and decide when to loop or stop. The agents write the code and the reports; agents can't dispatch agents, so every fan-out happens here.

`$ARGUMENTS`: a ticket key (`CC-123`) or free-text task, plus optional flags: `--auto` (unattended: no grilling, no plan gate), `--lite` / `--full` (plan size), `--no-grill`.

Call the Skill tool for `run-handoff` now, and for `writing-for-agents` before you first write a document an agent will read (`task.md`, `decisions.md`, handoffs, revision notes).

## Run files

`.agent/runs/<run-id>/`, where `<run-id>` is the ticket key or a task slug + `YYYYMMDD-HHMM`:

| File | Written by you, from |
|---|---|
| `state.json` | `templates/state.json`; update after every phase |
| `task.md` | `templates/task.md` at intake |
| `context.md`, `frontier.md` | planner `prep` |
| `decisions.md` | the grilling session |
| `plan.md` | planner `write` |
| `verify-<n>.md`, `review-standards.md`, `review-spec.md` | verifier, reviewers |
| `handoffs/NN-<from>-to-<to>.md` | every agent's handoff, and yours |
| `summary.md` | `templates/summary.md` at the end |

The planner, verifier and reviewers return their documents as text; save each verbatim. A run dir that already exists means **resume**: read the newest handoff, then continue from `state.json.phase`.

## Dispatching an agent

Every dispatch passes: the run dir; the handoff(s) addressed to that agent; a one-line note on who comes next and what they'll do. Every agent returns its output, a line `=====HANDOFF=====`, then its handoff; save it and pass its path on.

| Step finishes | Handoff goes to |
|---|---|
| planner `prep` | you (grilling) |
| grilling | planner `write` |
| planner `write` | implementer |
| implementer | verifier |
| verifier | implementer on FAIL, both reviewers on PASS |
| reviewers | implementer (fix pass, both handoffs), or you when clean |
| stop, interrupt, or end | the next session: your own handoff |

**Change set.** Nothing is committed until phase 6 and new files start untracked, so before every verify and every review run `git add -A` and pass `base_sha`. Agents read the change set with `git diff --cached <base_sha>`.

**Read-only check.** Around the planner, verifier and reviewers: record `git status --porcelain=v1 -uall` and `git diff HEAD | sha256sum` before dispatch and compare after. A difference means the agent changed the repo: stop, show the user `git status` and the diff, and ask whether to keep or discard it. Output in gitignored paths doesn't count.

## Phases

### 0. Intake
1. **Ticket.** For a ticket key, fetch summary, description, acceptance criteria and links with the Atlassian tools. When they're missing or unauthorised, tell the user the Jira connector needs authorising in claude.ai connector settings, and ask them to paste the ticket or proceed from the key alone.
2. **Clean tree.** `git status --porcelain` must be empty. Otherwise ask: commit, stash (`git stash push -u -m "before /shipit <run-id>"`) or abort.
3. **Branch.** Default branch = `git symbolic-ref --short refs/remotes/origin/HEAD` without `origin/`, else `main`, else `master`. Run `git switch -c <feat|fix|chore>/<run-id> <default>`; record `base_branch` and `base_sha` (`git rev-parse <default>`).
4. **Exclude run files.** Append `.agent/` to `.git/info/exclude` if absent.
5. **Task.** Write `task.md`. Derive missing acceptance criteria and mark each `(inferred)`.
6. **Size.** `lite` = at most 3 files and no schema/migration, public API, auth, payments, money or time-math change; `full` = everything else. Flags override. Tell the user the size and why in one line.

Done when the branch exists, `state.json` holds `base_sha` and `size`, and `task.md` has acceptance criteria.

### 1. Plan
1. **Prep.** Dispatch `planner` in mode `prep` (with the size). It returns `context.md`, `=====FRONTIER=====`, `frontier.md`, then its handoff. Save all three.
2. **Grill.** Unless `--no-grill`, `--auto`, or a `lite` task whose `frontier.md` has no open decisions: read `references/grilling.md` and run the interview. With `--auto`, write each recommended answer from `frontier.md` into `decisions.md` marked `assumed (auto)`.
3. **Write.** Dispatch `planner` in mode `write` with the size, `grill_docs` from `state.json`, and any revision notes. Save `plan.md` and its handoff.
4. **Gate** (skipped with `--auto`). Show the user, for `full`: *1. Introduction*, *2. Goals and non-goals*, *7. Risks and mitigations*, Appendix B's *Files* and *Standards & skills in effect*, and the path to `plan.md`; for `lite`: the whole plan. Ask with AskUserQuestion: **Approve** / **Revise** (notes) / **Abort**. Revise sends the notes to planner `write`; a note that reopens a decision gets a grilling round first. "Make it full/lite" re-plans at that size. After 3 revisions, ask how to proceed.

Done when the user approves `plan.md`, or `--auto` saved it.

### 2. Implement
Dispatch `implementer` with its handoff(s) and, on later passes, the latest `verify-<n>.md` and review files. A `DEVIATION` return goes to the user before anything else runs.

### 3. Verify
Stage the change set, then dispatch `verifier` with `base_sha` and iteration `n`. Save `verify-<n>.md`. FAIL returns to phase 2. The 4th FAIL ends the run: write `summary.md` with status `blocked` and tell the user.

### 4. Review
Stage the change set, then dispatch `reviewer-standards` and `reviewer-spec` in one message with `base_sha`. Findings are `blocker`, `should-fix` or `nit`.

### 5. Fix
With any `blocker` or `should-fix`: implementer with both reviews → phase 3 (same iteration cap) → phase 4 once more. Nits go to the summary.

Done when both reviews are clean or the second review has run.

### 6. Commit and push
1. Stage, show `git diff --cached --stat <base_sha>`, commit with a conventional message naming the ticket.
2. Write `summary.md` and your final handoff.
3. **Gate.** Ask with AskUserQuestion whether to push and open a PR. On yes, run `git push -u origin <branch>`; Claude Code asks the user again because `settings.json` puts `git push` in `ask`. Open the PR with `gh` when asked, using the summary as the body.

## Throughout
- Pass agents file paths; they read the files themselves.
- Standards come from the target repo via `repo-context`; `context.md` is the run's shared profile.
- On interruption, update `state.json` and write a handoff for the resuming session.
- Tell the user one line per phase.
