---
name: repo-context
description: Discover the standards, commands, and skills of the repo you are working in before planning, coding, verifying, or reviewing. Preloaded by every /ship agent; also use at the start of any task in an unfamiliar repo.
---

# Repo context discovery

You do not assume a stack, layout, or style. You learn it from the repo, then follow it.

## 1. Check for a cached profile
If the run dir has `context.md` (written by the planner), read it and skip to step 4. Re-run discovery only for paths you touch that it doesn't cover.

## 2. Read the repo's own rules — in priority order
Higher wins on conflict.
1. `CLAUDE.md` / `AGENTS.md` at the repo root, plus any nested ones in directories you will touch (nested overrides root for that subtree).
2. `.claude/rules/`, `docs/adr/`, `docs/architecture*`, `CONTRIBUTING.md`, `STYLEGUIDE.md`, and the domain glossary: `GLOSSARY.md` (or, if `GLOSSARY-MAP.md` exists, the glossary for the context you're in; some repos keep it in `CONTEXT.md`). Use its canonical terms.
3. Tooling config — the enforced truth: `package.json` scripts, `tsconfig*.json`, eslint/prettier/biome config, `pyproject.toml`, `ruff.toml`, `Makefile`, `go.mod`, `.editorconfig`, CI workflows (`.github/workflows/*`).
4. The code itself: 2–3 recent, well-tested files in the same module as your change. Their structure is the convention when nothing is written down.

## 3. Find skills
- List repo skills: `ls .claude/skills/` and read each `SKILL.md` frontmatter `description`.
- Also consider user/plugin skills available to you.
- A skill is relevant if its description matches the task's domain (e.g. architecture, API conventions, testing, a framework, a service like Stripe). Invoke every relevant one with the Skill tool **before** you start the work. Don't invoke skills that only produce output formats (docx, pptx, …).

## 4. Record what's in effect
Produce (planner) or confirm (others) a profile. The planner returns it and the orchestrator saves it as `<run-dir>/context.md`:

```
# Repo context
Stack: <language, framework, db, test runner>
Commands (check-only forms, no --fix/--write):
  typecheck: <cmd | none>
  lint: <cmd>
  test: <cmd>   single file: <cmd>
  build: <cmd | none>
  integration: <cmd | none>   safe locally: yes (isolated DB/containers/mocks) | no | unknown
Layering / structure: <how code is organised, from docs or observed>
Standards (source → rule):
  - CLAUDE.md → ...
  - eslint → ...
  - observed in src/services/* → ...
Skills in effect: <skill names + one line why>
Gaps: <things not defined anywhere — the default you'll use>
```

## 5. Defaults only when the repo is silent
Use these only for gaps, and list them under **Gaps**:
- Match the surrounding code's naming, error handling, and test style.
- Authorization on every new entry point; scope data queries to the caller's tenant/account if the repo is multi-tenant.
- Validate input at the boundary; no secrets or PII in logs.
- Time stored in UTC, converted at the edges.
- Every behaviour change gets a test.

Never "improve" a repo convention you disagree with. Note it as a follow-up instead.
