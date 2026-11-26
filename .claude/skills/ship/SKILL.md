---
name: ship
description: Run the full plan → implement → verify → review → fix loop for a ticket or task on this repo. Use when asked to "ship", "build", or "implement" a ticket (e.g. "/ship CC-123" or "/ship add overtime rounding to timesheets").
---

# /ship — orchestrated dev workflow

You are the **orchestrator**. You do not write production code yourself. You dispatch subagents, own the run state, write the run files, enforce gates, and decide when to loop or stop. Subagents cannot spawn subagents, so all fan-out happens here.

Input: `$ARGUMENTS` — a ticket key (e.g. `CC-123`) or a free-text task, plus optional flags: `--auto` (unattended: no grilling, no plan gate), `--lite` / `--full` (force the plan size), `--no-grill` (skip the design interview).

## Run state

Every run lives in `.agent/runs/<run-id>/` where `<run-id>` = ticket key, or a kebab slug of the task + `YYYYMMDD-HHMM`.

```
.agent/runs/<run-id>/
  state.json        # phase, counters, base, size, status — update after EVERY phase
  task.md           # the normalized task / acceptance criteria
  context.md        # repo profile: stack, commands, standards, skills (from planner)
  frontier.md       # open design decisions + facts found (planner prep pass)
  decisions.md      # every decision resolved in the grilling session
  plan.md           # planner output (approved version)
  verify-<n>.md     # verifier report per iteration
  review-standards.md
  review-spec.md
  summary.md        # final summary for the human
  handoffs/         # NN-<from>-to-<to>.md: context passed between agents (see below)
```

Copy `templates/state.json` to start. If a run dir already exists, **resume**: read the newest file in `handoffs/`, then continue from `state.json.phase`.

**You write every run file.** The planner, verifier and reviewers have no Write or Edit tool: they return their document as their final message and you save it to the path above, verbatim.

## Handoffs and agent-facing documents

Each step starts a fresh agent, so context travels in **handoff documents**. At the start of the run, call the Skill tool for `run-handoff` and `writing-for-agents`; they apply to you as well as to every agent (all agents preload `run-handoff`, the planner also preloads `writing-for-agents`).

- **Writing for agents.** Everything an agent will read (`task.md`, `decisions.md`, handoffs, the notes you pass on Revise) is written by `writing-for-agents`: what to do first, a clear completion criterion, pointers to material instead of copies, positive instructions, nothing the reader won't act on.
- **Every dispatch** passes: the path(s) of the handoff(s) addressed to that agent, and a one-line description of who comes next and what they'll do, so the agent can tailor its own handoff.
- **Every agent returns** its normal output, then a line `=====HANDOFF=====`, then its handoff. Save the handoff as `handoffs/NN-<from>-to-<to>.md` (NN = next two-digit number in the folder) and give its path to the next agent.
- **You write handoffs too**, following `run-handoff`: after grilling (→ planner `write`), when the run stops or is interrupted (→ whoever resumes `/ship <run-id>`), and at the end of the run (→ a follow-up session; reference `summary.md`, the commit and open items).

| Step finishes | Its handoff goes to |
|---|---|
| planner `prep` | you, for grilling |
| grilling (you) | planner `write` |
| planner `write` | implementer |
| implementer | verifier |
| verifier FAIL | implementer |
| verifier PASS | both reviewers (same handoff) |
| reviewers | implementer, for the fix pass (both handoffs), or you if clean |
| last step / stop | the next session, via your final handoff |

## The change set (used by verify and review)

Nothing is committed until phase 6, and new files start untracked, so `git diff` alone misses work. Before every verify and every review:

```bash
git add -A                                   # stage tracked + new files (.agent/ is excluded, see intake)
git diff --cached --name-only <base_sha>     # files in the change set
git diff --cached <base_sha>                 # the full change set
```

Pass `base_sha` to the verifier and reviewers and tell them to use exactly these commands. Staging is not committing; the commit happens in phase 6.

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

### 1. Plan — prep → grill → write

Planning uses Matt Pocock's **grill-with-docs** approach: before the plan is written, you interview the user about every open design decision, record sharpened domain terms in the repo's `GLOSSARY.md` and hard-to-reverse decisions as ADRs, then the planner writes the plan from those decisions.

`grill-with-docs` is user-invoked only and is simply "run `grilling` + `domain-modeling`", so you load those two skills directly. All three ship with this workflow in `.claude/skills/` (copied from mattpocock/skills, MIT; see `.claude/skills/THIRD_PARTY_NOTICES.md`). If `grilling` or `domain-modeling` can't be loaded, tell the user, and ask whether to continue with `--no-grill`. Don't imitate the skills from memory.

#### 1a. Prep — `planner` (mode `prep`)
- Run the read-only check around it.
- Dispatch `planner` with: `task.md`, the run dir, size, mode `prep`. It returns `context.md`, `frontier.md` and its handoff to you, separated by `=====FRONTIER=====` and `=====HANDOFF=====`. Save all three; read the handoff before grilling.
- `frontier.md` lists the **facts it already looked up** (never ask the user these) and the **open decisions** as a tree, each with a recommended answer and its dependencies.

