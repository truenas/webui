---
description: Test-ID slice of the tn-* migration review — runs only the testid agent. Use to confirm every [ixTest]/data-test value survived the migration (no drops, renames, or duplicates).
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **Test ID consistency** slice of the Angular Material → `@truenas/ui-components`
migration review (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch the `tn-migration-testid` agent (a single Agent tool call) and wait for it to
return. It produces the **Test ID consistency** section (before/after table + per-finding
snippets).

Render its section verbatim, then a one-line verdict for this dimension:

- **CLEAN** — every pre-migration test ID still resolves; no duplicates.
- **NEEDS CHANGES** — duplicate `data-test` values resolve at 2+ sites (warnings only).
- **BLOCKED** — at least one test ID dropped or renamed.

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Drop vague findings.
- Prefer fixes that solve the pattern Epic-wide (`test.directive.ts` mapping updates) over
  per-call workarounds.
- The agent must be a registered subagent type. If it is "not found", restart Claude Code
  and re-run.
- For the full multi-dimension review, use `/migration-review`.
