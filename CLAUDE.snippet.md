# CLAUDE.md: /ship section
<!-- Append to the target repo's CLAUDE.md (or AGENTS.md); /ship agents read the rest of that file for the repo's standards. -->

## Agent workflow
- Non-trivial changes go through `/ship <ticket|task>`.
- Commands (agents run exactly these, check-only):
  - Typecheck: `<cmd>`
  - Lint: `<cmd>`
  - Tests: `<cmd>` · single file: `<cmd>`
  - Integration: `<cmd>` · safe locally: <yes, uses an isolated DB | no>
  - Build: `<cmd>`
- Repo skills in `.claude/skills/` are picked up by their `description`: say when each applies.
- Pushes and PRs happen only after the user approves them.
