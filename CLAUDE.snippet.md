# CLAUDE.md — workflow section
<!-- Append this to the target repo's existing CLAUDE.md (or AGENTS.md). Don't replace it:
     the /ship agents read the repo's own CLAUDE.md for standards. -->

## Agent workflow
- Use `/ship <ticket|task>` for any non-trivial change. See `.claude/skills/ship/SKILL.md`.
- Agents discover this repo's standards, commands and skills automatically (`repo-context` skill).
  To make that faster and exact, keep a **Commands** section in this file:
  - Typecheck: `<cmd>`
  - Lint: `<cmd>`
  - Tests: `<cmd>` · single file: `<cmd>`
  - Build: `<cmd>`
- Repo-specific skills in `.claude/skills/` are picked up when their description matches the task — write descriptions that say when they apply.
- Run state lives in `.agent/runs/` (gitignored).
- Never push, force-push, or open a PR without explicit user approval.
