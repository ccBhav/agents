---
name: repo-context
description: Learn a repo's standards, commands and skills before planning, coding, verifying or reviewing in it. Preloaded by /ship agents; use at the start of work in an unfamiliar repo.
---

# Repo context

Learn the repo's conventions from the repo, then follow them.

1. **Cached profile.** When the run dir has `context.md`, read it and go to step 4, re-discovering only paths it doesn't cover.
2. **Rules, highest priority first** (higher wins on conflict):
   1. `CLAUDE.md` / `AGENTS.md` at the root, and nested ones in directories you'll touch (nested wins for its subtree).
   2. `.claude/rules/`, `docs/adr/`, `docs/architecture*`, `CONTRIBUTING.md`, `STYLEGUIDE.md`, and the domain glossary: `GLOSSARY.md`, the context's glossary via `GLOSSARY-MAP.md`, or a `CONTEXT.md` glossary. Use its canonical terms.
   3. Tooling config, the enforced truth: package scripts, tsconfig, linter/formatter config, `pyproject.toml`, `Makefile`, `go.mod`, `.editorconfig`, CI workflows.
   4. The code: 2–3 recent, well-tested files in the module you're changing. With nothing written down, their shape is the convention.
3. **Skills.** Read the `description` of each skill in `.claude/skills/`, plus your user and plugin skills. Call the Skill tool for each one whose description matches the task's domain, before starting the work. Count skills about building or reviewing code; output-format skills (docx, pptx…) are for documents.
4. **Profile.** The planner produces this as `context.md`; other agents confirm it:

```
# Repo context
Stack: <language, framework, db, test runner>
Commands (check-only):
  typecheck: <cmd | none>
  lint: <cmd>
  test: <cmd>   single file: <cmd>
  build: <cmd | none>
  integration: <cmd | none>   safe locally: yes (isolated DB/containers/mocks) | no | unknown
Layering: <how code is organised>
Standards (source → rule):
  - CLAUDE.md → ...
Skills in effect: <name: why>
Gaps: <what nothing defines, and the default used>
```

5. **Defaults, for gaps only** (list each under Gaps): match the surrounding code's naming, errors and test style; authorisation on every new entry point; queries scoped to the caller's tenant/account in multi-tenant repos; input validated at the boundary; secrets and PII kept out of logs; time stored in UTC and converted at the edges; a test for every behaviour change.

A repo convention you'd do differently stays as it is; record it as a follow-up.

Done when every command in the profile came from the repo and every rule has a source.
