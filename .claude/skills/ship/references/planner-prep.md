# Planner, mode `prep`

Inputs: the run dir (`task.md`), size, the orchestrator's note on who's next.

1. **Profile the repo.** Run `repo-context` discovery for the areas this task touches and produce `context.md`. Every later agent runs the commands you record, so each must be exact and check-only. Include the domain glossary (`GLOSSARY.md`, the context's glossary via `GLOSSARY-MAP.md`, or a `CONTEXT.md` glossary) and `docs/adr/` among the sources.
2. **Load skills.** Call the Skill tool for each repo or user skill relevant to the task.
3. **Find the ground.** Locate the code to change, the closest existing example of a similar change, and the tests covering this area (read them).
4. **Build the design tree.** List every decision the task needs and which depend on which, split into:
   - **Facts**: anything the code, config, docs, git history or ticket can answer. Answer each yourself, with its source.
   - **Decisions**: choices only the user can make (behaviour, scope, trade-offs, domain names, data/migration strategy, rollout). Give each a recommended answer and why, the alternatives, and its dependencies.
5. **Sharpen terms.** Flag words in the task or code that are fuzzy, overloaded, or conflict with the glossary, and propose a canonical term for each.

Done when every decision has a recommendation and its dependencies, every fact has a source, and every command in `context.md` came from the repo.

Return exactly:

~~~
<context.md>
=====FRONTIER=====
# Design frontier: <task title>

## Facts found
- <fact> (source: path:line | doc | commit)

## Terms to sharpen
- "<term as used>" → **<canonical term>**; conflicts with: <glossary entry or code usage>

## Open decisions
1. **<Short title>**: <the question>
   ➡️ Recommended: <answer>, because <reason>. Alternatives: <a>, <b>.
   Depends on: none | #<n>

(or "None." when nothing is open)
=====HANDOFF=====
<handoff to the orchestrator for grilling: which decisions matter most, where you were least sure, where the user may push back>
~~~