#### 1b. Grill — you, with the user
Skip when: `--no-grill`; `--auto` (then copy every recommended answer into `decisions.md` marked `assumed (auto)` and write no glossary/ADR); or size `lite` **and** `frontier.md` has no open decisions.

Otherwise:
1. Call the Skill tool for `grilling` and for `domain-modeling`, and follow them for the rest of this step.
2. Seed the design tree from `frontier.md`. Ask in rounds exactly as `grilling` prescribes (numbered questions, bold title, a ➡️ recommended answer, phrased so "yes" accepts it), only for decisions whose prerequisites are settled. Look up facts yourself (or with a read-only subagent) instead of asking.
3. As `domain-modeling` prescribes, challenge terms against the repo's `GLOSSARY.md` (or the context's glossary when a `GLOSSARY-MAP.md` exists), write each resolved term to it immediately, and offer an ADR in `docs/adr/` only when a decision is hard to reverse, surprising without context, and the result of a real trade-off. These files are written on the run's branch and become part of the change set.
4. After each round, append the resolved decisions to `decisions.md`:
   `- **<decision>**: <answer> (why: <reason>) [ADR-NNNN if recorded]`
   This file matters: the planner can't see this conversation, so anything not written here is lost.
5. End when the frontier is empty and the user confirms you share an understanding. Record in `state.json`: `grilled: true`, the list of glossary/ADR files written (`grill_docs`). Write your handoff to the planner (`write`): what the user cared about most, which decisions were contested and why, which terms changed in the glossary, and anything said in the interview that `decisions.md` doesn't capture.

#### 1c. Write — `planner` (mode `write`)
- Run the read-only check around it.
- Dispatch `planner` with: `task.md`, the run dir (it reads `context.md`, `frontier.md`, `decisions.md`, and the glossary/ADRs), size, mode `write`, the `grill_docs` list, any revision notes, and the latest handoff. It returns `plan.md` and its handoff to the implementer. Save both.

#### Plan gate (human), skipped only with `--auto`
- `full`: show *1. Introduction*, *2. Goals and non-goals*, *7. Risks and mitigations*, and from Appendix B the *Files* table and *Standards & skills in effect*, plus the path to `plan.md` (the full read includes the TypeScript/JavaScript/Go snippets in Appendix A).
- `lite`: show the whole plan; it's short.
- Ask with AskUserQuestion: **Approve** / **Revise** (with notes) / **Abort**. Revise → planner `write` again with the notes (if a note reopens a design decision, run another grilling round first and update `decisions.md`). Max 3 revisions, then stop and ask. The user may also answer "make it full/lite" to re-plan at the other size.

### 2. Implement — `implementer` agent
- Dispatch `implementer` with the run dir (it reads `task.md`, `context.md`, `plan.md`), the handoff(s) addressed to it, and, on later iterations, the latest `verify-<n>.md` and/or review files to address.
- It must stay inside Appendix B → Files. If it returns `DEVIATION`, bring that to the user before continuing.

### 3. Verify — `verifier` agent
- Stage the change set (above). Run the read-only check around the verifier.
- Dispatch `verifier` with the run dir, `base_sha`, the iteration number and the implementer's handoff. Save its report as `verify-<n>.md` and its handoff.
- FAIL → back to phase 2 with the report. **Max 3 implement↔verify iterations.** On the 4th failure: stop, write `summary.md` with status `blocked`, report to the user.

### 4. Review — `reviewer-standards` + `reviewer-spec` in PARALLEL
- Stage the change set. Run the read-only check around both.
- Dispatch both in one message with the run dir, `base_sha` and the verifier's PASS handoff. Save their reports as `review-standards.md` and `review-spec.md`, and both handoffs.
- Findings are tagged `blocker | should-fix | nit`.

### 5. Fix
- Any `blocker` or `should-fix`: dispatch `implementer` with both review files → phase 3 (same iteration cap) → phase 4 **once more**. Nits go in the summary, not fixed unless trivial.
- Clean: continue.

### 6. Commit and push
1. Stage the change set and show the user `git diff --cached --stat <base_sha>`.
2. Commit with a conventional message referencing the ticket.
3. Write `summary.md` from `templates/summary.md`: what changed, how it was verified, open nits, follow-ups. Then write the final handoff for a follow-up session.
4. **GATE (human):** ask with AskUserQuestion whether to push (and open a PR). On approval, run `git push -u origin <branch>`. Claude Code then shows its own permission prompt for the push (`settings.json` puts `git push` in `ask`), so the push needs the user's yes twice and an agent can never push on its own. Force-push is always blocked by the guard hook.
5. If `gh` is available and the user asked for a PR, open it with the summary as the body.

## Rules
- Update `state.json` after every phase transition (phase, iteration, last_result, timestamps).
- Pass subagents **file paths**, not pasted content.
- The workflow is repo-agnostic: never hardcode stack rules here. Standards come from the target repo via `repo-context`; `context.md` is the single source every agent shares for a run.
- Never let a subagent change files outside the plan without surfacing it.
- If the user interrupts, persist state and write a handoff for the resuming session, so `/ship <run-id>` can pick up from it.
- Report progress to the user in one line per phase.
