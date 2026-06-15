---
description: Spec/test-harness slice of the tn-* migration review — runs only the harness agent. Swaps Mat harnesses for tn-*, checks mocks/viewChild/jest-axe, and runs the spec. Use after touching a migrated component's spec.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **Test migrations** slice of the Angular Material → `@truenas/ui-components`
migration review (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch the `tn-migration-harness` agent (a single Agent tool call) and wait for it to
return. It produces the **Test migrations** section (per-spec pass/fail table + per-finding
snippets). It runs the install-freshness gate, then executes each migrated spec.

Render its section verbatim, then a one-line verdict for this dimension:

- **CLEAN** — specs use tn-* harnesses, no white-box DOM queries, and run green.
- **NEEDS CHANGES** — warnings (white-box signal reads where no harness exists yet, `done`
  callbacks, full-object mocks).
- **BLOCKED** — Material harness left against a tn-* surface, a `spectator.query('.css')` on
  a migrated surface where a tn-* harness exists, a mock of a now-deleted component, or a
  passing spec that tests the wrong thing.

If the agent returns `BLOCKED — install drift unresolved`, surface that as the sole finding
and stop — a `'ɵcmp'` failure before the gate may be install drift, not a real bug.

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Drop vague findings.
- The agent must be a registered subagent type. If it is "not found", restart Claude Code
  and re-run.
- For the full multi-dimension review, use `/migration-review`.
